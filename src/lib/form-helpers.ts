/**
 * Helper untuk mengambil pesan error pertama dari Superforms field error.
 * Superforms dengan Zod v4 mengembalikan tipe campuran, ini normalize ke string | undefined.
 */
export function fieldError(err: unknown): string | undefined {
	if (!err) return undefined;
	if (Array.isArray(err)) return err[0] as string | undefined;
	if (typeof err === 'object' && '_errors' in err) {
		const e = (err as { _errors?: string[] })._errors;
		return e?.[0];
	}
	return undefined;
}

/**
 * Kembalikan true jika field memiliki error (untuk styling input).
 */
export function hasError(err: unknown): boolean {
	return !!fieldError(err);
}
