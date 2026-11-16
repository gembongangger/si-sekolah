import { error, redirect, fail } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireAdminSekolah } from '$lib/server/auth/guard';
import { subjectSchema } from '$lib/validation/subject';
import { subjects } from '$lib/server/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import * as XLSX from 'xlsx';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireAdminSekolah(locals.user);
	const db = locals.db;
	const schoolId = user.schoolId!;

	const list = await db
		.select()
		.from(subjects)
		.where(and(eq(subjects.school_id, schoolId), isNull(subjects.deleted_at)))
		.orderBy(desc(subjects.created_at));

	const form = await superValidate(zod(subjectSchema));

	return { subjects: list, form };
};

export const actions: Actions = {
	export: async ({ locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId!;

		const list = await db
			.select({ code: subjects.code, name: subjects.name, hours_per_week: subjects.hours_per_week })
			.from(subjects)
			.where(and(eq(subjects.school_id, schoolId), isNull(subjects.deleted_at)))
			.orderBy(subjects.code);

		const ws = XLSX.utils.json_to_sheet(list.map((r) => ({
			Kode: r.code,
			Nama: r.name,
			'Jam per Minggu': r.hours_per_week
		})));
		XLSX.utils.sheet_add_aoa(ws, [['Kode', 'Nama', 'Jam per Minggu']], { origin: 'A1' });
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'Mata Pelajaran');
		const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

		return new Response(buf, {
			headers: {
				'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
				'Content-Disposition': 'attachment; filename="mata-pelajaran-export.xlsx"'
			}
		});
	},

	import: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId!;

		const formData = await request.formData();
		const file = formData.get('file') as File;
		if (!file || file.size === 0) {
			return fail(400, { error: 'File tidak boleh kosong' });
		}

		const buf = Buffer.from(await file.arrayBuffer());
		const wb = XLSX.read(buf, { type: 'buffer' });
		const ws = wb.Sheets[wb.SheetNames[0]];
		const rows = XLSX.utils.sheet_to_json<{ Kode: string; Nama: string; 'Jam per Minggu': number }>(ws, { defval: '' });

		if (!rows.length) {
			return fail(400, { error: 'File tidak berisi data' });
		}

		const errors: string[] = [];
		let imported = 0;
		let skipped = 0;
		const now = Date.now();

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const line = i + 2;
			const code = String(row.Kode ?? '').trim().toUpperCase();
			const name = String(row.Nama ?? '').trim();
			const hours = Number(row['Jam per Minggu'] ?? 2);

			if (!code || !name) {
				errors.push(`Baris ${line}: Kode dan Nama wajib diisi`);
				continue;
			}
			if (!Number.isInteger(hours) || hours < 1 || hours > 40) {
				errors.push(`Baris ${line}: Jam per minggu harus bilangan bulat 1-40`);
				continue;
			}

			const existing = await db
				.select({ id: subjects.id })
				.from(subjects)
				.where(and(eq(subjects.school_id, schoolId), eq(subjects.code, code)))
				.limit(1);

			if (existing.length > 0) {
				skipped++;
				errors.push(`Baris ${line}: Kode '${code}' sudah ada, dilewati`);
				continue;
			}

			await db.insert(subjects).values({
				school_id: schoolId,
				code,
				name,
				hours_per_week: hours,
				created_at: now
			});
			imported++;
		}

		const msg = `Import selesai: ${imported} ditambah${skipped ? `, ${skipped} dilewati` : ''}`;
		return message(await superValidate(zod(subjectSchema)), msg + (errors.length ? ` — Detail: ${errors.join('; ')}` : ''), {
			status: errors.length ? 207 : 200
		});
	},

	create: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId!;

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
			hours_per_week: form.data.hours_per_week,
			created_at: now
		});

		return message(form, 'Mata pelajaran berhasil ditambahkan');
	},

	update: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId!;

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
				name: form.data.name,
				hours_per_week: form.data.hours_per_week
			})
			.where(eq(subjects.id, id));

		return message(form, 'Mata pelajaran berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId!;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		await db
			.update(subjects)
			.set({ deleted_at: Date.now() })
			.where(and(eq(subjects.id, id), eq(subjects.school_id, schoolId)));

		throw redirect(303, '/dashboard/mata-pelajaran');
	}
};