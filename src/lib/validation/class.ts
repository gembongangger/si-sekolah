import { z } from 'zod';

export const classSchema = z.object({
	academic_year_id: z.coerce.number().int().positive('Pilih tahun ajaran'),
	name: z.string().min(1, 'Nama kelas wajib diisi'),
	level: z.string().min(1, 'Tingkat wajib diisi'),
	homeroom_teacher_id: z.coerce.number().int().positive().optional().nullable()
});

export type ClassInput = z.infer<typeof classSchema>;
