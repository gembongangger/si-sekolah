import type { PageServerLoad } from './$types';
import { eq, count, and, isNull, sql, desc } from 'drizzle-orm';
import { schools, users, teachers, students, sppPayments, classes, academicYears, ppdbRegistrations } from '$lib/server/db/schema';

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

		const [activeSchools, inactiveSchools] = await db.batch([
			db.select({ count: count() }).from(schools).where(and(isNull(schools.deleted_at), eq(schools.is_active, 1))),
			db.select({ count: count() }).from(schools).where(and(isNull(schools.deleted_at), eq(schools.is_active, 0)))
		]);

		return {
			stats: {
				totalSekolah: schoolCount[0]?.count ?? 0,
				totalAdminSekolah: userCount[0]?.count ?? 0
			},
			charts: {
				schoolsByStatus: [
					{ label: 'Aktif', value: Number(activeSchools[0]?.count ?? 0) },
					{ label: 'Nonaktif', value: Number(inactiveSchools[0]?.count ?? 0) }
				]
			}
		};
	}

	if (user.role === 'admin_sekolah' && user.schoolId) {
		const schoolId = user.schoolId;
		const [teacherCount, studentCount, kasMasuk, studentsPerClass, ppdbByStatus, ppdbByTrack] = await Promise.all([
			db.select({ count: count() }).from(teachers).where(eq(teachers.school_id, schoolId)),
			db.select({ count: count() }).from(students).where(eq(students.school_id, schoolId)),
			db.select({ total: sql<number>`COALESCE(SUM(amount_paid), 0)` }).from(sppPayments).where(eq(sppPayments.school_id, schoolId)),
			db
				.select({ name: classes.name, total: count() })
				.from(students)
				.leftJoin(classes, eq(students.class_id, classes.id))
				.where(eq(students.school_id, schoolId))
				.groupBy(classes.name)
				.orderBy(desc(count()))
				.limit(8),
			db
				.select({ status: ppdbRegistrations.status, total: count() })
				.from(ppdbRegistrations)
				.where(eq(ppdbRegistrations.school_id, schoolId))
				.groupBy(ppdbRegistrations.status),
			db
				.select({ track: ppdbRegistrations.track, total: count() })
				.from(ppdbRegistrations)
				.where(eq(ppdbRegistrations.school_id, schoolId))
				.groupBy(ppdbRegistrations.track)
		]);

		return {
			stats: {
				totalGuru: teacherCount[0]?.count ?? 0,
				totalSiswa: studentCount[0]?.count ?? 0,
				totalKasSPP: Number(kasMasuk[0]?.total ?? 0)
			},
			charts: {
				studentsPerClass: studentsPerClass.map((r) => ({ label: r.name ?? '?', value: Number(r.total) })),
				ppdbByStatus: ppdbByStatus.map((r) => ({ label: r.status, value: Number(r.total) })),
				ppdbByTrack: ppdbByTrack.map((r) => ({ label: r.track, value: Number(r.total) }))
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

		const [paymentsByMonth, sppStatusRows] = await Promise.all([
			db
				.select({ month: sppPayments.month, monthName: sppPayments.month_name, total: sql<number>`COALESCE(SUM(amount_paid), 0)` })
				.from(sppPayments)
				.where(and(eq(sppPayments.school_id, schoolId), eq(sppPayments.status, 'paid')))
				.groupBy(sppPayments.month, sppPayments.month_name)
				.orderBy(sql`${sppPayments.month} ASC`),
			db
				.select({ status: sppPayments.status, total: count() })
				.from(sppPayments)
				.where(eq(sppPayments.school_id, schoolId))
				.groupBy(sppPayments.status)
		]);

		return {
			stats: {
				totalKasMasuk: kasMasuk,
				totalTagihan: tagihan,
				totalTunggakan: tunggakan,
				totalSiswa: studentCount[0]?.count ?? 0,
				activeYearName: activeYear ? `${activeYear.name} (${activeYear.semester})` : '-'
			},
			recentPayments,
			charts: {
				paymentsByMonth: paymentsByMonth.map((r) => ({ label: r.monthName, value: Number(r.total) })),
				sppStatus: sppStatusRows.map((r) => ({ label: r.status === 'paid' ? 'Lunas' : 'Pending', value: Number(r.total) }))
			}
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
				},
				charts: {
					sppStatus: [
						{ label: 'Lunas', value: Number(paidCount[0]?.count ?? 0) },
						{ label: 'Pending', value: Number(pendingCount[0]?.count ?? 0) }
					]
				}
			};
		}
	}

	return { stats: {}, charts: {} };
};
