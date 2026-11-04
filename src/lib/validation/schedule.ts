import { z } from 'zod';

export const scheduleSchema = z.object({
	academic_year_id: z.coerce.number().int().positive('Pilih tahun ajaran'),
	class_id: z.coerce.number().int().positive('Pilih kelas'),
	subject_id: z.coerce.number().int().positive('Pilih mata pelajaran'),
	teacher_id: z.coerce.number().int().positive('Pilih guru'),
	time_slot_id: z.coerce.number().int().positive('Pilih slot waktu'),
	room: z.string().optional()
});

export type ScheduleInput = z.infer<typeof scheduleSchema>;
