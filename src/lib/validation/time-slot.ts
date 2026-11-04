import { z } from 'zod';

export const timeSlotSchema = z.object({
	day_of_week: z.coerce.number().int().min(1).max(7, 'Hari 1-7 (Senin-Minggu)'),
	slot_number: z.coerce.number().int().min(1, 'Nomor slot minimal 1'),
	start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu: HH:MM'),
	end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu: HH:MM'),
	is_break: z.coerce.number().int().min(0).max(1).default(0)
});

export type TimeSlotInput = z.infer<typeof timeSlotSchema>;
