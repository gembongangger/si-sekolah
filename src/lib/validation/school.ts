import { z } from 'zod';

export const schoolSchema = z.object({
	name: z.string().min(3, 'Nama sekolah minimal 3 karakter'),
	npsn: z
		.string()
		.length(8, 'NPSN harus 8 digit')
		.regex(/^\d+$/, 'NPSN hanya boleh angka'),
	address: z.string().optional(),
	phone: z.string().optional(),
	email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
	timezone: z.string().default('Asia/Jakarta'),
	is_active: z.coerce.number().int().min(0).max(1).default(1)
});

export type SchoolInput = z.infer<typeof schoolSchema>;
