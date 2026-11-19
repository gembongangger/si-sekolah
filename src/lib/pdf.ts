/**
 * Minimal PDF writer (client-side) — embeds a JPEG as a single-page PDF.
 * No external deps. Binary-safe xref offsets.
 */
const enc = new TextEncoder();

/**
 * Convert already-compressed JPEG bytes into a valid one-page PDF.
 */
export function jpegBytesToPdf(jpeg: Uint8Array, width: number, height: number): Uint8Array {
	const chunks: Uint8Array[] = [];
	const offsets: number[] = [0];
	let pos = 0;

	const push = (data: string | Uint8Array) => {
		const bytes = typeof data === 'string' ? enc.encode(data) : data;
		chunks.push(bytes);
		pos += bytes.length;
	};

	push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

	offsets[1] = pos;
	push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

	offsets[2] = pos;
	push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

	offsets[3] = pos;
	push(
		`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] ` +
			`/Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
	);

	offsets[4] = pos;
	push(
		`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} ` +
			`/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`
	);
	push(jpeg);
	push('\nendstream\nendobj\n');

	const content = `q ${width} 0 0 ${height} 0 0 cm /Im0 Do Q`;
	offsets[5] = pos;
	push(`5 0 obj\n<< /Length ${enc.encode(content).length} >>\nstream\n${content}\nendstream\nendobj\n`);

	const xrefStart = pos;
	push('xref\n0 6\n0000000000 65535 f \n');
	for (let i = 1; i <= 5; i++) push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
	push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

	const out = new Uint8Array(pos);
	let at = 0;
	for (const chunk of chunks) {
		out.set(chunk, at);
		at += chunk.length;
	}
	return out;
}

/**
 * Compress an image File via canvas (downscale + JPEG quality) then wrap in PDF.
 * Browser only. Returns a new File with .pdf MIME type.
 */
export async function imageFileToCompressedPdf(
	file: File,
	options: { maxDimension?: number; jpegQuality?: number; label?: string } = {}
): Promise<File> {
	if (typeof window === 'undefined' || typeof createImageBitmap === 'undefined') {
		throw new Error('imageFileToCompressedPdf hanya bisa dijalankan di browser.');
	}

	const maxDim = options.maxDimension ?? 1600;
	const quality = options.jpegQuality ?? 0.72;

	const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	let w = bitmap.width;
	let h = bitmap.height;
	if (w > maxDim || h > maxDim) {
		const scale = Math.min(maxDim / w, maxDim / h);
		w = Math.round(w * scale);
		h = Math.round(h * scale);
	}

	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas 2D tidak tersedia.');
	ctx.drawImage(bitmap, 0, 0, w, h);
	bitmap.close();

	const jpegBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
	if (!jpegBlob) throw new Error('Gagal mengompresi gambar ke JPEG.');

	const jpeg = new Uint8Array(await jpegBlob.arrayBuffer());
	const pdf = jpegBytesToPdf(jpeg, w, h);
	const buffer = new ArrayBuffer(pdf.length);
	new Uint8Array(buffer).set(pdf);

	const name = options.label ?? file.name.replace(/\.[^.]+$/, '');
	return new File([buffer], `${name}.pdf`, { type: 'application/pdf' });
}

/** Blob/Uint8Array → PDF bytes (for Node self-checks). */
export async function jpegToPdfNode(input: Uint8Array | Blob, width: number, height: number): Promise<Uint8Array> {
	const bytes = input instanceof Uint8Array ? input : new Uint8Array(await input.arrayBuffer());
	return jpegBytesToPdf(bytes, width, height);
}
