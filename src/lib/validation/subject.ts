import { z } from 'zod';

export const subjectSchema = z.object({
	code: z.string().min(1, 'Kode mata pelajaran wajib diisi'),
	name: z.string().min(3, 'Nama mata pelajaran minimal 3 karakter'),
	hours_per_week: z.coerce
		.number()
		.int('Jam per minggu harus bilangan bulat')
		.min(1, 'Minimal 1 jam per minggu')
		.max(40, 'Maksimal 40 jam per minggu')
		.default(2)
});

export type SubjectInput = z.infer<typeof subjectSchema>;
