import type { PageServerLoad } from './$types';
import { eq, count, and, isNull } from 'drizzle-orm';
import { schools, users, teachers, students } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!; // dijamin oleh +layout.server.ts
	const db = locals.db;

	// Data statistik berbeda per role
	if (user.role === 'superadmin') {
		const [schoolCount, userCount] = await db.batch([
			db.select({ count: count() }).from(schools).where(isNull(schools.deleted_at)),
			db
				.select({ count: count() })
				.from(users)
				.where(and(isNull(users.deleted_at), eq(users.role, 'admin_sekolah')))
		]);

		return {
			stats: {
				totalSekolah: schoolCount[0]?.count ?? 0,
				totalAdminSekolah: userCount[0]?.count ?? 0
			}
		};
	}

	if (user.role === 'admin_sekolah' && user.schoolId) {
		const schoolId = user.schoolId;
		const [teacherCount, studentCount] = await db.batch([
			db
				.select({ count: count() })
				.from(teachers)
				.where(eq(teachers.school_id, schoolId)),
			db
				.select({ count: count() })
				.from(students)
				.where(eq(students.school_id, schoolId))
		]);

		return {
			stats: {
				totalGuru: teacherCount[0]?.count ?? 0,
				totalSiswa: studentCount[0]?.count ?? 0
			}
		};
	}

	return { stats: {} };
};
