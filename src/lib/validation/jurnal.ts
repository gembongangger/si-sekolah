import { z } from 'zod';

export const jurnalSchema = z.object({
	class_id: z.coerce.number().int().positive('Pilih kelas'),
	subject_id: z.coerce.number().int().positive('Pilih mata pelajaran'),
	academic_year_id: z.coerce.number().int().positive('Pilih tahun ajaran'),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
	meeting_number: z.coerce.number().int().min(1, 'Pertemuan ke minimal 1'),
	topic: z.string().min(3, 'Topik minimal 3 karakter'),
	learning_objectives: z.string().optional(),
	activities: z.string().optional(),
	notes: z.string().optional(),
	// Absensi: hadir, sakit, izin, alfa
	att_hadir: z.coerce.number().int().min(0).default(0),
	att_sakit: z.coerce.number().int().min(0).default(0),
	att_izin: z.coerce.number().int().min(0).default(0),
	att_alfa: z.coerce.number().int().min(0).default(0)
});

export type JurnalInput = z.infer<typeof jurnalSchema>;
