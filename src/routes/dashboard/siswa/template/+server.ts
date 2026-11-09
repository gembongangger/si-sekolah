import type { RequestHandler } from './$types';
import { requireAdminSekolah } from '$lib/server/auth/guard';
import { classes, schools } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import * as XLSX from 'xlsx';

export const GET: RequestHandler = async ({ locals }) => {
	const user = requireAdminSekolah(locals.user);
	const db = locals.db;
	const schoolId = user.schoolId;

	const [schoolRows, classList] = await Promise.all([
		db.select().from(schools).where(eq(schools.id, schoolId)),
		db
			.select({ name: classes.name, level: classes.level })
			.from(classes)
			.where(and(eq(classes.school_id, schoolId), isNull(classes.deleted_at)))
			.orderBy(classes.name)
	]);

	const schoolName = schoolRows[0]?.name ?? 'Sekolah';
	const firstClassName = classList[0]?.name ?? 'X-1';

	const wb = XLSX.utils.book_new();

	// Sheet 1: Template Data Siswa
	const headers = [
		'Nama Lengkap *',
		'NIS',
		'NISN',
		'Kelas *',
		'Jenis Kelamin (L/P)',
		'Email',
		'Password',
		'Tanggal Lahir (YYYY-MM-DD)',
		'Alamat',
		'Nama Orang Tua',
		'Telepon Orang Tua'
	];

	const sampleRows = [
		headers,
		[
			'Ahmad Syahputra',
			'260050',
			'0081234567',
			firstClassName,
			'L',
			'',
			'',
			'2009-08-15',
			'Jl. Melati No. 12',
			'Hendra Syahputra',
			'081234567890'
		],
		[
			'Nurul Aini',
			'260051',
			'0081234568',
			firstClassName,
			'P',
			'',
			'',
			'2009-11-20',
			'Jl. Mawar No. 4',
			'Bambang Aini',
			'081234567891'
		]
	];

	const ws1 = XLSX.utils.aoa_to_sheet(sampleRows);
	ws1['!cols'] = [
		{ wch: 25 },
		{ wch: 14 },
		{ wch: 16 },
		{ wch: 16 },
		{ wch: 20 },
		{ wch: 30 },
		{ wch: 16 },
		{ wch: 26 },
		{ wch: 30 },
		{ wch: 25 },
		{ wch: 20 }
	];
	XLSX.utils.book_append_sheet(wb, ws1, 'Data Siswa');

	// Sheet 2: Petunjuk & Daftar Kelas
	const instructions: (string | number)[][] = [
		['PETUNJUK PENGISIAN TEMPLATE IMPORT SISWA - ' + schoolName.toUpperCase()],
		[''],
		['1. Kolom bertanda bintang (*) WAJIB diisi.'],
		['2. Kolom "Nama Lengkap": Minimal 3 karakter.'],
		['3. Kolom "NIS": Nomor Induk Siswa. Boleh kosong, jika diisi tidak boleh sama dengan siswa lain.'],
		['4. Kolom "NISN": Nomor Induk Siswa Nasional (10 digit). Boleh kosong.'],
		['5. Kolom "Kelas": WAJIB diisi persis sesuai nama kelas yang terdaftar (lihat daftar di bawah).'],
		['6. Kolom "Jenis Kelamin": Diisi L (Laki-laki) atau P (Perempuan).'],
		['7. Kolom "Email": Boleh dikosongkan. Jika kosong, sistem otomatis membuatkan email unik.'],
		['8. Kolom "Password": Boleh dikosongkan (otomatis menggunakan password default: siswa12345).'],
		['9. Kolom "Tanggal Lahir": Format YYYY-MM-DD (contoh: 2009-08-15).'],
		['10. Kolom "Alamat", "Nama Orang Tua", "Telepon Orang Tua": Opsional.'],
		[''],
		['DAFTAR KELAS TERSEDIA DI ' + schoolName.toUpperCase() + ':'],
		['Nama Kelas', 'Tingkat']
	];

	for (const c of classList) {
		instructions.push([c.name, c.level]);
	}

	const ws2 = XLSX.utils.aoa_to_sheet(instructions);
	ws2['!cols'] = [{ wch: 30 }, { wch: 15 }];
	XLSX.utils.book_append_sheet(wb, ws2, 'Petunjuk & Daftar Kelas');

	const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

	const safeFilename = `template_import_siswa_${schoolName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.xlsx`;

	return new Response(buffer, {
		status: 200,
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="${safeFilename}"`
		}
	});
};
