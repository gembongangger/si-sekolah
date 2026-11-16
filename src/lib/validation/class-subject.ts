import { z } from 'zod';

export const classSubjectSchema = z.object({
	class_id: z.coerce.number().int().positive('Pilih kelas'),
	subject_id: z.coerce.number().int().positive('Pilih mata pelajaran'),
	teacher_id: z.coerce.number().int().positive('Pilih guru'),
	academic_year_id: z.coerce.number().int().positive('Pilih tahun ajaran'),
	hours_per_week: z.preprocess(
		(v) => (v === '' || v === null || v === undefined ? null : v),
		z.coerce
			.number()
			.int('Jam per minggu harus bilangan bulat')
			.min(1, 'Minimal 1 jam per minggu')
			.max(40, 'Maksimal 40 jam per minggu')
			.nullable()
	)
});

export type ClassSubjectInput = z.infer<typeof classSubjectSchema>;
