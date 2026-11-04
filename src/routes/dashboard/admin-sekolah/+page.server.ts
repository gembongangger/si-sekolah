import { error, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireSuperadmin } from '$lib/server/auth/guard';
import {
	adminSekolahCreateSchema,
	adminSekolahUpdateSchema
} from '$lib/validation/admin-sekolah';
import { users, schools } from '$lib/server/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async ({ locals }) => {
	requireSuperadmin(locals.user);
	const db = locals.db;

	// Daftar admin sekolah (join dengan nama sekolah)
	const adminList = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			is_active: users.is_active,
			school_id: users.school_id,
			created_at: users.created_at,
			school_name: schools.name
		})
		.from(users)
		.leftJoin(schools, eq(users.school_id, schools.id))
		.where(and(eq(users.role, 'admin_sekolah'), isNull(users.deleted_at)))
		.orderBy(desc(users.created_at));

	// Daftar sekolah untuk dropdown
	const schoolList = await db
		.select({ id: schools.id, name: schools.name, npsn: schools.npsn })
		.from(schools)
		.where(and(isNull(schools.deleted_at), eq(schools.is_active, 1)))
		.orderBy(schools.name);

	const form = await superValidate(zod(adminSekolahCreateSchema));

	return { admins: adminList, schools: schoolList, form };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireSuperadmin(locals.user);
		const db = locals.db;

		const form = await superValidate(request, zod(adminSekolahCreateSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { name, email, password, school_id, is_active } = form.data;

		// Cek email sudah dipakai
		const existing = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email));

		if (existing.length > 0) {
			return message(form, 'Email sudah terdaftar', { status: 409 });
		}

		const password_hash = await bcrypt.hash(password, 12);

		await db.insert(users).values({
			name,
			email,
			password_hash,
			role: 'admin_sekolah',
			school_id,
			is_active,
			created_by: locals.user!.userId,
			created_at: Date.now(),
			updated_at: Date.now()
		});

		return message(form, 'Admin sekolah berhasil ditambahkan');
	},

	update: async ({ request, locals }) => {
		requireSuperadmin(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		const form = await superValidate(formData, zod(adminSekolahUpdateSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { name, email, password, school_id, is_active } = form.data;

		// Cek email duplikat selain user ini
		const existing = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email));

		if (existing.length > 0 && existing[0].id !== id) {
			return message(form, 'Email sudah digunakan akun lain', { status: 409 });
		}

		const updateData: Record<string, unknown> = {
			name,
			email,
			school_id,
			is_active,
			updated_at: Date.now()
		};

		if (password) {
			updateData.password_hash = await bcrypt.hash(password, 12);
		}

		await db.update(users).set(updateData).where(eq(users.id, id));

		return message(form, 'Admin sekolah berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		requireSuperadmin(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		// Soft delete
		await db.update(users).set({ deleted_at: Date.now() }).where(eq(users.id, id));

		throw redirect(303, '/dashboard/admin-sekolah');
	}
};
