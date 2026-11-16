import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireRole, requireAdminSekolah } from '$lib/server/auth/guard';
import { scheduleSchema } from '$lib/validation/schedule';
import {
	schedules,
	classSubjects,
	classes,
	subjects,
	users,
	timeSlots,
	academicYears,
	students
} from '$lib/server/db/schema';
import { generateSchedule } from '$lib/server/schedule-generator';
import { eq, and, isNull, desc } from 'drizzle-orm';

const dayLabels: Record<number, string> = {
	1: 'Senin',
	2: 'Selasa',
	3: 'Rabu',
	4: 'Kamis',
	5: 'Jumat',
	6: 'Sabtu',
	7: 'Minggu'
};

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireRole(locals.user, 'admin_sekolah', 'guru', 'siswa');
	if (user.schoolId === null) {
		throw error(403, 'User harus memiliki sekolah terkait');
	}
	const db = locals.db;
	const schoolId = user.schoolId;
	const isAdmin = user.role === 'admin_sekolah';

	// Scope data sesuai role:
	// - admin_sekolah: semua jadwal sekolah
	// - guru: hanya jadwal yang ia ampu
	// - siswa: hanya jadwal kelasnya
	let scopeCondition;
	if (isAdmin) {
		scopeCondition = undefined;
	} else if (user.role === 'guru') {
		scopeCondition = eq(schedules.teacher_id, user.userId);
	} else {
		const studentRows = await db
			.select({ class_id: students.class_id })
			.from(students)
			.where(and(eq(students.school_id, schoolId), eq(students.user_id, user.userId)));
		const classId = studentRows[0]?.class_id ?? -1;
		scopeCondition = eq(schedules.class_id, classId);
	}

	const list = await db
		.select({
			id: schedules.id,
			academic_year_id: schedules.academic_year_id,
			class_id: schedules.class_id,
			subject_id: schedules.subject_id,
			teacher_id: schedules.teacher_id,
			time_slot_id: schedules.time_slot_id,
			room: schedules.room,
			created_at: schedules.created_at,
			academic_year_name: academicYears.name,
			academic_year_semester: academicYears.semester,
			class_name: classes.name,
			class_level: classes.level,
			class_room: classes.room,
			subject_code: subjects.code,
			subject_name: subjects.name,
			teacher_name: users.name,
			time_slot_day: timeSlots.day_of_week,
			time_slot_slot: timeSlots.slot_number,
			time_slot_start: timeSlots.start_time,
			time_slot_end: timeSlots.end_time
		})
		.from(schedules)
		.leftJoin(academicYears, eq(academicYears.id, schedules.academic_year_id))
		.leftJoin(classes, eq(classes.id, schedules.class_id))
		.leftJoin(subjects, eq(subjects.id, schedules.subject_id))
		.leftJoin(users, eq(users.id, schedules.teacher_id))
		.leftJoin(timeSlots, eq(timeSlots.id, schedules.time_slot_id))
		.where(
			and(
				eq(schedules.school_id, schoolId),
				isNull(schedules.deleted_at),
				...(scopeCondition ? [scopeCondition] : [])
			)
		)
		.orderBy(timeSlots.day_of_week, timeSlots.slot_number, timeSlots.start_time);

	// Dropdown data — hanya admin yang punya hak tambah/ubah jadwal
	type Option = { id: number; name: string; code?: string; level?: string; semester?: string };
	type TSOption = {
		id: number;
		day_of_week: number;
		slot_number: number;
		start_time: string;
		end_time: string;
	};
	const [academicYearList, classList, subjectList, teacherList, timeSlotList]: [
		Option[],
		Option[],
		Option[],
		Option[],
		TSOption[]
	] = isAdmin
		? await Promise.all([
				db
					.select({ id: academicYears.id, name: academicYears.name, semester: academicYears.semester })
					.from(academicYears)
					.where(and(eq(academicYears.school_id, schoolId), isNull(academicYears.deleted_at)))
					.orderBy(desc(academicYears.created_at)),
				db
					.select({ id: classes.id, name: classes.name, level: classes.level })
					.from(classes)
					.where(and(eq(classes.school_id, schoolId), isNull(classes.deleted_at)))
					.orderBy(classes.name),
				db
					.select({ id: subjects.id, name: subjects.name, code: subjects.code })
					.from(subjects)
					.where(and(eq(subjects.school_id, schoolId), isNull(subjects.deleted_at)))
					.orderBy(subjects.name),
				db
					.select({ id: users.id, name: users.name })
					.from(users)
					.where(
						and(
							eq(users.role, 'guru'),
							eq(users.school_id, schoolId),
							isNull(users.deleted_at),
							eq(users.is_active, 1)
						)
					)
					.orderBy(users.name),
				db
					.select({
						id: timeSlots.id,
						day_of_week: timeSlots.day_of_week,
						slot_number: timeSlots.slot_number,
						start_time: timeSlots.start_time,
						end_time: timeSlots.end_time
					})
					.from(timeSlots)
					.where(and(eq(timeSlots.school_id, schoolId), isNull(timeSlots.deleted_at)))
					.orderBy(timeSlots.day_of_week, timeSlots.slot_number)
			])
		: [[], [], [], [], []];

	const form = await superValidate(zod(scheduleSchema));

	return {
		viewerRole: user.role,
		schedules: list,
		dayLabels,
		academicYears: academicYearList,
		classes: classList,
		subjects: subjectList,
		teachers: teacherList,
		timeSlots: timeSlotList,
		form
	};
};

export const actions: Actions = {
	generate: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;

		const formData = await request.formData();
		const academicYearId = Number(formData.get('academic_year_id'));
		if (!Number.isInteger(academicYearId) || academicYearId <= 0) {
			return fail(400, { error: 'Pilih tahun ajaran terlebih dahulu' });
		}

		const prioritySubjectIds = new Set(
			formData
				.getAll('priority_subject_ids')
				.map(Number)
				.filter((id) => Number.isInteger(id) && id > 0)
		);
		const priorityStart = String(formData.get('priority_start') ?? '');
		const priorityEnd = String(formData.get('priority_end') ?? '');
		const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
		if (
			prioritySubjectIds.size > 0 &&
			(!timePattern.test(priorityStart) ||
				!timePattern.test(priorityEnd) ||
				priorityStart >= priorityEnd)
		) {
			return fail(400, {
				error: 'Rentang prioritas tidak valid. Isi jam mulai dan jam selesai (HH:MM), mulai harus lebih awal.'
			});
		}

		const [year] = await db
			.select({ id: academicYears.id, name: academicYears.name })
			.from(academicYears)
			.where(
				and(
					eq(academicYears.id, academicYearId),
					eq(academicYears.school_id, schoolId),
					isNull(academicYears.deleted_at)
				)
			)
			.limit(1);

		if (!year) return fail(404, { error: 'Tahun ajaran tidak ditemukan' });

		const [assignments, slotRows, existingRows] = await Promise.all([
			db
				.select({
					class_id: classSubjects.class_id,
					subject_id: classSubjects.subject_id,
					teacher_id: classSubjects.teacher_id,
					hours_per_week: classSubjects.hours_per_week,
					subject_hours_per_week: subjects.hours_per_week,
					class_name: classes.name,
					class_room: classes.room,
					subject_name: subjects.name,
					teacher_name: users.name
				})
				.from(classSubjects)
				.innerJoin(classes, eq(classes.id, classSubjects.class_id))
				.innerJoin(subjects, eq(subjects.id, classSubjects.subject_id))
				.innerJoin(users, eq(users.id, classSubjects.teacher_id))
				.where(
					and(
						eq(classSubjects.school_id, schoolId),
						eq(classSubjects.academic_year_id, academicYearId),
						isNull(classSubjects.deleted_at),
						isNull(classes.deleted_at),
						isNull(subjects.deleted_at)
					)
				),
			db
				.select({ id: timeSlots.id, day: timeSlots.day_of_week, start: timeSlots.start_time })
				.from(timeSlots)
				.where(
					and(
						eq(timeSlots.school_id, schoolId),
						eq(timeSlots.is_break, 0),
						isNull(timeSlots.deleted_at)
					)
				)
				.orderBy(timeSlots.day_of_week, timeSlots.slot_number),
			db
				.select({
					class_id: schedules.class_id,
					teacher_id: schedules.teacher_id,
					time_slot_id: schedules.time_slot_id,
					academic_year_id: schedules.academic_year_id
				})
				.from(schedules)
				.where(eq(schedules.school_id, schoolId))
		]);

		if (assignments.length === 0) {
			return fail(400, {
				error:
					'Belum ada distribusi guru–mapel–kelas untuk tahun ajaran ini. Atur di menu Kelas–Mapel–Guru.'
			});
		}
		if (slotRows.length === 0) {
			return fail(400, { error: 'Belum ada slot jam pelajaran (bukan istirahat).' });
		}

		// Tahun yang digenerate akan diganti; jadwal tahun lain tetap dianggap benturan.
		const existing = existingRows
			.filter((row) => row.academic_year_id !== academicYearId)
			.map((row) => ({
				classId: row.class_id,
				teacherId: row.teacher_id,
				slotId: row.time_slot_id
			}));

		const result = generateSchedule(
			assignments.map((a) => ({
				classId: a.class_id,
				subjectId: a.subject_id,
				teacherId: a.teacher_id,
				sessions: a.hours_per_week ?? a.subject_hours_per_week,
				preferredStart: prioritySubjectIds.has(a.subject_id) ? priorityStart : null,
				preferredEnd: prioritySubjectIds.has(a.subject_id) ? priorityEnd : null
			})),
			slotRows,
			existing
		);

		if (result.total === 0) {
			return fail(400, { error: 'Tidak ada sesi mengajar yang bisa dijadwalkan.' });
		}

		if (result.unscheduled.length > 0) {
			const meta = new Map(
				assignments.map((a) => [
					`${a.class_id}:${a.subject_id}:${a.teacher_id}`,
					a
				])
			);
			const missing = result.unscheduled.map((u) => {
				const a = meta.get(`${u.classId}:${u.subjectId}:${u.teacherId}`);
				return {
					class: a?.class_name ?? `#${u.classId}`,
					subject: a?.subject_name ?? `#${u.subjectId}`,
					teacher: a?.teacher_name ?? `#${u.teacherId}`,
					count: u.count
				};
			});
			return fail(409, {
				error: `Hanya ${result.placed} dari ${result.total} sesi yang bisa dijadwalkan. Jadwal lama tidak diubah.`,
				missing
			});
		}

		const classRooms = new Map(assignments.map((a) => [a.class_id, a.class_room]));
		const now = Date.now();
		const rows = result.placements.map((p) => ({
			school_id: schoolId,
			academic_year_id: academicYearId,
			class_id: p.classId,
			subject_id: p.subjectId,
			teacher_id: p.teacherId,
			time_slot_id: p.slotId,
			room: classRooms.get(p.classId) ?? null,
			created_at: now
		}));

		// Hapus jadwal tahun ini lalu insert hasil generate secara atomik (D1 batch).
		const chunks: (typeof rows)[] = [];
		for (let i = 0; i < rows.length; i += 10) chunks.push(rows.slice(i, i + 10));
		const statements = [
			db
				.delete(schedules)
				.where(
					and(
						eq(schedules.school_id, schoolId),
						eq(schedules.academic_year_id, academicYearId)
					)
				),
			...chunks.map((chunk) => db.insert(schedules).values(chunk))
		];
		await db.batch(statements as unknown as Parameters<typeof db.batch>[0]);

		return {
			success: true,
			inserted: rows.length,
			total: result.total,
			message: `Berhasil membuat ${rows.length} jadwal untuk ${year.name} dari ${assignments.length} distribusi guru–mapel–kelas.`
		};
	},

	create: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;

		const form = await superValidate(request, zod(scheduleSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { academic_year_id, class_id, subject_id, teacher_id, time_slot_id, room } = form.data;

		// Cek duplikasi: kelas tidak boleh ada 2 pelajaran di slot waktu yang sama
		const classConflict = await db
			.select({ id: schedules.id })
			.from(schedules)
			.where(
				and(
					eq(schedules.school_id, schoolId),
					eq(schedules.time_slot_id, time_slot_id),
					eq(schedules.class_id, class_id)
				)
			);

		if (classConflict.length > 0) {
			return message(form, 'Kelas ini sudah memiliki pelajaran pada slot waktu tersebut', { status: 409 });
		}

		// Cek duplikasi: guru tidak boleh mengajar 2 kelas di slot waktu yang sama
		const teacherConflict = await db
			.select({ id: schedules.id })
			.from(schedules)
			.where(
				and(
					eq(schedules.school_id, schoolId),
					eq(schedules.time_slot_id, time_slot_id),
					eq(schedules.teacher_id, teacher_id)
				)
			);

		if (teacherConflict.length > 0) {
			return message(form, 'Guru ini sudah mengajar di kelas lain pada slot waktu tersebut', { status: 409 });
		}

		let roomValue = room || null;
		if (!roomValue) {
			const [kelas] = await db
				.select({ room: classes.room })
				.from(classes)
				.where(and(eq(classes.id, class_id), eq(classes.school_id, schoolId)))
				.limit(1);
			roomValue = kelas?.room ?? null;
		}

		const now = Date.now();
		await db.insert(schedules).values({
			school_id: schoolId,
			academic_year_id,
			class_id,
			subject_id,
			teacher_id,
			time_slot_id,
			room: roomValue,
			created_at: now
		});

		return message(form, 'Jadwal pelajaran berhasil ditambahkan');
	},

	update: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		const form = await superValidate(formData, zod(scheduleSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { academic_year_id, class_id, subject_id, teacher_id, time_slot_id, room } = form.data;

		// Cek duplikasi kelas (selain schedule ini)
		const classConflict = await db
			.select({ id: schedules.id })
			.from(schedules)
			.where(
				and(
					eq(schedules.school_id, schoolId),
					eq(schedules.time_slot_id, time_slot_id),
					eq(schedules.class_id, class_id)
				)
			);

		if (classConflict.length > 0 && classConflict[0].id !== id) {
			return message(form, 'Kelas ini sudah memiliki pelajaran pada slot waktu tersebut', { status: 409 });
		}

		// Cek duplikasi guru (selain schedule ini)
		const teacherConflict = await db
			.select({ id: schedules.id })
			.from(schedules)
			.where(
				and(
					eq(schedules.school_id, schoolId),
					eq(schedules.time_slot_id, time_slot_id),
					eq(schedules.teacher_id, teacher_id)
				)
			);

		if (teacherConflict.length > 0 && teacherConflict[0].id !== id) {
			return message(form, 'Guru ini sudah mengajar di kelas lain pada slot waktu tersebut', { status: 409 });
		}

		let roomValue = room || null;
		if (!roomValue) {
			const [kelas] = await db
				.select({ room: classes.room })
				.from(classes)
				.where(and(eq(classes.id, class_id), eq(classes.school_id, schoolId)))
				.limit(1);
			roomValue = kelas?.room ?? null;
		}

		await db
			.update(schedules)
			.set({
				academic_year_id,
				class_id,
				subject_id,
				teacher_id,
				time_slot_id,
				room: roomValue,
				updated_at: Date.now()
			})
			.where(and(eq(schedules.id, id), eq(schedules.school_id, schoolId)));

		return message(form, 'Jadwal pelajaran berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		await db
			.update(schedules)
			.set({ deleted_at: Date.now() })
			.where(and(eq(schedules.id, id), eq(schedules.school_id, schoolId)));

		throw redirect(303, '/dashboard/jadwal');
	}
};
