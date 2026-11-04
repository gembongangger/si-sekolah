import { z } from 'zod';

export const classSubjectSchema = z.object({
	class_id: z.coerce.number().int().positive('Pilih kelas'),
	subject_id: z.coerce.number().int().positive('Pilih mata pelajaran'),
	teacher_id: z.coerce.number().int().positive('Pilih guru'),
	academic_year_id: z.coerce.number().int().positive('Pilih tahun ajaran')
});

export type ClassSubjectInput = z.infer<typeof classSubjectSchema>;
