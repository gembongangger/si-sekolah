import { and, eq, type SQL } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';

/**
 * Membangun kondisi WHERE tenant-scoped.
 *
 * - `schoolId !== null`  → kondisi `school_id = :schoolId` (tenant aktif).
 * - `schoolId === null`  → kondisi global (superadmin akses lintas tenant,
 *                          mis. pada tabel `schools`).
 *
 * Semua tabel operasional WAJIB memiliki kolom `school_id`; tabel tenant
 * (`schools`, `sessions`? tidak — sessions tidak punya school_id) diakses
 * lewat jalur khusus.
 */
export function tenantCondition(
	schoolIdColumn: AnySQLiteColumn,
	schoolId: number | null
): SQL | undefined {
	return schoolId === null ? undefined : eq(schoolIdColumn, schoolId);
}

/**
 * Gabungkan kondisi tenant dengan kondisi tambahan (AND).
 * Mengembalikan `undefined` jika tidak ada kondisi sama sekali.
 */
export function tenantWhere(
	schoolIdColumn: AnySQLiteColumn,
	schoolId: number | null,
	...conditions: SQL[]
): SQL | undefined {
	const parts: SQL[] = [];
	if (schoolId !== null) {
		parts.push(eq(schoolIdColumn, schoolId));
	}
	parts.push(...conditions);

	if (parts.length === 0) return undefined;
	if (parts.length === 1) return parts[0];
	return parts.slice(1).reduce<SQL | undefined>((acc, cur) => and(acc, cur), parts[0]);
}
