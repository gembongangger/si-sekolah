import { error, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireAdminSekolah } from '$lib/server/auth/guard';
import { classSubjectSchema } from '$lib/validation/class-subject';
import {
	classSubjects,
	classes,
	subjects,
	users,
	academicYears
} from '$lib/server/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireAdminSekolah(locals.user);
	const db = locals.db;
	const schoolId = user.schoolId;

	const list = await db
		.select({
			id: classSubjects.id,
			class_id: classSubjects.class_id,
			subject_id: classSubjects.subject_id,
			teacher_id: classSubjects.teacher_id,
			academic_year_id: classSubjects.academic_year_id,
			class_name: classes.name,
			class_level: classes.level,
			subject_code: subjects.code,
			subject_name: subjects.name,
			teacher_name: users.name,
			academic_year_name: academicYears.name,
			academic_year_semester: academicYears.semester
		})
		.from(classSubjects)
		.leftJoin(classes, eq(classes.id, classSubjects.class_id))
		.leftJoin(subjects, eq(subjects.id, classSubjects.subject_id))
		.leftJoin(users, eq(users.id, classSubjects.teacher_id))
		.leftJoin(academicYears, eq(academicYears.id, classSubjects.academic_year_id))
		.where(
			and(
				eq(classSubjects.school_id, schoolId),
				isNull(classSubjects.deleted_at)
			)
		)
		.orderBy(desc(classSubjects.created_at));

	// Dropdown data
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

	const academicYearList = await db
		.select({ id: academicYears.id, name: academicYears.name, semester: academicYears.semester })
		.from(academicYears)
		.where(and(eq(academicYears.school_id, schoolId), isNull(academicYears.deleted_at)))
		.orderBy(desc(academicYears.created_at));

	const form = await superValidate(zod(classSubjectSchema));

	return {
		classSubjects: list,
		classes: classList,
		subjects: subjectList,
		teachers: teacherList,
		academicYears: academicYearList,
		form
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;

		const form = await superValidate(request, zod(classSubjectSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { class_id, subject_id, teacher_id, academic_year_id } = form.data;

		// Cek duplikasi
		const existing = await db
			.select({ id: classSubjects.id })
			.from(classSubjects)
			.where(
				and(
					eq(classSubjects.school_id, schoolId),
					eq(classSubjects.class_id, class_id),
					eq(classSubjects.subject_id, subject_id),
					eq(classSubjects.academic_year_id, academic_year_id)
				)
			);

		if (existing.length > 0) {
			return message(form, 'Kombinasi kelas, mata pelajaran, dan tahun ajaran sudah ada', { status: 409 });
		}

		const now = Date.now();
		await db.insert(classSubjects).values({
			school_id: schoolId,
			class_id,
			subject_id,
			teacher_id,
			academic_year_id,
			created_at: now
		});

		return message(form, 'Relasi kelas-mapel-guru berhasil ditambahkan');
	},

	update: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		const form = await superValidate(formData, zod(classSubjectSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { class_id, subject_id, teacher_id, academic_year_id } = form.data;

		const existing = await db
			.select({ id: classSubjects.id })
			.from(classSubjects)
			.where(
				and(
					eq(classSubjects.school_id, schoolId),
					eq(classSubjects.class_id, class_id),
					eq(classSubjects.subject_id, subject_id),
					eq(classSubjects.academic_year_id, academic_year_id)
				)
			);

		if (existing.length > 0 && existing[0].id !== id) {
			return message(form, 'Kombinasi kelas, mata pelajaran, dan tahun ajaran sudah ada', { status: 409 });
		}

		await db
			.update(classSubjects)
			.set({
				class_id,
				subject_id,
				teacher_id,
				academic_year_id
			})
			.where(eq(classSubjects.id, id));

		return message(form, 'Relasi kelas-mapel-guru berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		await db
			.update(classSubjects)
			.set({ deleted_at: Date.now() })
			.where(eq(classSubjects.id, id));

		throw redirect(303, '/dashboard/kelas/mapel');
	}
};
