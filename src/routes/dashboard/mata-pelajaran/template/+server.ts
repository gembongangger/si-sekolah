import type { RequestHandler } from './$types';
import { requireAdminSekolah } from '$lib/server/auth/guard';
import * as XLSX from 'xlsx';

export const GET: RequestHandler = async ({ locals }) => {
	requireAdminSekolah(locals.user);
	const ws = XLSX.utils.json_to_sheet([
		{ Kode: 'BIO', Nama: 'Biologi', 'Jam per Minggu': 4 },
		{ Kode: 'KIM', Nama: 'Kimia', 'Jam per Minggu': 3 },
		{ Kode: 'FIS', Nama: 'Fisika', 'Jam per Minggu': 3 },
		{ Kode: 'MAT', Nama: 'Matematika', 'Jam per Minggu': 4 },
		{ Kode: 'BIN', Nama: 'Bahasa Indonesia', 'Jam per Minggu': 4 },
		{ Kode: 'BIG', Nama: 'Bahasa Inggris', 'Jam per Minggu': 3 }
	]);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Template');
	const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

	return new Response(buf, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': 'attachment; filename="mata-pelajaran-template.xlsx"'
		}
	});
};
