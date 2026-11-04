import { error, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireAdminSekolah } from '$lib/server/auth/guard';
import { classSchema } from '$lib/validation/class';
import { classes, academicYears, users } from '$lib/server/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireAdminSekolah(locals.user);
	const db = locals.db;
	const schoolId = user.schoolId;

	const list = await db
		.select({
			id: classes.id,
			name: classes.name,
			level: classes.level,
			academic_year_id: classes.academic_year_id,
			homeroom_teacher_id: classes.homeroom_teacher_id,
			created_at: classes.created_at,
			academic_year_name: academicYears.name,
			academic_year_semester: academicYears.semester,
			homeroom_teacher_name: users.name
		})
		.from(classes)
		.leftJoin(academicYears, eq(academicYears.id, classes.academic_year_id))
		.leftJoin(users, eq(users.id, classes.homeroom_teacher_id))
		.where(
			and(
				eq(classes.school_id, schoolId),
				isNull(classes.deleted_at),
				isNull(academicYears.deleted_at)
			)
		)
		.orderBy(desc(classes.created_at));

	const academicYearList = await db
		.select({ id: academicYears.id, name: academicYears.name, semester: academicYears.semester })
		.from(academicYears)
		.where(and(eq(academicYears.school_id, schoolId), isNull(academicYears.deleted_at)))
		.orderBy(desc(academicYears.created_at));

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

	const form = await superValidate(zod(classSchema));

	return { classes: list, academicYears: academicYearList, teachers: teacherList, form };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;

		const form = await superValidate(request, zod(classSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { academic_year_id, name, level, homeroom_teacher_id } = form.data;

		// Cek duplikasi nama kelas dalam tahun ajaran yang sama
		const existing = await db
			.select({ id: classes.id })
			.from(classes)
			.where(
				and(
					eq(classes.school_id, schoolId),
					eq(classes.academic_year_id, academic_year_id),
					eq(classes.name, name)
				)
			);

		if (existing.length > 0) {
			return message(form, 'Kelas dengan nama ini sudah ada di tahun ajaran tersebut', { status: 409 });
		}

		const now = Date.now();
		await db.insert(classes).values({
			school_id: schoolId,
			academic_year_id,
			name,
			level,
			homeroom_teacher_id: homeroom_teacher_id || null,
			created_at: now
		});

		return message(form, 'Kelas berhasil ditambahkan');
	},

	update: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		const form = await superValidate(formData, zod(classSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { academic_year_id, name, level, homeroom_teacher_id } = form.data;

		const existing = await db
			.select({ id: classes.id })
			.from(classes)
			.where(
				and(
					eq(classes.school_id, schoolId),
					eq(classes.academic_year_id, academic_year_id),
					eq(classes.name, name)
				)
			);

		if (existing.length > 0 && existing[0].id !== id) {
			return message(form, 'Kelas dengan nama ini sudah ada di tahun ajaran tersebut', { status: 409 });
		}

		await db
			.update(classes)
			.set({
				academic_year_id,
				name,
				level,
				homeroom_teacher_id: homeroom_teacher_id || null
			})
			.where(eq(classes.id, id));

		return message(form, 'Kelas berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		await db
			.update(classes)
			.set({ deleted_at: Date.now() })
			.where(eq(classes.id, id));

		throw redirect(303, '/dashboard/kelas');
	}
};
