import { error, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireAdminSekolah } from '$lib/server/auth/guard';
import { academicYearSchema } from '$lib/validation/academic-year';
import { academicYears } from '$lib/server/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdminSekolah(locals.user);

	const db = locals.db;
	const schoolId = locals.user!.schoolId!;

	const list = await db
		.select()
		.from(academicYears)
		.where(and(eq(academicYears.school_id, schoolId), isNull(academicYears.deleted_at)))
		.orderBy(desc(academicYears.created_at));

	const form = await superValidate(zod(academicYearSchema));

	return { academicYears: list, form };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = locals.user!.schoolId!;

		const form = await superValidate(request, zod(academicYearSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		// Jika is_active = 1, nonaktifkan tahun ajaran lain di sekolah ini
		if (form.data.is_active === 1) {
			await db
				.update(academicYears)
				.set({ is_active: 0 })
				.where(
					and(
						eq(academicYears.school_id, schoolId),
						eq(academicYears.is_active, 1)
					)
				);
		}

		const now = Date.now();
		await db.insert(academicYears).values({
			school_id: schoolId,
			name: form.data.name,
			semester: form.data.semester,
			start_date: form.data.start_date,
			end_date: form.data.end_date,
			is_active: form.data.is_active,
			created_at: now,
			updated_at: now
		});

		return message(form, 'Tahun ajaran berhasil ditambahkan');
	},

	update: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = locals.user!.schoolId!;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		const form = await superValidate(formData, zod(academicYearSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		// Jika is_active = 1, nonaktifkan tahun ajaran lain di sekolah ini
		if (form.data.is_active === 1) {
			await db
				.update(academicYears)
				.set({ is_active: 0 })
				.where(
					and(
						eq(academicYears.school_id, schoolId),
						eq(academicYears.is_active, 1)
					)
				);
		}

		await db
			.update(academicYears)
			.set({
				name: form.data.name,
				semester: form.data.semester,
				start_date: form.data.start_date,
				end_date: form.data.end_date,
				is_active: form.data.is_active,
				updated_at: Date.now()
			})
			.where(eq(academicYears.id, id));

		return message(form, 'Tahun ajaran berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		// Soft delete
		await db
			.update(academicYears)
			.set({ deleted_at: Date.now() })
			.where(eq(academicYears.id, id));

		throw redirect(303, '/dashboard/tahun-ajaran');
	}
};
