const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_CONTENT_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

/**
 * Generate deterministic storage key for a file upload.
 * Uses UUID-like prefix + original filename for readability.
 */
export function generateKey(folder: string, filename: string, id: number | string): string {
	const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
	return `${folder}/${id}/${safeName}`;
}

/**
 * Upload a file to R2 bucket.
 * Returns the storage key on success.
 */
export async function uploadFile(
	bucket: R2Bucket,
	folder: string,
	file: File,
	id: number | string
): Promise<{ key: string; url: string }> {
	if (file.size > MAX_FILE_SIZE) {
		throw new Error('Ukuran file melebihi batas maksimum 10 MB.');
	}

	if (!ALLOWED_CONTENT_TYPES.includes(file.type)) {
		throw new Error('Tipe file tidak didukung. Hanya JPG, PNG, WEBP, PDF, dan DOC/DOCX yang diperbolehkan.');
	}

	const key = generateKey(folder, file.name, id);
	const buffer = await file.arrayBuffer();
	const uploaded = await bucket.put(key, buffer, {
		httpMetadata: { contentType: file.type }
	});

	if (!uploaded.key) throw new Error('Gagal menyimpan file ke penyimpanan.');

	return { key, url: `/api/storage/${key}` };
}

/**
 * Download/read a file from R2 bucket.
 * Returns null if the object does not exist.
 */
export async function getFile(bucket: R2Bucket, key: string): Promise<R2ObjectBody | null> {
	return await bucket.get(key);
}

/**
 * Delete a file from R2 bucket.
 * Returns true if deleted, false if object did not exist.
 */
export async function deleteFile(bucket: R2Bucket, key: string): Promise<boolean> {
	await bucket.delete(key);
	return true;
}
