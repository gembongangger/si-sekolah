import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireRole } from '$lib/server/auth/guard';
import {
	schools,
	users,
	students,
	classes,
	academicYears,
	sppPayments,
	keuanganTransactions
} from '$lib/server/db/schema';
import { eq, and, desc, asc, sql, count } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireRole(locals.user, 'admin_keuangan', 'admin_sekolah');
	if (user.schoolId === null) {
		throw error(403, 'User harus memiliki sekolah terkait');
	}

	const db = locals.db;
	const schoolId = user.schoolId;

	const yearFilter = url.searchParams.get('year_id')
		? Number(url.searchParams.get('year_id'))
		: null;

	const [allYears, activeYear, [school]] = await Promise.all([
		db
			.select({
				id: academicYears.id,
				name: academicYears.name,
				semester: academicYears.semester,
				isActive: academicYears.is_active
			})
			.from(academicYears)
			.where(eq(academicYears.school_id, schoolId))
			.orderBy(desc(academicYears.id)),
		db
			.select()
			.from(academicYears)
			.where(and(eq(academicYears.school_id, schoolId), eq(academicYears.is_active, 1))),
		db
			.select({
				name: schools.name,
				address: schools.address,
				phone: schools.phone,
				npsn: schools.npsn
			})
			.from(schools)
			.where(eq(schools.id, schoolId))
	]);

	const selectedYearId = yearFilter || (activeYear[0] ? activeYear[0].id : null);

	// 1. REKAPITULASI PER KELAS
	const allSchoolClasses = await db
		.select({
			id: classes.id,
			name: classes.name,
			level: classes.level
		})
		.from(classes)
		.where(eq(classes.school_id, schoolId))
		.orderBy(asc(classes.name));

	const classSummaries = [];
	let grandTotalSiswa = 0;
	let grandTotalKewajiban = 0;
	let grandTotalDibayar = 0;
	let grandTotalTunggakan = 0;

	for (const c of allSchoolClasses) {
		const [studentCountRow, paidRow, allRow] = await Promise.all([
			db
				.select({ count: count() })
				.from(students)
				.where(and(eq(students.school_id, schoolId), eq(students.class_id, c.id))),
			db
				.select({ total: sql<number>`COALESCE(SUM(${sppPayments.amount_paid}), 0)` })
				.from(sppPayments)
				.innerJoin(students, eq(sppPayments.student_id, students.id))
				.where(
					and(
						eq(sppPayments.school_id, schoolId),
						selectedYearId ? eq(sppPayments.academic_year_id, selectedYearId) : sql`1=1`,
						eq(students.class_id, c.id)
					)
				),
			db
				.select({ total: sql<number>`COALESCE(SUM(${sppPayments.amount}), 0)` })
				.from(sppPayments)
				.innerJoin(students, eq(sppPayments.student_id, students.id))
				.where(
					and(
						eq(sppPayments.school_id, schoolId),
						selectedYearId ? eq(sppPayments.academic_year_id, selectedYearId) : sql`1=1`,
						eq(students.class_id, c.id)
					)
				)
		]);

		const totalSiswa = studentCountRow[0]?.count ?? 0;
		const totalKewajiban = Number(allRow[0]?.total ?? 0);
		const totalDibayar = Number(paidRow[0]?.total ?? 0);
		const sisaTunggakan = Math.max(0, totalKewajiban - totalDibayar);
		const persenLunas = totalKewajiban > 0 ? Math.round((totalDibayar / totalKewajiban) * 100) : 0;

		grandTotalSiswa += totalSiswa;
		grandTotalKewajiban += totalKewajiban;
		grandTotalDibayar += totalDibayar;
		grandTotalTunggakan += sisaTunggakan;

		classSummaries.push({
			classId: c.id,
			className: c.name,
			classLevel: c.level,
			totalSiswa,
			totalKewajiban,
			totalDibayar,
			sisaTunggakan,
			persenLunas
		});
	}

	// 2. DAFTAR SISWA MENUNGGAK (STATUS PENDING)
	const arrearsRows = await db
		.select({
			studentId: students.id,
			studentName: users.name,
			nis: students.nis,
			className: classes.name,
			parentName: students.parent_name,
			parentPhone: students.parent_phone,
			unpaidMonthsCount: sql<number>`count(${sppPayments.id})`,
			totalArrears: sql<number>`SUM(${sppPayments.amount} - ${sppPayments.amount_paid})`
		})
		.from(sppPayments)
		.innerJoin(students, eq(sppPayments.student_id, students.id))
		.innerJoin(users, eq(students.user_id, users.id))
		.leftJoin(classes, eq(students.class_id, classes.id))
		.where(
			and(
				eq(sppPayments.school_id, schoolId),
				selectedYearId ? eq(sppPayments.academic_year_id, selectedYearId) : sql`1=1`,
				eq(sppPayments.status, 'pending')
			)
		)
		.groupBy(students.id)
		.having(sql`count(${sppPayments.id}) > 0`)
		.orderBy(desc(sql`SUM(${sppPayments.amount} - ${sppPayments.amount_paid})`));

	// 3. JURNAL PENERIMAAN KAS PEMBAYARAN (TRANSAKSI LUNAS TERBARU)
	const cashReceipts = await db
		.select({
			id: sppPayments.id,
			paymentDate: sppPayments.payment_date,
			invoiceNumber: sppPayments.invoice_number,
			studentName: users.name,
			studentNis: students.nis,
			className: classes.name,
			monthName: sppPayments.month_name,
			year: sppPayments.year,
			amountPaid: sppPayments.amount_paid,
			paymentMethod: sppPayments.payment_method,
			cashierName: sql<string>`(SELECT name FROM users WHERE id = ${sppPayments.received_by})`
		})
		.from(sppPayments)
		.innerJoin(students, eq(sppPayments.student_id, students.id))
		.innerJoin(users, eq(students.user_id, users.id))
		.leftJoin(classes, eq(students.class_id, classes.id))
		.where(
			and(
				eq(sppPayments.school_id, schoolId),
				selectedYearId ? eq(sppPayments.academic_year_id, selectedYearId) : sql`1=1`,
				eq(sppPayments.status, 'paid')
			)
		)
		.orderBy(desc(sppPayments.payment_date), desc(sppPayments.id))
		.limit(100);

	// 4. JURNAL PENGELUARAN / PENARIKAN DANA
	const expenseRows = await db
		.select({
			id: keuanganTransactions.id,
			date: keuanganTransactions.date,
			category: keuanganTransactions.category,
			description: keuanganTransactions.description,
			notes: keuanganTransactions.notes,
			amount: keuanganTransactions.amount,
			createdByName: sql<string>`(SELECT name FROM users WHERE id = ${keuanganTransactions.created_by})`
		})
		.from(keuanganTransactions)
		.where(
			and(
				eq(keuanganTransactions.school_id, schoolId),
				eq(keuanganTransactions.type, 'pengeluaran'),
				selectedYearId ? eq(keuanganTransactions.academic_year_id, selectedYearId) : sql`1=1`
			)
		)
		.orderBy(desc(keuanganTransactions.date), desc(keuanganTransactions.id))
		.limit(100);

	const totalPengeluaran = expenseRows.reduce((acc, r) => acc + Number(r.amount), 0);

	return {
		school,
		allYears,
		activeYear: activeYear[0] ?? null,
		selectedYearId,
		classSummaries,
		grandTotal: {
			totalSiswa: grandTotalSiswa,
			totalKewajiban: grandTotalKewajiban,
			totalDibayar: grandTotalDibayar,
			totalTunggakan: grandTotalTunggakan,
			persenLunas:
				grandTotalKewajiban > 0
					? Math.round((grandTotalDibayar / grandTotalKewajiban) * 100)
					: 0
		},
		arrearsRows,
		cashReceipts,
		expenseRows,
		totalPengeluaran
	};
};
