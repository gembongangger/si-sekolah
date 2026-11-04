import { error, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireAdminSekolah } from '$lib/server/auth/guard';
import { timeSlotSchema } from '$lib/validation/time-slot';
import { timeSlots } from '$lib/server/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

const dayLabels: Record<number, string> = {
	1: 'Senin',
	2: 'Selasa',
	3: 'Rabu',
	4: 'Kamis',
	5: 'Jumat',
	6: 'Sabtu',
	7: 'Minggu'
};

export const load: PageServerLoad = async ({ locals }) => {
	requireAdminSekolah(locals.user);

	const db = locals.db;
	const schoolId = locals.user!.schoolId!;

	const list = await db
		.select()
		.from(timeSlots)
		.where(and(eq(timeSlots.school_id, schoolId), isNull(timeSlots.deleted_at)))
		.orderBy(desc(timeSlots.created_at));

	const form = await superValidate(zod(timeSlotSchema));

	return { timeSlots: list, dayLabels, form };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = locals.user!.schoolId!;

		const form = await superValidate(request, zod(timeSlotSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { day_of_week, slot_number, start_time, end_time, is_break } = form.data;

		// Cek duplikasi slot dalam hari yang sama
		const existing = await db
			.select({ id: timeSlots.id })
			.from(timeSlots)
			.where(
				and(
					eq(timeSlots.school_id, schoolId),
					eq(timeSlots.day_of_week, day_of_week),
					eq(timeSlots.slot_number, slot_number)
				)
			);

		if (existing.length > 0) {
			return message(form, 'Slot waktu untuk hari dan nomor ini sudah ada', { status: 409 });
		}

		const now = Date.now();
		await db.insert(timeSlots).values({
			school_id: schoolId,
			day_of_week,
			slot_number,
			start_time,
			end_time,
			is_break,
			created_at: now
		});

		return message(form, 'Slot waktu berhasil ditambahkan');
	},

	update: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = locals.user!.schoolId!;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		const form = await superValidate(formData, zod(timeSlotSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const { day_of_week, slot_number, start_time, end_time, is_break } = form.data;

		const existing = await db
			.select({ id: timeSlots.id })
			.from(timeSlots)
			.where(
				and(
					eq(timeSlots.school_id, schoolId),
					eq(timeSlots.day_of_week, day_of_week),
					eq(timeSlots.slot_number, slot_number)
				)
			);

		if (existing.length > 0 && existing[0].id !== id) {
			return message(form, 'Slot waktu untuk hari dan nomor ini sudah ada', { status: 409 });
		}

		await db
			.update(timeSlots)
			.set({
				day_of_week,
				slot_number,
				start_time,
				end_time,
				is_break
			})
			.where(eq(timeSlots.id, id));

		return message(form, 'Slot waktu berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		await db
			.update(timeSlots)
			.set({ deleted_at: Date.now() })
			.where(eq(timeSlots.id, id));

		throw redirect(303, '/dashboard/jam-pelajaran');
	}
};
