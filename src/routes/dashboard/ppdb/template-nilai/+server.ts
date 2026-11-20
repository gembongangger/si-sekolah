import { error, type RequestHandler } from '@sveltejs/kit';
import { requireAdminSekolah } from '$lib/server/auth/guard';

export const GET: RequestHandler = async ({ locals }) => {
	requireAdminSekolah(locals.user);
	const XLSX = (await import('xlsx')).default;
	const wb = XLSX.utils.book_new();
	const data = [
		['nomor_pendaftaran', 'nilai'],
		['REG-0001', 85],
		['REG-0002', 90],
		['REG-0003', 78]
	];
	const ws = XLSX.utils.aoa_to_sheet(data);
	XLSX.utils.book_append_sheet(wb, ws, 'Template');
	const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
	return new Response(buf, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': 'attachment; filename="template-import-nilai-ppdb.xlsx"'
		}
	});
};
