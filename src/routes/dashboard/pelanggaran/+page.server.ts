import { error, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireGuruOrAdmin } from '$lib/server/auth/guard';
import {
	studentViolationSchema,
	violationTypeSchema,
	verifyViolationSchema
} from '$lib/validation/pelanggaran';
import {
	studentViolations,
	violationTypes,
	students,
	users,
	academicYears,
	studentPointSummaries
} from '$lib/server/db/schema';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireGuruOrAdmin(locals.user);
	const db = locals.db;
	const schoolId = user.schoolId;
	const isAdmin = user.role === 'admin_sekolah';

	// Daftar pelanggaran terbaru (100 terakhir)
	const violationList = await db
		.select({
			id: studentViolations.id,
			date: studentViolations.date,
			description: studentViolations.description,
			points_snapshot: studentViolations.points_snapshot,
			status: studentViolations.status,
			created_at: studentViolations.created_at,
			student_name: users.name,
			student_nis: students.nis,
			violation_name: violationTypes.name,
			violation_category: violationTypes.category,
			reporter_id: studentViolations.reported_by
		})
		.from(studentViolations)
		.leftJoin(students, eq(students.id, studentViolations.student_id))
		.leftJoin(users, eq(users.id, students.user_id))
		.leftJoin(violationTypes, eq(violationTypes.id, studentViolations.violation_type_id))
		.where(
			and(
				eq(studentViolations.school_id, schoolId),
				isNull(studentViolations.deleted_at),
				// Guru hanya lihat yang dia laporkan
				...(isAdmin ? [] : [eq(studentViolations.reported_by, user.userId)])
			)
		)
		.orderBy(desc(studentViolations.date), desc(studentViolations.created_at))
		.limit(100);

	// Daftar jenis pelanggaran aktif
	const violationTypeList = await db
		.select()
		.from(violationTypes)
		.where(and(eq(violationTypes.school_id, schoolId), eq(violationTypes.is_active, 1)))
		.orderBy(violationTypes.category, violationTypes.name);

	// Semua jenis pelanggaran (untuk manajemen)
	const allViolationTypes = isAdmin
		? await db
				.select()
				.from(violationTypes)
				.where(eq(violationTypes.school_id, schoolId))
				.orderBy(violationTypes.category, violationTypes.name)
		: [];

	// Daftar siswa aktif (untuk dropdown input pelanggaran)
	const siswaList = await db
		.select({
			id: students.id,
			name: users.name,
			nis: students.nis,
			user_id: students.user_id
		})
		.from(students)
		.leftJoin(users, eq(users.id, students.user_id))
		.where(
			and(
				eq(students.school_id, schoolId),
				isNull(users.deleted_at),
				eq(users.is_active, 1)
			)
		)
		.orderBy(users.name);

	// Tahun ajaran aktif
	const tahunAjaran = await db
		.select()
		.from(academicYears)
		.where(and(eq(academicYears.school_id, schoolId), eq(academicYears.is_active, 1)));

	// Rekap poin siswa (top 10 pelanggaran)
	const pointSummaries = isAdmin
		? await db
				.select({
					student_id: studentPointSummaries.student_id,
					total_points: studentPointSummaries.total_points,
					student_name: users.name,
					student_nis: students.nis
				})
				.from(studentPointSummaries)
				.leftJoin(students, eq(students.id, studentPointSummaries.student_id))
				.leftJoin(users, eq(users.id, students.user_id))
				.where(eq(studentPointSummaries.school_id, schoolId))
				.orderBy(desc(studentPointSummaries.total_points))
				.limit(10)
		: [];

	const violationForm = await superValidate(zod(studentViolationSchema));
	const vtypeForm = await superValidate(zod(violationTypeSchema));

	return {
		violations: violationList,
		violationTypes: violationTypeList,
		allViolationTypes,
		siswas: siswaList,
		tahunAjaran,
		pointSummaries,
		isAdmin,
		violationForm,
		vtypeForm
	};
};

export const actions: Actions = {
	// Catat pelanggaran baru
	report: async ({ request, locals }) => {
		const user = requireGuruOrAdmin(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;

		const form = await superValidate(request, zod(studentViolationSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { student_id, violation_type_id, date, description, academic_year_id } = form.data;

		// Ambil poin dari violation type
		const vtype = await db
			.select({ points: violationTypes.points })
			.from(violationTypes)
			.where(eq(violationTypes.id, violation_type_id));

		if (!vtype.length) {
			return message(form, 'Jenis pelanggaran tidak ditemukan', { status: 404 });
		}

		const now = Date.now();
		await db.insert(studentViolations).values({
			school_id: schoolId,
			student_id,
			violation_type_id,
			reported_by: user.userId,
			date,
			description: description || null,
			points_snapshot: vtype[0].points,
			status: 'pending',
			created_at: now
		});

		// Update atau insert student_point_summaries
		const existing = await db
			.select()
			.from(studentPointSummaries)
			.where(
				and(
					eq(studentPointSummaries.school_id, schoolId),
					eq(studentPointSummaries.student_id, student_id),
					eq(studentPointSummaries.academic_year_id, academic_year_id)
				)
			);

		if (existing.length > 0) {
			await db
				.update(studentPointSummaries)
				.set({
					total_points: existing[0].total_points + vtype[0].points,
					last_violation_at: now,
					updated_at: now
				})
				.where(eq(studentPointSummaries.id, existing[0].id));
		} else {
			await db.insert(studentPointSummaries).values({
				school_id: schoolId,
				student_id,
				academic_year_id,
				total_points: vtype[0].points,
				last_violation_at: now,
				updated_at: now
			});
		}

		return message(form, 'Pelanggaran berhasil dicatat');
	},

	// Verifikasi pelanggaran (admin saja)
	verify: async ({ request, locals }) => {
		const user = requireGuruOrAdmin(locals.user);
		if (user.role !== 'admin_sekolah') {
			throw error(403, 'Hanya admin sekolah yang dapat memverifikasi pelanggaran');
		}
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		const status = formData.get('status') as string;

		if (!id || !['verified', 'rejected'].includes(status)) {
			throw error(400, 'Data tidak valid');
		}

		await db
			.update(studentViolations)
			.set({
				status,
				verified_by: user.userId,
				verified_at: Date.now()
			})
			.where(eq(studentViolations.id, id));

		throw redirect(303, '/dashboard/pelanggaran');
	},

	// Hapus pelanggaran (soft delete)
	delete: async ({ request, locals }) => {
		const user = requireGuruOrAdmin(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		// Hanya admin atau yang melaporkan sendiri
		if (user.role === 'guru') {
			const existing = await db
				.select({ reported_by: studentViolations.reported_by })
				.from(studentViolations)
				.where(eq(studentViolations.id, id));
			if (!existing.length || existing[0].reported_by !== user.userId) {
				throw error(403, 'Anda tidak memiliki akses ke data ini');
			}
		}

		await db
			.update(studentViolations)
			.set({ deleted_at: Date.now() })
			.where(eq(studentViolations.id, id));

		throw redirect(303, '/dashboard/pelanggaran');
	},

	// Tambah jenis pelanggaran (admin saja)
	createViolationType: async ({ request, locals }) => {
		const user = requireGuruOrAdmin(locals.user);
		if (user.role !== 'admin_sekolah') {
			throw error(403, 'Hanya admin sekolah yang dapat mengelola jenis pelanggaran');
		}
		const db = locals.db;
		const schoolId = user.schoolId;

		const form = await superValidate(request, zod(violationTypeSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { code, name, category, points, description, is_active } = form.data;

		const existing = await db
			.select({ id: violationTypes.id })
			.from(violationTypes)
			.where(and(eq(violationTypes.school_id, schoolId), eq(violationTypes.code, code)));

		if (existing.length > 0) {
			return message(form, 'Kode jenis pelanggaran sudah digunakan', { status: 409 });
		}

		await db.insert(violationTypes).values({
			school_id: schoolId,
			code,
			name,
			category,
			points,
			description: description || null,
			is_active,
			created_at: Date.now()
		});

		return message(form, 'Jenis pelanggaran berhasil ditambahkan');
	}
};
