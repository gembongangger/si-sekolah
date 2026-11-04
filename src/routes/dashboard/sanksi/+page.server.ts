import { error, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireAdminSekolah } from '$lib/server/auth/guard';
import { sanctionSchema } from '$lib/validation/sanction';
import { sanctions } from '$lib/server/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdminSekolah(locals.user);

	const db = locals.db;
	const schoolId = locals.user!.schoolId!;

	const list = await db
		.select()
		.from(sanctions)
		.where(and(eq(sanctions.school_id, schoolId)))
		.orderBy(desc(sanctions.created_at));

	const form = await superValidate(zod(sanctionSchema));

	return { sanctions: list, form };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = locals.user!.schoolId!;

		const form = await superValidate(request, zod(sanctionSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { min_points, max_points, name, action } = form.data;

		const now = Date.now();
		await db.insert(sanctions).values({
			school_id: schoolId,
			min_points,
			max_points,
			name,
			action,
			created_at: now
		});

		return message(form, 'Sanksi berhasil ditambahkan');
	},

	update: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = locals.user!.schoolId!;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		const form = await superValidate(formData, zod(sanctionSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { min_points, max_points, name, action } = form.data;

		await db
			.update(sanctions)
			.set({
				min_points,
				max_points,
				name,
				action
			})
			.where(eq(sanctions.id, id));

		return message(form, 'Sanksi berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		await db
			.update(sanctions)
			.set({ deleted_at: Date.now() })
			.where(eq(sanctions.id, id));

		throw redirect(303, '/dashboard/sanksi');
	}
};
