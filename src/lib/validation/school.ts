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
	slug: z
		.string()
		.regex(/^[a-z0-9-]*$/, 'Slug hanya huruf kecil, angka, dan tanda hubung')
		.max(60, 'Slug maksimal 60 karakter')
		.optional()
		.or(z.literal('')),
	timezone: z.string().default('Asia/Jakarta'),
	is_active: z.coerce.number().int().min(0).max(1).default(1)
});

/** Ubah nama menjadi slug URL-friendly. */
export function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
}

export type SchoolInput = z.infer<typeof schoolSchema>;
