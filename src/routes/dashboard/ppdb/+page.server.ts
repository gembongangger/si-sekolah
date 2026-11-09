import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireAdminSekolah } from '$lib/server/auth/guard';
import {
	schools,
	users,
	students,
	classes,
	academicYears,
	ppdbBatches,
	ppdbRegistrations,
	ppdbTracks
} from '$lib/server/db/schema';
import { eq, and, isNull, desc, asc, or, like, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { ppdbBatchSchema } from '$lib/validation/ppdb';
import { DEFAULT_PPDB_TRACKS } from '$lib/validation/ppdb';

const REG_STATUSES = ['submitted', 'verified', 'accepted', 'rejected', 'enrolled'] as const;
type RegStatus = (typeof REG_STATUSES)[number];

function isRegStatus(value: string): value is RegStatus {
	return (REG_STATUSES as readonly string[]).includes(value);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireAdminSekolah(locals.user);
	const db = locals.db;
	const schoolId = user.schoolId;

	const batchFilter = url.searchParams.get('batch_id')
		? Number(url.searchParams.get('batch_id'))
		: null;
	const statusParam = (url.searchParams.get('status') || 'all').trim();
	const statusFilter = isRegStatus(statusParam) ? statusParam : 'all';
	const search = (url.searchParams.get('q') || '').trim();

	const [batchRows, years, classRows, schoolRow] = await Promise.all([
		db
			.select({
				id: ppdbBatches.id,
				name: ppdbBatches.name,
				academicYearId: ppdbBatches.academic_year_id,
				academicYearName: academicYears.name,
				academicYearSemester: academicYears.semester,
				startDate: ppdbBatches.start_date,
				endDate: ppdbBatches.end_date,
				quota: ppdbBatches.quota,
				fee: ppdbBatches.registration_fee,
				description: ppdbBatches.description,
				isActive: ppdbBatches.is_active
			})
			.from(ppdbBatches)
			.leftJoin(academicYears, eq(ppdbBatches.academic_year_id, academicYears.id))
			.where(and(eq(ppdbBatches.school_id, schoolId), isNull(ppdbBatches.deleted_at)))
			.orderBy(desc(ppdbBatches.id)),
		db
			.select({
				id: academicYears.id,
				name: academicYears.name,
				semester: academicYears.semester,
				isActive: academicYears.is_active
			})
			.from(academicYears)
			.where(and(eq(academicYears.school_id, schoolId), isNull(academicYears.deleted_at)))
			.orderBy(desc(academicYears.id)),
		db
			.select({
				id: classes.id,
				name: classes.name,
				level: classes.level,
				academicYearId: classes.academic_year_id
			})
			.from(classes)
			.where(and(eq(classes.school_id, schoolId), isNull(classes.deleted_at)))
			.orderBy(asc(classes.name)),
		db.select({ name: schools.name, timezone: schools.timezone }).from(schools).where(eq(schools.id, schoolId))
]);

function todayInTimeZone(timeZone: string): string {
	try {
		const parts = new Intl.DateTimeFormat('en-CA', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).formatToParts(new Date());
		const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
		return `${get('year')}-${get('month')}-${get('day')}`;
	} catch {
		return new Date().toISOString().slice(0, 10);
	}
}

const today = todayInTimeZone(schoolRow[0]?.timezone || 'Asia/Jakarta');

// Jumlah pendaftar per gelombang
	const batchCountRows = await db
		.select({
			batchId: ppdbRegistrations.batch_id,
			total: sql<number>`count(*)`
		})
		.from(ppdbRegistrations)
		.where(and(eq(ppdbRegistrations.school_id, schoolId), isNull(ppdbRegistrations.deleted_at)))
		.groupBy(ppdbRegistrations.batch_id);
	const batchCountMap = new Map(batchCountRows.map((r) => [r.batchId, Number(r.total)]));

	// Statistik status pendaftar
	const statusCountRows = await db
		.select({
			status: ppdbRegistrations.status,
			total: sql<number>`count(*)`
		})
		.from(ppdbRegistrations)
		.where(and(eq(ppdbRegistrations.school_id, schoolId), isNull(ppdbRegistrations.deleted_at)))
		.groupBy(ppdbRegistrations.status);

	const stats: Record<RegStatus | 'total', number> = {
		total: 0,
		submitted: 0,
		verified: 0,
		accepted: 0,
		rejected: 0,
		enrolled: 0
	};
	for (const row of statusCountRows) {
		if (isRegStatus(row.status)) {
			stats[row.status] = Number(row.total);
			stats.total += Number(row.total);
		}
	}

	// Daftar pendaftar dengan filter
	const conditions = [
		eq(ppdbRegistrations.school_id, schoolId),
		isNull(ppdbRegistrations.deleted_at)
	];

	if (batchFilter) {
		conditions.push(eq(ppdbRegistrations.batch_id, batchFilter));
	}
	if (statusFilter !== 'all') {
		conditions.push(eq(ppdbRegistrations.status, statusFilter));
	}
	if (search) {
		conditions.push(
			or(
				like(ppdbRegistrations.full_name, `%${search}%`),
				like(ppdbRegistrations.registration_number, `%${search}%`),
				like(ppdbRegistrations.nisn, `%${search}%`),
				like(ppdbRegistrations.previous_school, `%${search}%`)
			)!
		);
	}

	const registrations = await db
		.select({
			id: ppdbRegistrations.id,
			registrationNumber: ppdbRegistrations.registration_number,
			batchId: ppdbRegistrations.batch_id,
			batchName: ppdbBatches.name,
			fullName: ppdbRegistrations.full_name,
			nisn: ppdbRegistrations.nisn,
			nik: ppdbRegistrations.nik,
			gender: ppdbRegistrations.gender,
			birthPlace: ppdbRegistrations.birth_place,
			birthDate: ppdbRegistrations.birth_date,
			religion: ppdbRegistrations.religion,
			address: ppdbRegistrations.address,
			phone: ppdbRegistrations.phone,
			email: ppdbRegistrations.email,
			previousSchool: ppdbRegistrations.previous_school,
			graduationYear: ppdbRegistrations.graduation_year,
			track: ppdbRegistrations.track,
			majorChoice: ppdbRegistrations.major_choice,
			parentName: ppdbRegistrations.parent_name,
			parentPhone: ppdbRegistrations.parent_phone,
			parentJob: ppdbRegistrations.parent_job,
			status: ppdbRegistrations.status,
			selectionScore: ppdbRegistrations.selection_score,
			notes: ppdbRegistrations.notes,
			convertedStudentId: ppdbRegistrations.converted_student_id,
			enrolledClassName: classes.name,
			createdAt: ppdbRegistrations.created_at
		})
		.from(ppdbRegistrations)
		.leftJoin(ppdbBatches, eq(ppdbRegistrations.batch_id, ppdbBatches.id))
		.leftJoin(students, eq(ppdbRegistrations.converted_student_id, students.id))
		.leftJoin(classes, eq(students.class_id, classes.id))
		.where(and(...conditions))
		.orderBy(desc(ppdbRegistrations.created_at), desc(ppdbRegistrations.id))
		.limit(500);

	// Jalur pendaftaran sekolah — seed default bila belum ada
	const now = Date.now();
	const existingTracks = await db
		.select({ id: ppdbTracks.id })
		.from(ppdbTracks)
		.where(and(eq(ppdbTracks.school_id, schoolId), isNull(ppdbTracks.deleted_at)));

	if (existingTracks.length === 0) {
		await db.insert(ppdbTracks).values(
			DEFAULT_PPDB_TRACKS.map((t) => ({
				school_id: schoolId,
				code: t.code,
				name: t.name,
				description: null,
				is_active: 1,
				created_at: now,
				updated_at: now
			}))
		);
	}

	const tracks = await db
		.select({
			id: ppdbTracks.id,
			code: ppdbTracks.code,
			name: ppdbTracks.name,
			description: ppdbTracks.description,
			isActive: ppdbTracks.is_active
		})
		.from(ppdbTracks)
		.where(and(eq(ppdbTracks.school_id, schoolId), isNull(ppdbTracks.deleted_at)))
		.orderBy(asc(ppdbTracks.id));

	return {
		batches: batchRows.map((b) => ({
			...b,
			totalRegistrants: batchCountMap.get(b.id) ?? 0,
			periodStatus:
				today < b.startDate ? 'upcoming' : today > b.endDate ? 'closed' : 'open'
		})),
		years,
		classes: classRows,
		registrations,
		tracks,
		stats,
		schoolName: schoolRow[0]?.name ?? 'Sekolah',
		filters: {
			batchId: batchFilter,
			status: statusFilter,
			q: search
		}
	};
};

export const actions: Actions = {
	createBatch: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;
		const formData = await request.formData();

		const parsed = ppdbBatchSchema.safeParse({
			academic_year_id: formData.get('academic_year_id'),
			name: formData.get('name')?.toString().trim(),
			start_date: formData.get('start_date')?.toString().trim(),
			end_date: formData.get('end_date')?.toString().trim(),
			quota: formData.get('quota'),
			registration_fee: formData.get('registration_fee') ?? 0,
			description: formData.get('description')?.toString().trim() || undefined,
			is_active: formData.get('is_active') ?? 1
		});

		if (!parsed.success) {
			const first =
				Object.values(parsed.error.flatten().fieldErrors).flat()[0] ||
				'Data gelombang belum lengkap atau tidak valid';
			return fail(400, { success: false, operation: 'createBatch', message: first });
		}

		const data = parsed.data;

		if (data.start_date > data.end_date) {
			return fail(400, {
				success: false,
				operation: 'createBatch',
				message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.'
			});
		}

		const [year] = await db
			.select({ id: academicYears.id })
			.from(academicYears)
			.where(
				and(
					eq(academicYears.id, data.academic_year_id),
					eq(academicYears.school_id, schoolId),
					isNull(academicYears.deleted_at)
				)
			);

		if (!year) {
			return fail(400, {
				success: false,
				operation: 'createBatch',
				message: 'Tahun ajaran tidak ditemukan pada sekolah ini.'
			});
		}

		const now = Date.now();
		await db.insert(ppdbBatches).values({
			school_id: schoolId,
			academic_year_id: data.academic_year_id,
			name: data.name,
			start_date: data.start_date,
			end_date: data.end_date,
			quota: data.quota,
			registration_fee: data.registration_fee,
			description: data.description ?? null,
			is_active: data.is_active,
			created_at: now,
			updated_at: now
		});

		return {
			success: true,
			operation: 'createBatch',
			message: `Gelombang "${data.name}" berhasil ditambahkan.`
		};
	},

	toggleBatch: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;
		const formData = await request.formData();
		const batchId = Number(formData.get('batch_id'));

		if (!batchId) {
			return fail(400, { success: false, operation: 'toggleBatch', message: 'ID gelombang tidak valid' });
		}

		const [batch] = await db
			.select()
			.from(ppdbBatches)
			.where(
				and(
					eq(ppdbBatches.id, batchId),
					eq(ppdbBatches.school_id, schoolId),
					isNull(ppdbBatches.deleted_at)
				)
			);

		if (!batch) {
			return fail(404, {
				success: false,
				operation: 'toggleBatch',
				message: 'Gelombang tidak ditemukan'
			});
		}

		const nextActive = batch.is_active === 1 ? 0 : 1;
		await db
			.update(ppdbBatches)
			.set({ is_active: nextActive, updated_at: Date.now() })
			.where(eq(ppdbBatches.id, batch.id));

		return {
			success: true,
			operation: 'toggleBatch',
			message: nextActive === 1 ? 'Gelombang dibuka kembali.' : 'Gelombang ditutup sementara.'
		};
	},

	deleteBatch: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;
		const formData = await request.formData();
		const batchId = Number(formData.get('batch_id'));

		if (!batchId) {
			return fail(400, { success: false, operation: 'deleteBatch', message: 'ID gelombang tidak valid' });
		}

		const [batch] = await db
			.select()
			.from(ppdbBatches)
			.where(
				and(
					eq(ppdbBatches.id, batchId),
					eq(ppdbBatches.school_id, schoolId),
					isNull(ppdbBatches.deleted_at)
				)
			);

		if (!batch) {
			return fail(404, {
				success: false,
				operation: 'deleteBatch',
				message: 'Gelombang tidak ditemukan'
			});
		}

		const [existing] = await db
			.select({ total: sql<number>`count(*)` })
			.from(ppdbRegistrations)
			.where(
				and(
					eq(ppdbRegistrations.batch_id, batch.id),
					isNull(ppdbRegistrations.deleted_at)
				)
			);

		if (Number(existing?.total ?? 0) > 0) {
			return fail(400, {
				success: false,
				operation: 'deleteBatch',
				message: 'Gelombang masih memiliki pendaftar sehingga tidak dapat dihapus. Tutup saja gelombangnya.'
			});
		}

		await db
			.update(ppdbBatches)
			.set({ deleted_at: Date.now(), is_active: 0, updated_at: Date.now() })
			.where(eq(ppdbBatches.id, batch.id));

		return {
			success: true,
			operation: 'deleteBatch',
			message: `Gelombang "${batch.name}" berhasil dihapus.`
		};
	},

	updateBatch: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;
		const formData = await request.formData();

		const batchId = Number(formData.get('batch_id'));
		const name = formData.get('name')?.toString().trim() ?? '';
		const startDate = formData.get('start_date')?.toString().trim() ?? '';
		const endDate = formData.get('end_date')?.toString().trim() ?? '';
		const quota = Number(formData.get('quota')) || 0;
		const registrationFee = Number(formData.get('registration_fee')) || 0;
		const description = formData.get('description')?.toString().trim() || null;
		const isActive = formData.get('is_active') === '0' ? 0 : 1;

		if (!batchId) {
			return fail(400, { success: false, operation: 'updateBatch', message: 'ID gelombang tidak valid.' });
		}
		if (!name) {
			return fail(400, { success: false, operation: 'updateBatch', message: 'Nama gelombang wajib diisi.' });
		}
		if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
			return fail(400, { success: false, operation: 'updateBatch', message: 'Format tanggal mulai tidak valid (YYYY-MM-DD).' });
		}
		if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
			return fail(400, { success: false, operation: 'updateBatch', message: 'Format tanggal selesai tidak valid (YYYY-MM-DD).' });
		}
		if (startDate > endDate) {
			return fail(400, { success: false, operation: 'updateBatch', message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.' });
		}
		if (quota < 1) {
			return fail(400, { success: false, operation: 'updateBatch', message: 'Kuota minimal 1.' });
		}
		if (registrationFee < 0) {
			return fail(400, { success: false, operation: 'updateBatch', message: 'Biaya pendaftaran tidak boleh negatif.' });
		}

		const [batch] = await db
			.select()
			.from(ppdbBatches)
			.where(
				and(
					eq(ppdbBatches.id, batchId),
					eq(ppdbBatches.school_id, schoolId),
					isNull(ppdbBatches.deleted_at)
				)
			);

		if (!batch) {
			return fail(404, {
				success: false,
				operation: 'updateBatch',
				message: 'Gelombang tidak ditemukan.'
			});
		}

		await db
			.update(ppdbBatches)
			.set({
				name,
				start_date: startDate,
				end_date: endDate,
				quota,
				registration_fee: registrationFee,
				description,
				is_active: isActive,
				updated_at: Date.now()
			})
			.where(eq(ppdbBatches.id, batch.id));

		return {
			success: true,
			operation: 'updateBatch',
			message: `Gelombang "${name}" berhasil diperbarui.`
		};
	},

	updateRegistration: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;
		const formData = await request.formData();

		const regId = Number(formData.get('registration_id'));
		const status = formData.get('status')?.toString() || '';
		const scoreRaw = formData.get('selection_score')?.toString().trim() || '';
		const notes = formData.get('notes')?.toString().trim() || null;

		if (!regId) {
			return fail(400, {
				success: false,
				operation: 'updateRegistration',
				message: 'ID pendaftar tidak valid'
			});
		}

		if (!['verified', 'accepted', 'rejected'].includes(status)) {
			return fail(400, {
				success: false,
				operation: 'updateRegistration',
				message: 'Status yang dipilih tidak valid'
			});
		}

		let score: number | null = null;
		if (scoreRaw) {
			const n = Number(scoreRaw);
			if (isNaN(n) || n < 0 || n > 100) {
				return fail(400, {
					success: false,
					operation: 'updateRegistration',
					message: 'Nilai seleksi harus berupa angka 0–100.'
				});
			}
			score = n;
		}

		const [reg] = await db
			.select()
			.from(ppdbRegistrations)
			.where(
				and(
					eq(ppdbRegistrations.id, regId),
					eq(ppdbRegistrations.school_id, schoolId),
					isNull(ppdbRegistrations.deleted_at)
				)
			);

		if (!reg) {
			return fail(404, {
				success: false,
				operation: 'updateRegistration',
				message: 'Data pendaftar tidak ditemukan'
			});
		}

		if (reg.status === 'enrolled' || reg.converted_student_id) {
			return fail(400, {
				success: false,
				operation: 'updateRegistration',
				message: 'Pendaftar sudah dikonversi menjadi siswa dan statusnya tidak dapat diubah lagi.'
			});
		}

		await db
			.update(ppdbRegistrations)
			.set({
				status,
				selection_score: score,
				notes,
				updated_at: Date.now()
			})
			.where(eq(ppdbRegistrations.id, reg.id));

		const label: Record<string, string> = {
			verified: 'diverifikasi',
			accepted: 'dinyatakan LULUS',
			rejected: 'dinyatakan tidak lulus'
		};

		return {
			success: true,
			operation: 'updateRegistration',
			message: `Pendaftar ${reg.full_name} berhasil ${label[status]}.`
		};
	},

	convertToStudent: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;
		const formData = await request.formData();

		const regId = Number(formData.get('registration_id'));
		const classId = Number(formData.get('class_id'));
		const nisInput = formData.get('nis')?.toString().trim() || '';
		const emailInput = formData.get('email')?.toString().trim().toLowerCase() || '';
		const passwordInput = formData.get('password')?.toString() || '';

		if (!regId || !classId) {
			return fail(400, {
				success: false,
				operation: 'convertToStudent',
				message: 'Pendaftar dan kelas tujuan wajib dipilih.'
			});
		}

		const [reg] = await db
			.select()
			.from(ppdbRegistrations)
			.where(
				and(
					eq(ppdbRegistrations.id, regId),
					eq(ppdbRegistrations.school_id, schoolId),
					isNull(ppdbRegistrations.deleted_at)
				)
			);

		if (!reg) {
			return fail(404, {
				success: false,
				operation: 'convertToStudent',
				message: 'Data pendaftar tidak ditemukan'
			});
		}

		if (reg.converted_student_id || reg.status === 'enrolled') {
			return fail(400, {
				success: false,
				operation: 'convertToStudent',
				message: 'Pendaftar ini sudah pernah dikonversi menjadi siswa.'
			});
		}

		if (reg.status !== 'accepted') {
			return fail(400, {
				success: false,
				operation: 'convertToStudent',
				message: 'Hanya pendaftar berstatus LULUS (accepted) yang dapat dijadikan siswa.'
			});
		}

		const [targetClass] = await db
			.select({ id: classes.id, name: classes.name })
			.from(classes)
			.where(
				and(
					eq(classes.id, classId),
					eq(classes.school_id, schoolId),
					isNull(classes.deleted_at)
				)
			);

		if (!targetClass) {
			return fail(400, {
				success: false,
				operation: 'convertToStudent',
				message: 'Kelas tujuan tidak ditemukan pada sekolah ini.'
			});
		}

		const [schoolRow] = await db
			.select({ name: schools.name })
			.from(schools)
			.where(eq(schools.id, schoolId));
		const schoolSlug = (schoolRow?.name || 'sekolah')
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '');
		const defaultDomain = `siswa.${schoolSlug}.sch.id`;

		// ── Email unik ──────────────────────────────────────────────
		const slugName =
			reg.full_name
				.toLowerCase()
				.replace(/[^a-z0-9]/g, '.')
				.replace(/\.+/g, '.')
				.replace(/^\.|\.$/g, '') || `siswa${reg.id}`;
		let email =
			emailInput ||
			(reg.email ? reg.email.toLowerCase() : `${slugName}${reg.nisn ? '.' + reg.nisn : ''}@${defaultDomain}`);

		const emailBase = email;
		let counter = 1;
		while (true) {
			const [dup] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
			if (!dup) break;
			const at = emailBase.indexOf('@');
			const localPart = at > -1 ? emailBase.slice(0, at) : emailBase;
			const domainPart = at > -1 ? emailBase.slice(at) : '';
			email = `${localPart}.${counter}${domainPart}`;
			counter++;
		}

		// ── NIS unik ────────────────────────────────────────────────
		let nis = nisInput || reg.nisn || '';
		if (!nis) {
			nis = `PPDB${new Date().getFullYear()}${String(reg.id).padStart(4, '0')}`;
		}
		let nisCounter = 1;
		const nisBase = nis;
		while (nis) {
			const [dupNis] = await db
				.select({ id: students.id })
				.from(students)
				.where(and(eq(students.school_id, schoolId), eq(students.nis, nis)));
			if (!dupNis) break;
			if (nisInput) {
				return fail(400, {
					success: false,
					operation: 'convertToStudent',
					message: `NIS "${nisInput}" sudah digunakan siswa lain di sekolah ini.`
				});
			}
			nis = `${nisBase}-${nisCounter}`;
			nisCounter++;
		}

		// ── Password ────────────────────────────────────────────────
		const generatedPassword = passwordInput && passwordInput.length >= 8 ? passwordInput : 'siswa12345';
		if (passwordInput && passwordInput.length > 0 && passwordInput.length < 8) {
			return fail(400, {
				success: false,
				operation: 'convertToStudent',
				message: 'Password minimal 8 karakter.'
			});
		}
		const passwordHash = await bcrypt.hash(generatedPassword, 12);

		const now = Date.now();

		try {
			const [insertedUser] = await db
				.insert(users)
				.values({
					school_id: schoolId,
					name: reg.full_name,
					email,
					password_hash: passwordHash,
					role: 'siswa',
					is_active: 1,
					created_by: user.userId,
					created_at: now,
					updated_at: now
				})
				.returning({ id: users.id });

			const [insertedStudent] = await db
				.insert(students)
				.values({
					school_id: schoolId,
					user_id: insertedUser.id,
					nis,
					nisn: reg.nisn,
					gender: reg.gender === 'L' || reg.gender === 'P' ? reg.gender : null,
					class_id: targetClass.id,
					birth_date: reg.birth_date,
					address: reg.address,
					parent_name: reg.parent_name,
					parent_phone: reg.parent_phone,
					created_at: now
				})
				.returning({ id: students.id });

			await db
				.update(ppdbRegistrations)
				.set({
					status: 'enrolled',
					converted_student_id: insertedStudent.id,
					updated_at: now
				})
				.where(eq(ppdbRegistrations.id, reg.id));

			return {
				success: true,
				operation: 'convertToStudent',
				message: `${reg.full_name} berhasil didaftarkan sebagai siswa di kelas ${targetClass.name}.`,
				credentials: {
					name: reg.full_name,
					email,
					password: generatedPassword,
					nis,
					className: targetClass.name
				}
			};
		} catch (e: any) {
			console.error('Gagal konversi pendaftar PPDB menjadi siswa:', e);
			return fail(500, {
				success: false,
				operation: 'convertToStudent',
				message: 'Gagal menyimpan data siswa baru. Silakan coba lagi.'
			});
		}
	},

	createTrack: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;
		const formData = await request.formData();

		const code = formData.get('code')?.toString().trim().toLowerCase() ?? '';
		const name = formData.get('name')?.toString().trim() ?? '';
		const description = formData.get('description')?.toString().trim() || null;
		const isActive = formData.get('is_active') === '0' ? 0 : 1;

		if (!/^[a-z0-9_-]+$/.test(code)) {
			return fail(400, {
				success: false,
				operation: 'createTrack',
				message: 'Kode jalur hanya boleh huruf, angka, strip, atau garis bawah.'
			});
		}
		if (name.length < 3) {
			return fail(400, {
				success: false,
				operation: 'createTrack',
				message: 'Nama jalur minimal 3 karakter.'
			});
		}

		const [dup] = await db
			.select({ id: ppdbTracks.id })
			.from(ppdbTracks)
			.where(and(eq(ppdbTracks.school_id, schoolId), eq(ppdbTracks.code, code)));

		if (dup) {
			return fail(409, {
				success: false,
				operation: 'createTrack',
				message: `Kode jalur "${code}" sudah digunakan.`
			});
		}

		const now = Date.now();
		await db.insert(ppdbTracks).values({
			school_id: schoolId,
			code,
			name,
			description,
			is_active: isActive,
			created_at: now,
			updated_at: now
		});

		return {
			success: true,
			operation: 'createTrack',
			message: `Jalur "${name}" berhasil ditambahkan.`
		};
	},

	updateTrack: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;
		const formData = await request.formData();

		const id = Number(formData.get('track_id'));
		const name = formData.get('name')?.toString().trim() ?? '';
		const description = formData.get('description')?.toString().trim() || null;
		const isActive = formData.get('is_active') === '0' ? 0 : 1;

		if (!id) {
			return fail(400, {
				success: false,
				operation: 'updateTrack',
				message: 'ID jalur tidak valid.'
			});
		}
		if (name.length < 3) {
			return fail(400, {
				success: false,
				operation: 'updateTrack',
				message: 'Nama jalur minimal 3 karakter.'
			});
		}

		const [track] = await db
			.select()
			.from(ppdbTracks)
			.where(
				and(
					eq(ppdbTracks.id, id),
					eq(ppdbTracks.school_id, schoolId),
					isNull(ppdbTracks.deleted_at)
				)
			);

		if (!track) {
			return fail(404, {
				success: false,
				operation: 'updateTrack',
				message: 'Jalur tidak ditemukan.'
			});
		}

		await db
			.update(ppdbTracks)
			.set({ name, description, is_active: isActive, updated_at: Date.now() })
			.where(eq(ppdbTracks.id, id));

		return {
			success: true,
			operation: 'updateTrack',
			message: `Jalur "${name}" berhasil diperbarui.`
		};
	},

	toggleTrack: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;
		const formData = await request.formData();
		const id = Number(formData.get('track_id'));

		if (!id) {
			return fail(400, {
				success: false,
				operation: 'toggleTrack',
				message: 'ID jalur tidak valid.'
			});
		}

		const [track] = await db
			.select()
			.from(ppdbTracks)
			.where(
				and(
					eq(ppdbTracks.id, id),
					eq(ppdbTracks.school_id, schoolId),
					isNull(ppdbTracks.deleted_at)
				)
			);

		if (!track) {
			return fail(404, {
				success: false,
				operation: 'toggleTrack',
				message: 'Jalur tidak ditemukan.'
			});
		}

		const nextActive = track.is_active === 1 ? 0 : 1;
		await db
			.update(ppdbTracks)
			.set({ is_active: nextActive, updated_at: Date.now() })
			.where(eq(ppdbTracks.id, id));

		return {
			success: true,
			operation: 'toggleTrack',
			message:
				nextActive === 1
					? `Jalur "${track.name}" diaktifkan kembali.`
					: `Jalur "${track.name}" dinonaktifkan.`
		};
	},

	deleteTrack: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;
		const formData = await request.formData();
		const id = Number(formData.get('track_id'));

		if (!id) {
			return fail(400, {
				success: false,
				operation: 'deleteTrack',
				message: 'ID jalur tidak valid.'
			});
		}

		const [track] = await db
			.select()
			.from(ppdbTracks)
			.where(
				and(
					eq(ppdbTracks.id, id),
					eq(ppdbTracks.school_id, schoolId),
					isNull(ppdbTracks.deleted_at)
				)
			);

		if (!track) {
			return fail(404, {
				success: false,
				operation: 'deleteTrack',
				message: 'Jalur tidak ditemukan.'
			});
		}

		// Cegah menghapus jalur yang masih dipakai pendaftar
		const [used] = await db
			.select({ total: sql<number>`count(*)` })
			.from(ppdbRegistrations)
			.where(
				and(
					eq(ppdbRegistrations.school_id, schoolId),
					eq(ppdbRegistrations.track, track.code),
					isNull(ppdbRegistrations.deleted_at)
				)
			);

		if (Number(used?.total ?? 0) > 0) {
			return fail(400, {
				success: false,
				operation: 'deleteTrack',
				message: `Jalur "${track.name}" masih dipakai ${used.total} pendaftar. Nonaktifkan saja jalurnya.`
			});
		}

		await db
			.update(ppdbTracks)
			.set({ deleted_at: Date.now(), is_active: 0, updated_at: Date.now() })
			.where(eq(ppdbTracks.id, id));

		return {
			success: true,
			operation: 'deleteTrack',
			message: `Jalur "${track.name}" berhasil dihapus.`
		};
	}
};
