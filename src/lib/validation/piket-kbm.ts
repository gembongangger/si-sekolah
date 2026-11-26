import { z } from 'zod';

export const createPiketSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi'),
	slot_ids: z.array(z.number().int().positive()).min(1, 'Pilih minimal satu jam pelajaran'),
	reason: z.string().trim().min(5, 'Alasan wajib diisi (minimal 5 karakter)').max(500),
	task_note: z.string().trim().max(1000).optional().default(''),
	attachment_name: z.string().trim().max(255).optional().default(''),
	attachment_key: z.string().trim().max(500).optional().default('')
});

export const reviewPiketSchema = z.object({
	id: z.number().int().positive(),
	status: z.enum(['approved', 'rejected']),
	review_note: z.string().trim().max(500).optional().default('')
});

export const createManualAbsenceSchema = z.object({
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi'),
	class_id: z.number().int().positive('Kelas wajib dipilih'),
	time_slot_id: z.number().int().positive('Jam pelajaran wajib dipilih'),
	teacher_id: z.number().int().positive('Guru wajib dipilih'),
	note: z.string().trim().max(500).optional().default('')
});

export type CreatePiketInput = z.infer<typeof createPiketSchema>;
