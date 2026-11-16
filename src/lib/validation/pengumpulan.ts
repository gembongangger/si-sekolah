import { z } from 'zod';

export const collectionProjectSchema = z.object({
	title: z.string().min(3, 'Judul minimal 3 karakter'),
	description: z.string().optional(),
	deadline: z.string().optional(),
	target_type: z.enum(['all', 'teacher']).default('all'),
	is_active: z.coerce.number().int().min(0).max(1).default(1)
});

export type CollectionProjectInput = z.infer<typeof collectionProjectSchema>;
