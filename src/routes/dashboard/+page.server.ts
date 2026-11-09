import type { PageServerLoad } from './$types';
import { eq, count, and, isNull, sql, desc } from 'drizzle-orm';
import { schools, users, teachers, students, sppPayments, classes, academicYears } from '$lib/server/db/schema';

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
		const [teacherCount, studentCount, kasMasuk] = await Promise.all([
			db
				.select({ count: count() })
				.from(teachers)
				.where(eq(teachers.school_id, schoolId)),
			db
				.select({ count: count() })
				.from(students)
				.where(eq(students.school_id, schoolId)),
			db
				.select({ total: sql<number>`COALESCE(SUM(amount_paid), 0)` })
				.from(sppPayments)
				.where(eq(sppPayments.school_id, schoolId))
		]);

		return {
			stats: {
				totalGuru: teacherCount[0]?.count ?? 0,
				totalSiswa: studentCount[0]?.count ?? 0,
				totalKasSPP: Number(kasMasuk[0]?.total ?? 0)
			}
		};
	}

	if (user.role === 'admin_keuangan' && user.schoolId) {
		const schoolId = user.schoolId;
		const [activeYear] = await db
			.select()
			.from(academicYears)
			.where(and(eq(academicYears.school_id, schoolId), eq(academicYears.is_active, 1)));

		const [totalKas, totalTagihan, studentCount, recentPayments] = await Promise.all([
			db
				.select({ total: sql<number>`COALESCE(SUM(amount_paid), 0)` })
				.from(sppPayments)
				.where(eq(sppPayments.school_id, schoolId)),
			db
				.select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
				.from(sppPayments)
				.where(eq(sppPayments.school_id, schoolId)),
			db
				.select({ count: count() })
				.from(students)
				.where(eq(students.school_id, schoolId)),
			db
				.select({
					id: sppPayments.id,
					monthName: sppPayments.month_name,
					year: sppPayments.year,
					amountPaid: sppPayments.amount_paid,
					paymentDate: sppPayments.payment_date,
					paymentMethod: sppPayments.payment_method,
					invoiceNumber: sppPayments.invoice_number,
					studentName: users.name,
					className: classes.name
				})
				.from(sppPayments)
				.innerJoin(students, eq(sppPayments.student_id, students.id))
				.innerJoin(users, eq(students.user_id, users.id))
				.leftJoin(classes, eq(students.class_id, classes.id))
				.where(and(eq(sppPayments.school_id, schoolId), eq(sppPayments.status, 'paid')))
				.orderBy(desc(sppPayments.updated_at), desc(sppPayments.id))
				.limit(5)
		]);

		const kasMasuk = Number(totalKas[0]?.total ?? 0);
		const tagihan = Number(totalTagihan[0]?.total ?? 0);
		const tunggakan = Math.max(0, tagihan - kasMasuk);

		return {
			stats: {
				totalKasMasuk: kasMasuk,
				totalTagihan: tagihan,
				totalTunggakan: tunggakan,
				totalSiswa: studentCount[0]?.count ?? 0,
				activeYearName: activeYear ? `${activeYear.name} (${activeYear.semester})` : '-'
			},
			recentPayments
		};
	}

	if (user.role === 'siswa' && user.schoolId) {
		const [student] = await db
			.select()
			.from(students)
			.where(and(eq(students.school_id, user.schoolId), eq(students.user_id, user.userId)));

		if (student) {
			const [paidCount, pendingCount] = await Promise.all([
				db
					.select({ count: count() })
					.from(sppPayments)
					.where(and(eq(sppPayments.student_id, student.id), eq(sppPayments.status, 'paid'))),
				db
					.select({ count: count() })
					.from(sppPayments)
					.where(and(eq(sppPayments.student_id, student.id), eq(sppPayments.status, 'pending')))
			]);

			return {
				stats: {
					sppLunas: paidCount[0]?.count ?? 0,
					sppPending: pendingCount[0]?.count ?? 0
				}
			};
		}
	}

	return { stats: {} };
};
