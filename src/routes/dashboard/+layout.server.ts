import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';
import { schools } from '$lib/server/db/schema';

/**
 * Guard utama: semua route di /dashboard/* WAJIB sudah login.
 * Redirect ke /login jika belum terautentikasi atau akun tidak aktif.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user;
	const db = locals.db;

	if (!user) {
		throw redirect(302, '/login');
	}

	if (!user.isActive) {
		throw redirect(302, '/login?error=inactive');
	}

	let school = null;
	if (user.schoolId) {
		const [s] = await db.select().from(schools).where(eq(schools.id, user.schoolId));
		school = s ?? null;
	}

	return {
		user: {
			userId: user.userId,
			name: user.name,
			email: user.email,
			role: user.role,
			schoolId: user.schoolId
		},
		school
	};
};
