import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * Guard utama: semua route di /dashboard/* WAJIB sudah login.
 * Redirect ke /login jika belum terautentikasi atau akun tidak aktif.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
	const user = locals.user;

	if (!user) {
		throw redirect(302, '/login');
	}

	if (!user.isActive) {
		// Akun nonaktif — arahkan ke halaman khusus atau login dengan pesan
		throw redirect(302, '/login?error=inactive');
	}

	return {
		user: {
			userId: user.userId,
			name: user.name,
			email: user.email,
			role: user.role,
			schoolId: user.schoolId
		}
	};
};
