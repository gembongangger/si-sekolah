import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireRole } from '$lib/server/auth/guard';
import {
	schools,
	users,
	students,
	classes,
	academicYears,
	sppPayments,
	sppSettings
} from '$lib/server/db/schema';
import { eq, and, sql, desc, asc, like, or, inArray } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireRole(locals.user, 'admin_keuangan', 'admin_sekolah', 'siswa');
	if (user.schoolId === null) {
		throw error(403, 'User harus memiliki sekolah terkait');
	}

	const db = locals.db;
	const schoolId = user.schoolId;

	// Ambil data profil sekolah untuk header kuitansi
	const [school] = await db
		.select({
			name: schools.name,
			address: schools.address,
			phone: schools.phone,
			npsn: schools.npsn
		})
		.from(schools)
		.where(eq(schools.id, schoolId));

	// ── VIEW UNTUK SISWA ──────────────────────────────────────────
	if (user.role === 'siswa') {
		const [student] = await db
			.select({
				id: students.id,
				nis: students.nis,
				nisn: students.nisn,
				className: classes.name,
				classLevel: classes.level
			})
			.from(students)
			.leftJoin(classes, eq(students.class_id, classes.id))
			.where(and(eq(students.school_id, schoolId), eq(students.user_id, user.userId)));

		if (!student) {
			return {
				isSiswa: true,
				student: null,
				school,
				siswaPayments: [],
				adminPayments: [],
				summary: { totalKewajiban: 0, totalDibayar: 0, sisaTunggakan: 0 }
			};
		}

		// Ambil riwayat tagihan & pembayaran siswa
		const payments = await db
			.select({
				id: sppPayments.id,
				month: sppPayments.month,
				monthName: sppPayments.month_name,
				year: sppPayments.year,
				amount: sppPayments.amount,
				amountPaid: sppPayments.amount_paid,
				status: sppPayments.status,
				paymentDate: sppPayments.payment_date,
				paymentMethod: sppPayments.payment_method,
				invoiceNumber: sppPayments.invoice_number,
				notes: sppPayments.notes,
				academicYearName: academicYears.name,
				academicYearSemester: academicYears.semester
			})
			.from(sppPayments)
			.innerJoin(academicYears, eq(sppPayments.academic_year_id, academicYears.id))
			.where(and(eq(sppPayments.school_id, schoolId), eq(sppPayments.student_id, student.id)))
			.orderBy(asc(sppPayments.year), asc(sppPayments.month));

		const totalKewajiban = payments.reduce((acc, p) => acc + p.amount, 0);
		const totalDibayar = payments.reduce((acc, p) => acc + p.amountPaid, 0);
		const sisaTunggakan = Math.max(0, totalKewajiban - totalDibayar);

		return {
			isSiswa: true,
			student: {
				...student,
				name: user.name
			},
			school,
			siswaPayments: payments,
			adminPayments: [],
			summary: {
				totalKewajiban,
				totalDibayar,
				sisaTunggakan
			}
		};
	}

	// ── VIEW UNTUK ADMIN KEUANGAN & ADMIN SEKOLAH ─────────────────
	const classFilter = url.searchParams.get('class_id')
		? Number(url.searchParams.get('class_id'))
		: null;
	const yearFilter = url.searchParams.get('year_id')
		? Number(url.searchParams.get('year_id'))
		: null;
	const monthFilter = url.searchParams.get('month')
		? Number(url.searchParams.get('month'))
		: null;
	const statusFilter = url.searchParams.get('status') || 'all';
	const search = (url.searchParams.get('q') || '').trim();

	// Ambil daftar tahun ajaran & kelas untuk filter
	const [allYears, allClasses, activeYear] = await Promise.all([
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
			.select({
				id: classes.id,
				name: classes.name,
				level: classes.level
			})
			.from(classes)
			.where(eq(classes.school_id, schoolId))
			.orderBy(asc(classes.name)),
		db
			.select()
			.from(academicYears)
			.where(and(eq(academicYears.school_id, schoolId), eq(academicYears.is_active, 1)))
	]);

	const selectedYearId = yearFilter || (activeYear[0] ? activeYear[0].id : null);

	// Bangun kondisi WHERE
	const conditions = [eq(sppPayments.school_id, schoolId)];

	if (selectedYearId) {
		conditions.push(eq(sppPayments.academic_year_id, selectedYearId));
	}
	if (classFilter) {
		conditions.push(eq(students.class_id, classFilter));
	}
	if (monthFilter) {
		conditions.push(eq(sppPayments.month, monthFilter));
	}
	if (statusFilter === 'paid') {
		conditions.push(eq(sppPayments.status, 'paid'));
	} else if (statusFilter === 'pending') {
		conditions.push(eq(sppPayments.status, 'pending'));
	}

	if (search) {
		conditions.push(
			or(
				like(users.name, `%${search}%`),
				like(students.nis, `%${search}%`),
				like(sppPayments.invoice_number, `%${search}%`)
			)!
		);
	}

	// Query pembayaran
	const payments = await db
		.select({
			id: sppPayments.id,
			studentId: sppPayments.student_id,
			studentName: users.name,
			studentNis: students.nis,
			classId: students.class_id,
			className: classes.name,
			academicYearId: sppPayments.academic_year_id,
			academicYearName: academicYears.name,
			month: sppPayments.month,
			monthName: sppPayments.month_name,
			year: sppPayments.year,
			amount: sppPayments.amount,
			amountPaid: sppPayments.amount_paid,
			status: sppPayments.status,
			paymentDate: sppPayments.payment_date,
			paymentMethod: sppPayments.payment_method,
			invoiceNumber: sppPayments.invoice_number,
			receivedBy: sppPayments.received_by,
			cashierName: sql<string>`(SELECT name FROM users WHERE id = ${sppPayments.received_by})`,
			notes: sppPayments.notes,
			updatedAt: sppPayments.updated_at
		})
		.from(sppPayments)
		.innerJoin(students, eq(sppPayments.student_id, students.id))
		.innerJoin(users, eq(students.user_id, users.id))
		.innerJoin(academicYears, eq(sppPayments.academic_year_id, academicYears.id))
		.leftJoin(classes, eq(students.class_id, classes.id))
		.where(and(...conditions))
		.orderBy(desc(sppPayments.updated_at), desc(sppPayments.id))
		.limit(100);

	// Ambil daftar siswa untuk modal pembayaran cepat (pilih siswa)
	const studentOptions = await db
		.select({
			id: students.id,
			name: users.name,
			nis: students.nis,
			className: classes.name,
			classLevel: classes.level
		})
		.from(students)
		.innerJoin(users, eq(students.user_id, users.id))
		.leftJoin(classes, eq(students.class_id, classes.id))
		.where(eq(students.school_id, schoolId))
		.orderBy(asc(classes.name), asc(users.name));

	// Ringkasan statistik filter saat ini
	const [totalPaidRow, totalAllRow] = await Promise.all([
		db
			.select({ total: sql<number>`COALESCE(SUM(amount_paid), 0)` })
			.from(sppPayments)
			.where(
				and(
					eq(sppPayments.school_id, schoolId),
					selectedYearId ? eq(sppPayments.academic_year_id, selectedYearId) : sql`1=1`
				)
			),
		db
			.select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
			.from(sppPayments)
			.where(
				and(
					eq(sppPayments.school_id, schoolId),
					selectedYearId ? eq(sppPayments.academic_year_id, selectedYearId) : sql`1=1`
				)
			)
	]);

	const totalKas = Number(totalPaidRow[0]?.total ?? 0);
	const totalKewajiban = Number(totalAllRow[0]?.total ?? 0);
	const totalTunggakan = Math.max(0, totalKewajiban - totalKas);

	return {
		isSiswa: false,
		userRole: user.role,
		school,
		allYears,
		allClasses,
		activeYear: activeYear[0] ?? null,
		selectedYearId,
		siswaPayments: [],
		adminPayments: payments,
		studentOptions,
		stats: {
			totalKas,
			totalKewajiban,
			totalTunggakan
		},
		filters: {
			classId: classFilter,
			yearId: selectedYearId,
			month: monthFilter,
			status: statusFilter,
			q: search
		}
	};
};

export const actions: Actions = {
	/**
	 * Bayar satu atau beberapa tagihan SPP sekaligus.
	 */
	pay: async ({ request, locals }) => {
		const user = requireRole(locals.user, 'admin_keuangan', 'admin_sekolah');
		if (user.schoolId === null) {
			return fail(403, { message: 'Akses ditolak' });
		}

		const db = locals.db;
		const schoolId = user.schoolId;
		const data = await request.formData();

		const paymentIdsRaw = data.get('payment_ids')?.toString();
		const paymentDate =
			data.get('payment_date')?.toString() || new Date().toISOString().slice(0, 10);
		const paymentMethod = (data.get('payment_method')?.toString() || 'cash') as 'cash' | 'transfer';
		const notes = data.get('notes')?.toString() || null;

		if (!paymentIdsRaw) {
			return fail(400, { message: 'Pilih minimal satu tagihan untuk dibayar' });
		}

		const paymentIds = paymentIdsRaw
			.split(',')
			.map((s) => Number(s.trim()))
			.filter((n) => !isNaN(n) && n > 0);

		if (paymentIds.length === 0) {
			return fail(400, { message: 'ID tagihan tidak valid' });
		}

		// Ambil data tagihan yang dipilih dan pastikan milik sekolah ini
		const items = await db
			.select()
			.from(sppPayments)
			.where(and(eq(sppPayments.school_id, schoolId), inArray(sppPayments.id, paymentIds)));

		if (items.length === 0) {
			return fail(404, { message: 'Data tagihan tidak ditemukan' });
		}

		const now = Date.now();
		const dateObj = new Date(paymentDate);
		const yStr = dateObj.getFullYear().toString();
		const mStr = String(dateObj.getMonth() + 1).padStart(2, '0');

		for (const item of items) {
			// Generate invoice unik
			const invoiceNum = `INV/SPP/${yStr}${mStr}/${String(item.id).padStart(4, '0')}`;
			await db
				.update(sppPayments)
				.set({
					status: 'paid',
					amount_paid: item.amount,
					payment_date: paymentDate,
					payment_method: paymentMethod,
					invoice_number: invoiceNum,
					received_by: user.userId,
					notes: notes ?? item.notes,
					updated_at: now
				})
				.where(eq(sppPayments.id, item.id));
		}

		return {
			success: true,
			message: `Berhasil memproses pembayaran ${items.length} bulan SPP.`
		};
	},

	/**
	 * Batalkan pembayaran (revert ke pending) jika terjadi kesalahan input kasir.
	 */
	cancelPayment: async ({ request, locals }) => {
		const user = requireRole(locals.user, 'admin_keuangan', 'admin_sekolah');
		if (user.schoolId === null) {
			return fail(403, { message: 'Akses ditolak' });
		}

		const db = locals.db;
		const schoolId = user.schoolId;
		const data = await request.formData();
		const paymentId = Number(data.get('payment_id'));

		if (!paymentId) {
			return fail(400, { message: 'ID pembayaran tidak valid' });
		}

		const [payment] = await db
			.select()
			.from(sppPayments)
			.where(and(eq(sppPayments.school_id, schoolId), eq(sppPayments.id, paymentId)));

		if (!payment) {
			return fail(404, { message: 'Data pembayaran tidak ditemukan' });
		}

		await db
			.update(sppPayments)
			.set({
				status: 'pending',
				amount_paid: 0,
				payment_date: null,
				invoice_number: null,
				received_by: null,
				updated_at: Date.now()
			})
			.where(eq(sppPayments.id, payment.id));

		return {
			success: true,
			message: 'Pembayaran berhasil dibatalkan dan status kembali menjadi belum lunas.'
		};
	}
};
