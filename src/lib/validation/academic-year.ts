import { z } from 'zod';

export const academicYearSchema = z.object({
	name: z.string().min(3, 'Nama tahun ajaran minimal 3 karakter'),
	semester: z.enum(['ganjil', 'genap']),
	start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
	end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
	is_active: z.coerce.number().int().min(0).max(1).default(0)
});

export type AcademicYearInput = z.infer<typeof academicYearSchema>;
