import { error, fail } from '@sveltejs/kit';
import { requireAdminSekolah } from '$lib/server/auth/guard';
import { env as cloudflareEnv } from 'cloudflare:workers';
import { uploadFile } from '$lib/server/services/storage';
import type { R2Bucket } from '@cloudflare/workers-types';

export const load = async ({ locals }: any) => {
	requireAdminSekolah(locals.user);
	const bucket = cloudflareEnv?.STORAGE_BUCKET as R2Bucket | undefined;
	return { hasBucket: !!bucket };
};

export const actions = {
	default: async ({ request, locals, platform }) => {
		requireAdminSekolah(locals.user);
		const bucket = cloudflareEnv?.STORAGE_BUCKET as R2Bucket | undefined;
		if (!bucket) {
			return fail(500, { error: 'STORAGE_BUCKET tidak tersedia di platform.env' });
		}

		const formData = await request.formData();
		const file = formData.get('file');
		if (!(file instanceof File)) {
			return fail(400, { error: 'Pilih file terlebih dahulu' });
		}

		try {
			const { key, url } = await uploadFile(bucket, 'test-r2', file, Date.now());
			return {
				success: true,
				message: `Berhasil upload: ${key}`,
				key,
				url,
				size: file.size,
				type: file.type
			};
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			return fail(500, { error: `Gagal upload: ${msg}` });
		}
	}
};
