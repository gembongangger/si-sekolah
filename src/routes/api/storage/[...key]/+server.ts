import { error } from '@sveltejs/kit';
import { env as cloudflareEnv } from 'cloudflare:workers';
import type { RequestHandler } from './$types';
import { getFile } from '$lib/server/services/storage';

export const GET: RequestHandler = async ({ params, url }) => {
	const key = params.key;
	if (!key) throw error(400, 'Key tidak diberikan');

	const bucket = cloudflareEnv?.STORAGE_BUCKET as R2Bucket | undefined;
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
