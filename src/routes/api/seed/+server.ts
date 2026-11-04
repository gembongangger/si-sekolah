/**
 * Endpoint seed database: POST /api/seed
 *
 * HANYA untuk environment development / staging.
 * Di production, endpoint ini mengembalikan 403.
 *
 * Gunakan untuk membuat akun superadmin awal.
 * Setelah selesai, hapus atau nonaktifkan endpoint ini.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async ({ locals, platform }) => {
	// Blokir di production
	const env = platform?.env?.ENVIRONMENT ?? 'development';
	if (env === 'production') {
		return json({ error: 'Tidak diizinkan di production' }, { status: 403 });
	}

	const db = locals.db;

	// Cek apakah superadmin sudah ada
	const existing = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.role, 'superadmin'));

	if (existing.length > 0) {
		return json({
			success: false,
			message: 'Superadmin sudah ada. Seed tidak dijalankan ulang.',
			superadmin_id: existing[0].id
		});
	}

	// Buat superadmin awal
	const password_hash = await bcrypt.hash('admin123', 12);
	const now = Date.now();

	const result = await db
		.insert(users)
		.values({
			name: 'Super Admin',
			email: 'admin@sis.id',
			password_hash,
			role: 'superadmin',
			school_id: null,
			is_active: 1,
			created_at: now,
			updated_at: now
		})
		.returning({ id: users.id });

	return json({
		success: true,
		message: 'Superadmin berhasil dibuat. Segera ganti password setelah login!',
		credentials: {
			email: 'admin@sis.id',
			password: 'admin123',
			warning: 'GANTI PASSWORD SEGERA!'
		},
		superadmin_id: result[0].id
	});
};
