import { error, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireAdminSekolah } from '$lib/server/auth/guard';
import { scheduleSchema } from '$lib/validation/schedule';
import {
	schedules,
	classes,
	subjects,
	users,
	timeSlots,
	academicYears
} from '$lib/server/db/schema';
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
	const user = requireAdminSekolah(locals.user);
	const db = locals.db;
	const schoolId = user.schoolId;

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
				isNull(schedules.deleted_at)
			)
		)
		.orderBy(desc(schedules.created_at));

	// Dropdown data
	const academicYearList = await db
		.select({ id: academicYears.id, name: academicYears.name, semester: academicYears.semester })
		.from(academicYears)
		.where(and(eq(academicYears.school_id, schoolId), isNull(academicYears.deleted_at)))
		.orderBy(desc(academicYears.created_at));

	const classList = await db
		.select({ id: classes.id, name: classes.name, level: classes.level })
		.from(classes)
		.where(and(eq(classes.school_id, schoolId), isNull(classes.deleted_at)))
		.orderBy(classes.name);

	const subjectList = await db
		.select({ id: subjects.id, code: subjects.code, name: subjects.name })
		.from(subjects)
		.where(and(eq(subjects.school_id, schoolId), isNull(subjects.deleted_at)))
		.orderBy(subjects.name);

	const teacherList = await db
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
		.orderBy(users.name);

	const timeSlotList = await db
		.select({
			id: timeSlots.id,
			day_of_week: timeSlots.day_of_week,
			slot_number: timeSlots.slot_number,
			start_time: timeSlots.start_time,
			end_time: timeSlots.end_time
		})
		.from(timeSlots)
		.where(and(eq(timeSlots.school_id, schoolId), isNull(timeSlots.deleted_at)))
		.orderBy(timeSlots.day_of_week, timeSlots.slot_number);

	const form = await superValidate(zod(scheduleSchema));

	return {
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

		const now = Date.now();
		await db.insert(schedules).values({
			school_id: schoolId,
			academic_year_id,
			class_id,
			subject_id,
			teacher_id,
			time_slot_id,
			room: room || null,
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

		await db
			.update(schedules)
			.set({
				academic_year_id,
				class_id,
				subject_id,
				teacher_id,
				time_slot_id,
				room: room || null,
				updated_at: Date.now()
			})
			.where(eq(schedules.id, id));

		return message(form, 'Jadwal pelajaran berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		await db
			.update(schedules)
			.set({ deleted_at: Date.now() })
			.where(eq(schedules.id, id));

		throw redirect(303, '/dashboard/jadwal');
	}
};
