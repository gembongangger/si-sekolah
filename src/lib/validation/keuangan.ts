import { z } from 'zod';

export const sppSettingSchema = z.object({
	academic_year_id: z.coerce.number().int().positive('Pilih tahun ajaran'),
	level: z.string().min(1, 'Tingkat kelas wajib diisi'),
	amount: z.coerce.number().int().min(0, 'Tarif tidak boleh negatif'),
	description: z.string().optional()
});

export const generateSppBillsSchema = z.object({
	academic_year_id: z.coerce.number().int().positive('Pilih tahun ajaran'),
	class_id: z.coerce.number().int().optional(), // optional filter per kelas
	amount: z.coerce.number().int().min(0, 'Tarif tidak boleh negatif').optional()
});

export const paySppSchema = z.object({
	payment_ids: z.string().min(1, 'Pilih minimal satu tagihan SPP untuk dibayar'),
	payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
	payment_method: z.enum(['cash', 'transfer']),
	notes: z.string().optional()
});

export type SppSettingInput = z.infer<typeof sppSettingSchema>;
export type GenerateSppBillsInput = z.infer<typeof generateSppBillsSchema>;
export type PaySppInput = z.infer<typeof paySppSchema>;
