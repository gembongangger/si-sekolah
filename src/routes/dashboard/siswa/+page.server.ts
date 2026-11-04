import { error, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireAdminSekolah } from '$lib/server/auth/guard';
import { siswaCreateSchema, siswaUpdateSchema } from '$lib/validation/siswa';
import { users, students, classes } from '$lib/server/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireAdminSekolah(locals.user);
	const db = locals.db;
	const schoolId = user.schoolId;

	const siswaList = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			is_active: users.is_active,
			created_at: users.created_at,
			student_id: students.id,
			nis: students.nis,
			nisn: students.nisn,
			gender: students.gender,
			class_id: students.class_id,
			birth_date: students.birth_date,
			address: students.address,
			parent_name: students.parent_name,
			parent_phone: students.parent_phone,
			class_name: classes.name
		})
		.from(users)
		.leftJoin(students, eq(students.user_id, users.id))
		.leftJoin(classes, eq(classes.id, students.class_id))
		.where(
			and(
				eq(users.role, 'siswa'),
				eq(users.school_id, schoolId),
				isNull(users.deleted_at)
			)
		)
		.orderBy(desc(users.created_at));

	// Daftar kelas aktif di sekolah ini
	const kelasList = await db
		.select({ id: classes.id, name: classes.name, level: classes.level })
		.from(classes)
		.where(eq(classes.school_id, schoolId))
		.orderBy(classes.name);

	const form = await superValidate(zod(siswaCreateSchema));
	return { siswas: siswaList, kelas: kelasList, form };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;

		const form = await superValidate(request, zod(siswaCreateSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const {
			name, email, password, nis, nisn, gender,
			class_id, birth_date, address, parent_name, parent_phone, is_active
		} = form.data;

		// Cek email duplikat
		const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
		if (existing.length > 0) {
			return message(form, 'Email sudah terdaftar', { status: 409 });
		}

		// Cek NIS duplikat dalam sekolah
		if (nis) {
			const dupNis = await db
				.select({ id: students.id })
				.from(students)
				.where(and(eq(students.school_id, schoolId), eq(students.nis, nis)));
			if (dupNis.length > 0) {
				return message(form, 'NIS sudah terdaftar di sekolah ini', { status: 409 });
			}
		}

		const password_hash = await bcrypt.hash(password, 12);
		const now = Date.now();

		const insertedUser = await db
			.insert(users)
			.values({
				name,
				email,
				password_hash,
				role: 'siswa',
				school_id: schoolId,
				is_active,
				created_by: user.userId,
				created_at: now,
				updated_at: now
			})
			.returning({ id: users.id });

		const newUserId = insertedUser[0].id;

		await db.insert(students).values({
			school_id: schoolId,
			user_id: newUserId,
			nis: nis || null,
			nisn: nisn || null,
			gender: gender ?? null,
			class_id: class_id ?? null,
			birth_date: birth_date || null,
			address: address || null,
			parent_name: parent_name || null,
			parent_phone: parent_phone || null,
			created_at: now
		});

		return message(form, 'Siswa berhasil ditambahkan');
	},

	update: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		const form = await superValidate(formData, zod(siswaUpdateSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const {
			name, email, password, nis, nisn, gender,
			class_id, birth_date, address, parent_name, parent_phone, is_active
		} = form.data;

		const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
		if (existing.length > 0 && existing[0].id !== id) {
			return message(form, 'Email sudah digunakan akun lain', { status: 409 });
		}

		const updateUser: Record<string, unknown> = {
			name, email, is_active, updated_at: Date.now()
		};
		if (password) {
			updateUser.password_hash = await bcrypt.hash(password, 12);
		}

		await db.update(users).set(updateUser).where(eq(users.id, id));
		await db.update(students).set({
			nis: nis || null,
			nisn: nisn || null,
			gender: gender ?? null,
			class_id: class_id ?? null,
			birth_date: birth_date || null,
			address: address || null,
			parent_name: parent_name || null,
			parent_phone: parent_phone || null
		}).where(eq(students.user_id, id));

		return message(form, 'Data siswa berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		await db.update(users).set({ deleted_at: Date.now() }).where(eq(users.id, id));
		throw redirect(303, '/dashboard/siswa');
	}
};
