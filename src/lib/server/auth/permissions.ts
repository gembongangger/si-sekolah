import { error } from '@sveltejs/kit';
import type { SessionUser } from './session';

/**
 * Pastikan user yang terautentikasi memiliki role superadmin.
 * Superadmin (platform owner) boleh mengakses semua tenant.
 */
export function requireSuperadmin(user: SessionUser | null): asserts user is SessionUser {
	if (user?.role !== 'superadmin') {
		throw error(403, 'Akses ditolak: superadmin diperlukan');
	}
}

/**
 * Pastikan user yang terautentikasi memiliki role admin_sekolah
 * dan mengakses tenant (school_id) yang sama.
 */
export function requireSchoolAdmin(user: SessionUser | null): asserts user is SessionUser & {
	schoolId: number;
} {
	if (user?.role !== 'admin_sekolah' || user.schoolId === null) {
		throw error(403, 'Akses ditolak: admin sekolah diperlukan');
	}
}

/**
 * Pastikan user yang terautentikasi memiliki role guru.
 */
export function requireGuru(user: SessionUser | null): asserts user is SessionUser {
	if (user?.role !== 'guru') {
		throw error(403, 'Akses ditolak: guru diperlukan');
	}
}

/**
 * Pastikan user yang terautentikasi memiliki role siswa.
 */
export function requireSiswa(user: SessionUser | null): asserts user is SessionUser {
	if (user?.role !== 'siswa') {
		throw error(403, 'Akses ditolak: siswa diperlukan');
	}
}
