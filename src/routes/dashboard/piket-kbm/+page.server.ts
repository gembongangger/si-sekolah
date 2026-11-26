import { fail } from '@sveltejs/kit';
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm';
import { env as cloudflareEnv } from 'cloudflare:workers';
import type { R2Bucket } from '@cloudflare/workers-types';
import { requireGuruOrAdmin } from '$lib/server/auth/guard';
import {
	piketKbmRequests,
	piketKbmManualAbsences,
	timeSlots,
	teachers,
	users,
	classes
} from '$lib/server/db/schema';
import { uploadFile } from '$lib/server/services/storage';
import { createPiketSchema, reviewPiketSchema, createManualAbsenceSchema } from '$lib/validation/piket-kbm';
import type { Actions, PageServerLoad } from './$types';

const DAY_LABELS: Record<number, string> = {
	1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis', 5: 'Jumat', 6: 'Sabtu', 7: 'Minggu'
};

function dayOfWeek(date: string): number {
	const d = new Date(`${date}T00:00:00`);
	return ((d.getDay() + 6) % 7) + 1;
}

async function getTeacherId(db: App.Locals['db'], userId: number, schoolId: number): Promise<number | null> {
	const [me] = await db
		.select({ id: teachers.id })
		.from(teachers)
		.where(and(eq(teachers.school_id, schoolId), eq(teachers.user_id, userId)))
		.limit(1);
	return me?.id ?? null;
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireGuruOrAdmin(locals.user);
	const db = locals.db;
	const schoolId = user.schoolId;
	const isGuru = user.role === 'guru';
	const teacherId = isGuru ? await getTeacherId(db, user.userId, schoolId) : null;

	const requests = !isGuru || teacherId
		? await db
				.select({
					id: piketKbmRequests.id,
					date: piketKbmRequests.date,
					slot_label: piketKbmRequests.slot_label,
					reason: piketKbmRequests.reason,
					task_note: piketKbmRequests.task_note,
					attachment_key: piketKbmRequests.attachment_key,
					attachment_name: piketKbmRequests.attachment_name,
					status: piketKbmRequests.status,
					review_note: piketKbmRequests.review_note,
					created_at: piketKbmRequests.created_at,
					teacher_name: users.name,
					teacher_id: piketKbmRequests.teacher_id
				})
				.from(piketKbmRequests)
				.innerJoin(teachers, eq(teachers.id, piketKbmRequests.teacher_id))
				.innerJoin(users, eq(users.id, teachers.user_id))
				.where(
					and(
						eq(piketKbmRequests.school_id, schoolId),
						isNull(piketKbmRequests.deleted_at),
						...(teacherId ? [eq(piketKbmRequests.teacher_id, teacherId)] : [])
					)
				)
				.orderBy(desc(piketKbmRequests.date), desc(piketKbmRequests.created_at))
				.limit(200)
		: [];

	const slots = await db
		.select({
			id: timeSlots.id,
			day_of_week: timeSlots.day_of_week,
			slot_number: timeSlots.slot_number,
			start_time: timeSlots.start_time,
			end_time: timeSlots.end_time
		})
		.from(timeSlots)
		.where(
			and(
				eq(timeSlots.school_id, schoolId),
				eq(timeSlots.is_break, 0),
				isNull(timeSlots.deleted_at)
			)
		)
		.orderBy(asc(timeSlots.day_of_week), asc(timeSlots.slot_number));

	const [classesList, teachersList] = await Promise.all([
		db
			.select({ id: classes.id, name: classes.name })
			.from(classes)
			.where(and(eq(classes.school_id, schoolId), isNull(classes.deleted_at)))
			.orderBy(asc(classes.name)),
		db
			.select({ id: teachers.id, name: users.name })
			.from(teachers)
			.innerJoin(users, eq(users.id, teachers.user_id))
			.where(and(eq(teachers.school_id, schoolId)))
			.orderBy(asc(users.name))
	]);

	const manualAbsences = await db
		.select({
			id: piketKbmManualAbsences.id,
			date: piketKbmManualAbsences.date,
			class_name: classes.name,
			start_time: timeSlots.start_time,
			end_time: timeSlots.end_time,
			teacher_name: users.name,
			note: piketKbmManualAbsences.note,
			created_at: piketKbmManualAbsences.created_at
		})
		.from(piketKbmManualAbsences)
		.innerJoin(classes, eq(classes.id, piketKbmManualAbsences.class_id))
		.innerJoin(timeSlots, eq(timeSlots.id, piketKbmManualAbsences.time_slot_id))
		.innerJoin(teachers, eq(teachers.id, piketKbmManualAbsences.teacher_id))
		.innerJoin(users, eq(users.id, teachers.user_id))
		.where(and(eq(piketKbmManualAbsences.school_id, schoolId), isNull(piketKbmManualAbsences.deleted_at)))
		.orderBy(desc(piketKbmManualAbsences.date), desc(piketKbmManualAbsences.created_at))
		.limit(200);

	return {
		isGuru,
		requests,
		slots,
		dayLabels: DAY_LABELS,
		pendingCount: requests.filter((r) => r.status === 'pending').length,
		classesList,
		teachersList,
		manualAbsences
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const user = requireGuruOrAdmin(locals.user, 'guru');
		const db = locals.db;
		const schoolId = user.schoolId;
		const formData = await request.formData();

		const slotIds = formData.getAll('slot_ids').map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0);
		const parsed = createPiketSchema.safeParse({
			date: String(formData.get('date') ?? ''),
			slot_ids: slotIds,
			reason: String(formData.get('reason') ?? ''),
			task_note: String(formData.get('task_note') ?? ''),
			attachment_name: String(formData.get('attachment_name') ?? ''),
			attachment_key: String(formData.get('attachment_key') ?? '')
		});
		if (!parsed.success) return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' });
		const data = parsed.data;

		const teacherId = await getTeacherId(db, user.userId, schoolId);
		if (!teacherId) return fail(403, { error: 'Data guru tidak ditemukan' });

		const validSlots = await db
			.select()
			.from(timeSlots)
			.where(
				and(
					eq(timeSlots.school_id, schoolId),
					eq(timeSlots.day_of_week, dayOfWeek(data.date)),
					eq(timeSlots.is_break, 0),
					isNull(timeSlots.deleted_at),
					inArray(timeSlots.id, data.slot_ids)
				)
			);
		if (validSlots.length !== data.slot_ids.length) {
			return fail(400, { error: 'Jam pelajaran tidak valid untuk tanggal tersebut' });
		}

		let attachmentKey: string | null = null;
		let attachmentName: string | null = null;
		const file = formData.get('attachment') as File | null;
		if (file && file.size > 0) {
			const bucket = cloudflareEnv?.STORAGE_BUCKET as R2Bucket | undefined;
			if (!bucket) return fail(500, { error: 'Penyimpanan R2 tidak dikonfigurasi' });
			try {
				const uploaded = await uploadFile(bucket, `piket-kbm/${schoolId}`, file, teacherId);
				attachmentKey = uploaded.key;
				attachmentName = file.name;
			} catch (e) {
				return fail(400, { error: e instanceof Error ? e.message : 'Gagal mengunggah lampiran' });
			}
		}

		const now = Date.now();
		await db.insert(piketKbmRequests).values(
			validSlots.map((slot) => ({
				school_id: schoolId,
				teacher_id: teacherId,
				date: data.date,
				time_slot_id: slot.id,
				slot_label: `${slot.start_time}-${slot.end_time}`,
				reason: data.reason,
				task_note: data.task_note || null,
				attachment_key: attachmentKey,
				attachment_name: attachmentName,
				status: 'pending',
				created_at: now,
				updated_at: now
			}))
		);

		return { success: true, message: `Pengajuan ${validSlots.length} jam berhasil dikirim` };
	},

	review: async ({ request, locals }) => {
		const user = requireGuruOrAdmin(locals.user, 'admin_sekolah');
		const db = locals.db;
		const formData = await request.formData();
		const parsed = reviewPiketSchema.safeParse({
			id: Number(formData.get('id')),
			status: String(formData.get('status')),
			review_note: String(formData.get('review_note') ?? '')
		});
		if (!parsed.success) return fail(400, { error: 'Data tidak valid' });

		const now = Date.now();
		const [updated] = await db
			.update(piketKbmRequests)
			.set({
				status: parsed.data.status,
				review_note: parsed.data.review_note || null,
				reviewed_by: user.userId,
				reviewed_at: now,
				updated_at: now
			})
			.where(
				and(
					eq(piketKbmRequests.id, parsed.data.id),
					eq(piketKbmRequests.school_id, user.schoolId),
					eq(piketKbmRequests.status, 'pending')
				)
			)
			.returning({ id: piketKbmRequests.id });
		if (!updated) return fail(404, { error: 'Pengajuan tidak ditemukan atau sudah diproses' });
		return { success: true, message: 'Status pengajuan diperbarui' };
	},

	cancel: async ({ request, locals }) => {
		const user = requireGuruOrAdmin(locals.user, 'guru');
		const db = locals.db;
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) return fail(400, { error: 'ID tidak valid' });

		const teacherId = await getTeacherId(db, user.userId, user.schoolId);
		if (!teacherId) return fail(403, { error: 'Data guru tidak ditemukan' });

		const now = Date.now();
		const [updated] = await db
			.update(piketKbmRequests)
			.set({ deleted_at: now, updated_at: now })
			.where(
				and(
					eq(piketKbmRequests.id, id),
					eq(piketKbmRequests.teacher_id, teacherId),
					eq(piketKbmRequests.school_id, user.schoolId),
					eq(piketKbmRequests.status, 'pending')
				)
			)
			.returning({ id: piketKbmRequests.id });
		if (!updated) return fail(404, { error: 'Pengajuan tidak ditemukan atau sudah diproses' });
		return { success: true, message: 'Pengajuan dibatalkan' };
	},

	createManual: async ({ request, locals }) => {
		const user = requireGuruOrAdmin(locals.user, 'guru', 'admin_sekolah');
		const db = locals.db;
		const schoolId = user.schoolId;
		const formData = await request.formData();

		const parsed = createManualAbsenceSchema.safeParse({
			date: String(formData.get('date') ?? ''),
			class_id: Number(formData.get('class_id')),
			time_slot_id: Number(formData.get('time_slot_id')),
			teacher_id: Number(formData.get('teacher_id')),
			note: String(formData.get('note') ?? '')
		});
		if (!parsed.success) return fail(400, { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' });
		const data = parsed.data;

		const validClass = await db.select({ id: classes.id }).from(classes).where(and(eq(classes.id, data.class_id), eq(classes.school_id, schoolId), isNull(classes.deleted_at))).limit(1);
		const validSlot = await db.select({ id: timeSlots.id }).from(timeSlots).where(and(eq(timeSlots.id, data.time_slot_id), eq(timeSlots.school_id, schoolId), eq(timeSlots.is_break, 0), isNull(timeSlots.deleted_at))).limit(1);
		const validTeacher = await db.select({ id: teachers.id }).from(teachers).where(and(eq(teachers.id, data.teacher_id), eq(teachers.school_id, schoolId))).limit(1);
		if (!validClass.length || !validSlot.length || !validTeacher.length) {
			return fail(400, { error: 'Kelas, jam, atau guru tidak valid untuk sekolah ini' });
		}

		const now = Date.now();
		await db.insert(piketKbmManualAbsences).values({
			school_id: schoolId,
			date: data.date,
			class_id: data.class_id,
			time_slot_id: data.time_slot_id,
			teacher_id: data.teacher_id,
			note: data.note || null,
			recorded_by: user.userId,
			created_at: now
		}).onConflictDoNothing();

		return { success: true, message: 'Catatan ketidakhadiran dicatat' };
	},

	deleteManual: async ({ request, locals }) => {
		const user = requireGuruOrAdmin(locals.user, 'guru', 'admin_sekolah');
		const db = locals.db;
		const schoolId = user.schoolId;
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) return fail(400, { error: 'ID tidak valid' });

		const now = Date.now();
		const [updated] = await db
			.update(piketKbmManualAbsences)
			.set({ deleted_at: now })
			.where(
				and(
					eq(piketKbmManualAbsences.id, id),
					eq(piketKbmManualAbsences.school_id, schoolId),
					...(user.role === 'guru' ? [eq(piketKbmManualAbsences.recorded_by, user.userId)] : [])
				)
			)
			.returning({ id: piketKbmManualAbsences.id });
		if (!updated) return fail(404, { error: 'Catatan tidak ditemukan' });
		return { success: true, message: 'Catatan dihapus' };
	}
};