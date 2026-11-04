import { error, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireGuruOrAdmin } from '$lib/server/auth/guard';
import { jurnalSchema } from '$lib/validation/jurnal';
import {
	teachingJournals,
	classSubjects,
	classes,
	subjects,
	academicYears,
	users
} from '$lib/server/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireGuruOrAdmin(locals.user);
	const db = locals.db;
	const schoolId = user.schoolId;

	// Untuk guru: filter berdasarkan teacher_id. Untuk admin: lihat semua.
	const isGuru = user.role === 'guru';

	// Ambil daftar jurnal
	let query = db
		.select({
			id: teachingJournals.id,
			date: teachingJournals.date,
			meeting_number: teachingJournals.meeting_number,
			topic: teachingJournals.topic,
			created_at: teachingJournals.created_at,
			class_name: classes.name,
			subject_name: subjects.name,
			teacher_name: users.name,
			attendance_summary: teachingJournals.attendance_summary
		})
		.from(teachingJournals)
		.leftJoin(classes, eq(classes.id, teachingJournals.class_id))
		.leftJoin(subjects, eq(subjects.id, teachingJournals.subject_id))
		.leftJoin(users, eq(users.id, teachingJournals.teacher_id))
		.where(
			and(
				eq(teachingJournals.school_id, schoolId),
				isNull(teachingJournals.deleted_at),
				...(isGuru ? [eq(teachingJournals.teacher_id, user.userId)] : [])
			)
		)
		.orderBy(desc(teachingJournals.date), desc(teachingJournals.created_at))
		.limit(100);

	const jurnalList = await query;

	// Ambil kelas yang diajar guru ini (via class_subjects)
	const kelasPelajaran = isGuru
		? await db
				.select({
					class_id: classSubjects.class_id,
					class_name: classes.name,
					subject_id: classSubjects.subject_id,
					subject_name: subjects.name,
					academic_year_id: classSubjects.academic_year_id
				})
				.from(classSubjects)
				.leftJoin(classes, eq(classes.id, classSubjects.class_id))
				.leftJoin(subjects, eq(subjects.id, classSubjects.subject_id))
				.where(
					and(
						eq(classSubjects.school_id, schoolId),
						eq(classSubjects.teacher_id, user.userId)
					)
				)
		: [];

	// Tahun ajaran aktif
	const tahunAjaran = await db
		.select()
		.from(academicYears)
		.where(and(eq(academicYears.school_id, schoolId), eq(academicYears.is_active, 1)));

	const form = await superValidate(zod(jurnalSchema));

	return {
		jurnals: jurnalList,
		kelasPelajaran,
		tahunAjaran,
		isGuru,
		form
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const user = requireGuruOrAdmin(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;

		const form = await superValidate(request, zod(jurnalSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const {
			class_id, subject_id, academic_year_id,
			date, meeting_number, topic,
			learning_objectives, activities, notes,
			att_hadir, att_sakit, att_izin, att_alfa
		} = form.data;

		const attendanceSummary = JSON.stringify({
			hadir: att_hadir,
			sakit: att_sakit,
			izin: att_izin,
			alfa: att_alfa
		});

		// Cek duplikasi (school, teacher, class, subject, date, meeting_number)
		const existing = await db
			.select({ id: teachingJournals.id })
			.from(teachingJournals)
			.where(
				and(
					eq(teachingJournals.school_id, schoolId),
					eq(teachingJournals.teacher_id, user.userId),
					eq(teachingJournals.class_id, class_id),
					eq(teachingJournals.subject_id, subject_id),
					eq(teachingJournals.date, date),
					eq(teachingJournals.meeting_number, meeting_number)
				)
			);

		if (existing.length > 0) {
			return message(form, 'Jurnal untuk kelas, mapel, tanggal, dan pertemuan ini sudah ada', { status: 409 });
		}

		const now = Date.now();
		await db.insert(teachingJournals).values({
			school_id: schoolId,
			teacher_id: user.userId,
			class_id,
			subject_id,
			academic_year_id,
			date,
			meeting_number,
			topic,
			learning_objectives: learning_objectives || null,
			activities: activities || null,
			notes: notes || null,
			attendance_summary: attendanceSummary,
			created_at: now,
			updated_at: now
		});

		return message(form, 'Jurnal berhasil disimpan');
	},

	update: async ({ request, locals }) => {
		const user = requireGuruOrAdmin(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		const form = await superValidate(formData, zod(jurnalSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const {
			class_id, subject_id, academic_year_id,
			date, meeting_number, topic,
			learning_objectives, activities, notes,
			att_hadir, att_sakit, att_izin, att_alfa
		} = form.data;

		// Pastikan jurnal ini milik guru sendiri (jika role guru)
		if (user.role === 'guru') {
			const existing = await db
				.select({ teacher_id: teachingJournals.teacher_id })
				.from(teachingJournals)
				.where(eq(teachingJournals.id, id));

			if (!existing.length || existing[0].teacher_id !== user.userId) {
				throw error(403, 'Anda tidak memiliki akses ke jurnal ini');
			}
		}

		await db.update(teachingJournals).set({
			class_id,
			subject_id,
			academic_year_id,
			date,
			meeting_number,
			topic,
			learning_objectives: learning_objectives || null,
			activities: activities || null,
			notes: notes || null,
			attendance_summary: JSON.stringify({
				hadir: att_hadir, sakit: att_sakit, izin: att_izin, alfa: att_alfa
			}),
			updated_at: Date.now()
		}).where(eq(teachingJournals.id, id));

		return message(form, 'Jurnal berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		const user = requireGuruOrAdmin(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		if (user.role === 'guru') {
			const existing = await db
				.select({ teacher_id: teachingJournals.teacher_id })
				.from(teachingJournals)
				.where(eq(teachingJournals.id, id));
			if (!existing.length || existing[0].teacher_id !== user.userId) {
				throw error(403, 'Anda tidak memiliki akses ke jurnal ini');
			}
		}

		await db.update(teachingJournals)
			.set({ deleted_at: Date.now() })
			.where(eq(teachingJournals.id, id));

		throw redirect(303, '/dashboard/jurnal');
	}
};
