import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFile } from '$lib/server/services/storage';

export const GET: RequestHandler = async ({ platform, params, url }) => {
	const key = params.key;
	if (!key) throw error(400, 'Key tidak diberikan');

	const bucket = platform?.env?.STORAGE_BUCKET;
	if (!bucket) throw error(500, 'Storage bucket tidak tersedia');

	const object = await getFile(bucket, key);
	if (!object) throw error(404, 'File tidak ditemukan');

	const isDownload = url.searchParams.has('download');
	const filename = key.split('/').pop() ?? 'file';

	return new Response(object.body, {
		headers: {
			'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
			'Content-Disposition': `${isDownload ? 'attachment' : 'inline'}; filename="${filename}"`,
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
