import { z } from 'zod';

export const guruCreateSchema = z.object({
	name: z.string().min(3, 'Nama minimal 3 karakter'),
	email: z.string().email('Format email tidak valid'),
	password: z.string().min(8, 'Password minimal 8 karakter'),
	nip: z.string().optional(),
	gender: z.enum(['L', 'P']).optional(),
	phone: z.string().optional(),
	is_active: z.coerce.number().int().min(0).max(1).default(1)
});

export const guruUpdateSchema = z.object({
	name: z.string().min(3, 'Nama minimal 3 karakter'),
	email: z.string().email('Format email tidak valid'),
	password: z.string().min(8, 'Password minimal 8 karakter').optional().or(z.literal('')),
	nip: z.string().optional(),
	gender: z.enum(['L', 'P']).optional(),
	phone: z.string().optional(),
	is_active: z.coerce.number().int().min(0).max(1).default(1)
});

export type GuruCreateInput = z.infer<typeof guruCreateSchema>;
export type GuruUpdateInput = z.infer<typeof guruUpdateSchema>;
