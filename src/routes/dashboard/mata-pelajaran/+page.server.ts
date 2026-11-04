import { error, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireAdminSekolah } from '$lib/server/auth/guard';
import { subjectSchema } from '$lib/validation/subject';
import { subjects } from '$lib/server/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdminSekolah(locals.user);

	const db = locals.db;
	const schoolId = locals.user!.schoolId!;

	const list = await db
		.select()
		.from(subjects)
		.where(and(eq(subjects.school_id, schoolId), isNull(subjects.deleted_at)))
		.orderBy(desc(subjects.created_at));

	const form = await superValidate(zod(subjectSchema));

	return { subjects: list, form };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = locals.user!.schoolId!;

		const form = await superValidate(request, zod(subjectSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		// Cek duplikasi kode dalam sekolah ini
		const existing = await db
			.select({ id: subjects.id })
			.from(subjects)
			.where(
				and(
					eq(subjects.school_id, schoolId),
					eq(subjects.code, form.data.code)
				)
			);

		if (existing.length > 0) {
			return message(form, 'Kode mata pelajaran sudah digunakan', { status: 409 });
		}

		const now = Date.now();
		await db.insert(subjects).values({
			school_id: schoolId,
			code: form.data.code,
			name: form.data.name,
			created_at: now
		});

		return message(form, 'Mata pelajaran berhasil ditambahkan');
	},

	update: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = locals.user!.schoolId!;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		const form = await superValidate(formData, zod(subjectSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		// Cek duplikasi kode selain subject ini
		const existing = await db
			.select({ id: subjects.id })
			.from(subjects)
			.where(
				and(
					eq(subjects.school_id, schoolId),
					eq(subjects.code, form.data.code)
				)
			);

		if (existing.length > 0 && existing[0].id !== id) {
			return message(form, 'Kode mata pelajaran sudah digunakan', { status: 409 });
		}

		await db
			.update(subjects)
			.set({
				code: form.data.code,
				name: form.data.name
			})
			.where(eq(subjects.id, id));

		return message(form, 'Mata pelajaran berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		await db
			.update(subjects)
			.set({ deleted_at: Date.now() })
			.where(eq(subjects.id, id));

		throw redirect(303, '/dashboard/mata-pelajaran');
	}
};
