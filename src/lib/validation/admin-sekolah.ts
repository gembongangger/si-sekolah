import { z } from 'zod';

export const adminSekolahCreateSchema = z.object({
	name: z.string().min(3, 'Nama minimal 3 karakter'),
	email: z.string().email('Format email tidak valid'),
	password: z.string().min(8, 'Password minimal 8 karakter'),
	school_id: z.coerce.number().int().positive('Pilih sekolah terlebih dahulu'),
	is_active: z.coerce.number().int().min(0).max(1).default(1)
});

export const adminSekolahUpdateSchema = z.object({
	name: z.string().min(3, 'Nama minimal 3 karakter'),
	email: z.string().email('Format email tidak valid'),
	password: z.string().min(8, 'Password minimal 8 karakter').optional().or(z.literal('')),
	school_id: z.coerce.number().int().positive('Pilih sekolah terlebih dahulu'),
	is_active: z.coerce.number().int().min(0).max(1).default(1)
});

export type AdminSekolahCreateInput = z.infer<typeof adminSekolahCreateSchema>;
export type AdminSekolahUpdateInput = z.infer<typeof adminSekolahUpdateSchema>;
