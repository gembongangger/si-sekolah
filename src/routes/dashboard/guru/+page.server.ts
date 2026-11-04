import { error, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireAdminSekolah } from '$lib/server/auth/guard';
import { guruCreateSchema, guruUpdateSchema } from '$lib/validation/guru';
import { users, teachers } from '$lib/server/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireAdminSekolah(locals.user);
	const db = locals.db;
	const schoolId = user.schoolId;

	const guruList = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			is_active: users.is_active,
			created_at: users.created_at,
			teacher_id: teachers.id,
			nip: teachers.nip,
			gender: teachers.gender,
			phone: teachers.phone
		})
		.from(users)
		.leftJoin(teachers, eq(teachers.user_id, users.id))
		.where(
			and(
				eq(users.role, 'guru'),
				eq(users.school_id, schoolId),
				isNull(users.deleted_at)
			)
		)
		.orderBy(desc(users.created_at));

	const form = await superValidate(zod(guruCreateSchema));
	return { gurus: guruList, form };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;

		const form = await superValidate(request, zod(guruCreateSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { name, email, password, nip, gender, phone, is_active } = form.data;

		// Cek email duplikat
		const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
		if (existing.length > 0) {
			return message(form, 'Email sudah terdaftar', { status: 409 });
		}

		// Cek NIP duplikat dalam sekolah ini
		if (nip) {
			const dupNip = await db
				.select({ id: teachers.id })
				.from(teachers)
				.where(and(eq(teachers.school_id, schoolId), eq(teachers.nip, nip)));
			if (dupNip.length > 0) {
				return message(form, 'NIP sudah terdaftar di sekolah ini', { status: 409 });
			}
		}

		const password_hash = await bcrypt.hash(password, 12);
		const now = Date.now();

		// Insert user dulu
		const insertedUser = await db
			.insert(users)
			.values({
				name,
				email,
				password_hash,
				role: 'guru',
				school_id: schoolId,
				is_active,
				created_by: user.userId,
				created_at: now,
				updated_at: now
			})
			.returning({ id: users.id });

		const newUserId = insertedUser[0].id;

		// Insert profil teacher
		await db.insert(teachers).values({
			school_id: schoolId,
			user_id: newUserId,
			nip: nip || null,
			gender: gender ?? null,
			phone: phone || null,
			created_at: now
		});

		return message(form, 'Guru berhasil ditambahkan');
	},

	update: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		const form = await superValidate(formData, zod(guruUpdateSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { name, email, password, nip, gender, phone, is_active } = form.data;

		// Cek email duplikat selain user ini
		const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
		if (existing.length > 0 && existing[0].id !== id) {
			return message(form, 'Email sudah digunakan akun lain', { status: 409 });
		}

		const updateData: Record<string, unknown> = {
			name,
			email,
			is_active,
			updated_at: Date.now()
		};
		if (password) {
			updateData.password_hash = await bcrypt.hash(password, 12);
		}

		await db.update(users).set(updateData).where(eq(users.id, id));

		// Update profil teacher
		await db
			.update(teachers)
			.set({ nip: nip || null, gender: gender ?? null, phone: phone || null })
			.where(eq(teachers.user_id, id));

		return message(form, 'Data guru berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		await db.update(users).set({ deleted_at: Date.now() }).where(eq(users.id, id));
		throw redirect(303, '/dashboard/guru');
	}
};
