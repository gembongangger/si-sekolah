import type { Database } from './index';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

/**
 * Seed database awal.
 * Hanya membuat superadmin jika belum ada.
 * Dipanggil dari endpoint POST /api/seed (dev only).
 */
export async function seed(db: Database): Promise<{ created: boolean; message: string }> {
	// Cek superadmin sudah ada
	const existing = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.role, 'superadmin'));

	if (existing.length > 0) {
		return { created: false, message: 'Superadmin sudah ada' };
	}

	const password_hash = await bcrypt.hash('admin123', 12);
	const now = Date.now();

	await db.insert(users).values({
		name: 'Super Admin',
		email: 'admin@sis.id',
		password_hash,
		role: 'superadmin',
		school_id: null,
		is_active: 1,
		created_at: now,
		updated_at: now
	});

	return {
		created: true,
		message: 'Superadmin dibuat: admin@sis.id / admin123 — GANTI PASSWORD!'
	};
}
