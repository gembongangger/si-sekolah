import { error, redirect } from '@sveltejs/kit';
import type { SessionUser } from '$lib/server/auth/session';

export type UserRole = 'superadmin' | 'admin_sekolah' | 'guru' | 'siswa';

/**
 * Guard role: lempar error 403 jika user tidak memiliki role yang diizinkan.
 * Gunakan di +page.server.ts atau +layout.server.ts masing-masing route.
 */
export function requireRole(user: SessionUser | null, ...allowedRoles: UserRole[]): SessionUser {
	if (!user) {
		throw redirect(302, '/login');
	}
	if (!allowedRoles.includes(user.role as UserRole)) {
		throw error(403, `Akses ditolak. Halaman ini hanya untuk: ${allowedRoles.join(', ')}`);
	}
	return user;
}

/**
 * Guard superadmin: hanya superadmin yang boleh akses.
 */
export function requireSuperadmin(user: SessionUser | null): SessionUser & { schoolId: null } {
	const u = requireRole(user, 'superadmin');
	return u as SessionUser & { schoolId: null };
}

/**
 * Guard admin sekolah: hanya admin_sekolah yang boleh akses,
 * dan dipastikan memiliki schoolId.
 */
export function requireAdminSekolah(
	user: SessionUser | null
): SessionUser & { schoolId: number } {
	const u = requireRole(user, 'admin_sekolah');
	if (u.schoolId === null) {
		throw error(403, 'Admin sekolah harus memiliki sekolah terkait');
	}
	return u as SessionUser & { schoolId: number };
}

/**
 * Guard guru: hanya guru yang boleh akses.
 */
export function requireGuru(user: SessionUser | null): SessionUser & { schoolId: number } {
	const u = requireRole(user, 'guru');
	if (u.schoolId === null) {
		throw error(403, 'Guru harus memiliki sekolah terkait');
	}
	return u as SessionUser & { schoolId: number };
}

/**
 * Guard siswa: hanya siswa yang boleh akses.
 */
export function requireSiswa(user: SessionUser | null): SessionUser & { schoolId: number } {
	const u = requireRole(user, 'siswa');
	if (u.schoolId === null) {
		throw error(403, 'Siswa harus memiliki sekolah terkait');
	}
	return u as SessionUser & { schoolId: number };
}

/**
 * Guard guru atau admin sekolah (admin bisa lihat semua jurnal/pelanggaran di sekolahnya).
 */
export function requireGuruOrAdmin(user: SessionUser | null): SessionUser & { schoolId: number } {
	const u = requireRole(user, 'guru', 'admin_sekolah');
	if (u.schoolId === null) {
		throw error(403, 'User harus memiliki sekolah terkait');
	}
	return u as SessionUser & { schoolId: number };
}
