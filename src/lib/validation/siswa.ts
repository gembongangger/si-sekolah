import { z } from 'zod';

export const siswaCreateSchema = z.object({
	name: z.string().min(3, 'Nama minimal 3 karakter'),
	email: z.string().email('Format email tidak valid'),
	password: z.string().min(8, 'Password minimal 8 karakter'),
	nis: z.string().optional(),
	nisn: z.string().optional(),
	gender: z.enum(['L', 'P']).optional(),
	class_id: z.coerce.number().int().positive().optional(),
	birth_date: z.string().optional(),
	address: z.string().optional(),
	parent_name: z.string().optional(),
	parent_phone: z.string().optional(),
	is_active: z.coerce.number().int().min(0).max(1).default(1)
});

export const siswaUpdateSchema = z.object({
	name: z.string().min(3, 'Nama minimal 3 karakter'),
	email: z.string().email('Format email tidak valid'),
	password: z.string().min(8, 'Password minimal 8 karakter').optional().or(z.literal('')),
	nis: z.string().optional(),
	nisn: z.string().optional(),
	gender: z.enum(['L', 'P']).optional(),
	class_id: z.coerce.number().int().positive().optional(),
	birth_date: z.string().optional(),
	address: z.string().optional(),
	parent_name: z.string().optional(),
	parent_phone: z.string().optional(),
	is_active: z.coerce.number().int().min(0).max(1).default(1)
});

export type SiswaCreateInput = z.infer<typeof siswaCreateSchema>;
export type SiswaUpdateInput = z.infer<typeof siswaUpdateSchema>;
