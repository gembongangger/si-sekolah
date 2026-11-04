import { z } from 'zod';

export const violationTypeSchema = z.object({
	code: z.string().min(1, 'Kode wajib diisi'),
	name: z.string().min(3, 'Nama minimal 3 karakter'),
	category: z.enum(['ringan', 'sedang', 'berat']),
	points: z.coerce.number().int().min(0, 'Poin tidak boleh negatif'),
	description: z.string().optional(),
	is_active: z.coerce.number().int().min(0).max(1).default(1)
});

export const studentViolationSchema = z.object({
	student_id: z.coerce.number().int().positive('Pilih siswa'),
	violation_type_id: z.coerce.number().int().positive('Pilih jenis pelanggaran'),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
	description: z.string().optional(),
	academic_year_id: z.coerce.number().int().positive('Pilih tahun ajaran')
});

export const verifyViolationSchema = z.object({
	status: z.enum(['verified', 'rejected'])
});

export type ViolationTypeInput = z.infer<typeof violationTypeSchema>;
export type StudentViolationInput = z.infer<typeof studentViolationSchema>;
export type VerifyViolationInput = z.infer<typeof verifyViolationSchema>;
