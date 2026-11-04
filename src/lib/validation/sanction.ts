import { z } from 'zod';

export const sanctionSchema = z.object({
	min_points: z.coerce.number().int().min(0, 'Poin minimal tidak boleh negatif'),
	max_points: z.coerce.number().int().min(0, 'Poin maksimal tidak boleh negatif'),
	name: z.string().min(3, 'Nama sanksi minimal 3 karakter'),
	action: z.string().min(3, 'Tindakan sanksi minimal 3 karakter')
});

export type SanctionInput = z.infer<typeof sanctionSchema>;
