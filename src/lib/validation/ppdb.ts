import { z } from 'zod';

export const ppdbRegistrationSchema = z.object({
	school_id: z.coerce.number().int().positive('Pilih sekolah'),
	batch_id: z.coerce.number().int().positive('Pilih gelombang pendaftaran'),
	full_name: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
	nisn: z.string().regex(/^\d{10}$/, 'NISN harus 10 digit angka').optional().or(z.literal('')),
	nik: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit angka').optional().or(z.literal('')),
	gender: z.enum(['L', 'P']),
	birth_place: z.string().optional(),
	birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal lahir: YYYY-MM-DD'),
	religion: z.string().default('Islam'),
	address: z.string().min(5, 'Alamat lengkap wajib diisi'),
	phone: z.string().min(9, 'Nomor HP/WA minimal 9 digit').optional().or(z.literal('')),
	email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
	previous_school: z.string().min(3, 'Nama sekolah asal wajib diisi'),
	graduation_year: z.coerce.number().int().min(2020).max(2035).optional(),
	track: z.string().min(1, 'Pilih jalur pendaftaran'),
	major_choice: z.string().min(2, 'Pilih peminatan/jurusan'),
	parent_name: z.string().min(3, 'Nama orang tua/wali wajib diisi'),
	parent_phone: z.string().min(9, 'Nomor telepon orang tua wajib diisi'),
	parent_job: z.string().optional()
});

export const DEFAULT_PPDB_TRACKS = [
	{ code: 'reguler', name: 'Jalur Reguler (Tes CBT & Wawancara)' },
	{ code: 'prestasi', name: 'Jalur Prestasi (Rapor & Sertifikat Piagam)' },
	{ code: 'zonasi', name: 'Jalur Zonasi (Radius Domisili)' },
	{ code: 'afirmasi', name: 'Jalur Afirmasi (Keluarga Prasejahtera / KIP)' }
];

export const ppdbBatchSchema = z.object({
	academic_year_id: z.coerce.number().int().positive('Pilih tahun ajaran'),
	name: z.string().min(3, 'Nama gelombang minimal 3 karakter'),
	start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal mulai: YYYY-MM-DD'),
	end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal selesai: YYYY-MM-DD'),
	quota: z.coerce.number().int().min(1, 'Kuota minimal 1'),
	registration_fee: z.coerce.number().int().min(0, 'Biaya pendaftaran tidak boleh negatif'),
	description: z.string().optional(),
	is_active: z.coerce.number().int().min(0).max(1).default(1)
});

export type PpdbRegistrationInput = z.infer<typeof ppdbRegistrationSchema>;
export type PpdbBatchInput = z.infer<typeof ppdbBatchSchema>;
