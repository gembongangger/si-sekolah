import { error, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireSuperadmin } from '$lib/server/auth/guard';
import { schoolSchema } from '$lib/validation/school';
import { schools } from '$lib/server/db/schema';
import { eq, isNull, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	requireSuperadmin(locals.user);

	const db = locals.db;
	const allSchools = await db
		.select()
		.from(schools)
		.where(isNull(schools.deleted_at))
		.orderBy(desc(schools.created_at));

	const form = await superValidate(zod(schoolSchema));

	return { schools: allSchools, form };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireSuperadmin(locals.user);
		const db = locals.db;

		const form = await superValidate(request, zod(schoolSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		// Cek duplikasi NPSN
		const existing = await db
			.select({ id: schools.id })
			.from(schools)
			.where(eq(schools.npsn, form.data.npsn));

		if (existing.length > 0) {
			return message(form, 'NPSN sudah terdaftar', { status: 409 });
		}

		await db.insert(schools).values({
			name: form.data.name,
			npsn: form.data.npsn,
			address: form.data.address ?? null,
			phone: form.data.phone ?? null,
			email: form.data.email || null,
			timezone: form.data.timezone,
			is_active: form.data.is_active,
			created_at: Date.now(),
			updated_at: Date.now()
		});

		return message(form, 'Sekolah berhasil ditambahkan');
	},

	update: async ({ request, locals }) => {
		requireSuperadmin(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID sekolah tidak valid');

		const form = await superValidate(formData, zod(schoolSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		// Cek NPSN duplikat selain sekolah ini
		const existing = await db
			.select({ id: schools.id })
			.from(schools)
			.where(eq(schools.npsn, form.data.npsn));

		if (existing.length > 0 && existing[0].id !== id) {
			return message(form, 'NPSN sudah digunakan sekolah lain', { status: 409 });
		}

		await db
			.update(schools)
			.set({
				name: form.data.name,
				npsn: form.data.npsn,
				address: form.data.address ?? null,
				phone: form.data.phone ?? null,
				email: form.data.email || null,
				timezone: form.data.timezone,
				is_active: form.data.is_active,
				updated_at: Date.now()
			})
			.where(eq(schools.id, id));

		return message(form, 'Sekolah berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		requireSuperadmin(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID sekolah tidak valid');

		// Soft delete
		await db
			.update(schools)
			.set({ deleted_at: Date.now() })
			.where(eq(schools.id, id));

		throw redirect(303, '/dashboard/sekolah');
	}
};
