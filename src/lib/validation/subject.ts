import { z } from 'zod';

export const subjectSchema = z.object({
	code: z.string().min(1, 'Kode mata pelajaran wajib diisi'),
	name: z.string().min(3, 'Nama mata pelajaran minimal 3 karakter')
});

export type SubjectInput = z.infer<typeof subjectSchema>;
