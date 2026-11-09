import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireRole } from '$lib/server/auth/guard';
import {
	academicYears,
	classes,
	students,
	users,
	sppSettings,
	sppPayments
} from '$lib/server/db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

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

	const [allYears, activeYear] = await Promise.all([
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
			.where(and(eq(academicYears.school_id, schoolId), eq(academicYears.is_active, 1)))
	]);

	const selectedYearId = yearFilter || (activeYear[0] ? activeYear[0].id : null);

	// Ambil daftar tarif SPP untuk tahun ajaran terpilih
	const settings = selectedYearId
		? await db
				.select({
					id: sppSettings.id,
					level: sppSettings.level,
					amount: sppSettings.amount,
					description: sppSettings.description,
					academicYearId: sppSettings.academic_year_id,
					academicYearName: academicYears.name,
					academicYearSemester: academicYears.semester
				})
				.from(sppSettings)
				.innerJoin(academicYears, eq(sppSettings.academic_year_id, academicYears.id))
				.where(
					and(
						eq(sppSettings.school_id, schoolId),
						eq(sppSettings.academic_year_id, selectedYearId)
					)
				)
				.orderBy(asc(sppSettings.level))
		: [];

	// Hitung siswa per tingkat kelas
	const levelCounts = await db
		.select({
			level: classes.level,
			totalSiswa: sql<number>`count(${students.id})`
		})
		.from(students)
		.innerJoin(classes, eq(students.class_id, classes.id))
		.where(eq(students.school_id, schoolId))
		.groupBy(classes.level)
		.orderBy(asc(classes.level));

	// Hitung total tagihan yang sudah digenerate
	const generatedBillsCount = selectedYearId
		? await db
				.select({ count: sql<number>`count(*)` })
				.from(sppPayments)
				.where(
					and(
						eq(sppPayments.school_id, schoolId),
						eq(sppPayments.academic_year_id, selectedYearId)
					)
				)
		: [{ count: 0 }];

	return {
		allYears,
		activeYear: activeYear[0] ?? null,
		selectedYearId,
		settings,
		levelCounts,
		totalBillsGenerated: Number(generatedBillsCount[0]?.count ?? 0)
	};
};

export const actions: Actions = {
	/**
	 * Simpan atau perbarui tarif SPP per tingkat.
	 */
	saveTarif: async ({ request, locals }) => {
		const user = requireRole(locals.user, 'admin_keuangan', 'admin_sekolah');
		if (user.schoolId === null) {
			return fail(403, { message: 'Akses ditolak' });
		}

		const db = locals.db;
		const schoolId = user.schoolId;
		const data = await request.formData();

		const academicYearId = Number(data.get('academic_year_id'));
		const level = (data.get('level')?.toString() || '').trim().toUpperCase();
		const amount = Number(data.get('amount'));
		const description = data.get('description')?.toString() || null;
		const settingId = data.get('setting_id') ? Number(data.get('setting_id')) : null;

		if (!academicYearId || !level || isNaN(amount) || amount < 0) {
			return fail(400, { message: 'Tahun ajaran, tingkat kelas, dan nominal tarif wajib diisi valid.' });
		}

		const now = Date.now();

		if (settingId) {
			// Update
			await db
				.update(sppSettings)
				.set({
					level,
					amount,
					description,
					updated_at: now
				})
				.where(and(eq(sppSettings.id, settingId), eq(sppSettings.school_id, schoolId)));

			return { success: true, message: `Tarif SPP tingkat ${level} berhasil diperbarui.` };
		} else {
			// Check if already exists for this school, year, level
			const [existing] = await db
				.select()
				.from(sppSettings)
				.where(
					and(
						eq(sppSettings.school_id, schoolId),
						eq(sppSettings.academic_year_id, academicYearId),
						eq(sppSettings.level, level)
					)
				);

			if (existing) {
				await db
					.update(sppSettings)
					.set({
						amount,
						description,
						updated_at: now
					})
					.where(eq(sppSettings.id, existing.id));

				return { success: true, message: `Tarif SPP tingkat ${level} berhasil diperbarui.` };
			}

			await db.insert(sppSettings).values({
				school_id: schoolId,
				academic_year_id: academicYearId,
				level,
				amount,
				description,
				created_at: now,
				updated_at: now
			});

			return { success: true, message: `Tarif SPP tingkat ${level} berhasil ditambahkan.` };
		}
	},

	/**
	 * Hapus tarif SPP.
	 */
	deleteTarif: async ({ request, locals }) => {
		const user = requireRole(locals.user, 'admin_keuangan', 'admin_sekolah');
		if (user.schoolId === null) {
			return fail(403, { message: 'Akses ditolak' });
		}

		const db = locals.db;
		const schoolId = user.schoolId;
		const data = await request.formData();
		const settingId = Number(data.get('setting_id'));

		if (!settingId) {
			return fail(400, { message: 'ID tarif tidak valid' });
		}

		await db
			.delete(sppSettings)
			.where(and(eq(sppSettings.id, settingId), eq(sppSettings.school_id, schoolId)));

		return { success: true, message: 'Tarif SPP berhasil dihapus.' };
	},

	/**
	 * Generate Tagihan SPP Massal untuk semua siswa terdaftar.
	 */
	generateBills: async ({ request, locals }) => {
		const user = requireRole(locals.user, 'admin_keuangan', 'admin_sekolah');
		if (user.schoolId === null) {
			return fail(403, { message: 'Akses ditolak' });
		}

		const db = locals.db;
		const schoolId = user.schoolId;
		const data = await request.formData();

		const academicYearId = Number(data.get('academic_year_id'));
		const startMonth = Number(data.get('start_month') || 7); // Juli default
		const endMonth = Number(data.get('end_month') || 12); // Desember default
		const year = Number(data.get('year') || new Date().getFullYear());

		if (!academicYearId) {
			return fail(400, { message: 'Pilih tahun ajaran untuk membuat tagihan.' });
		}

		// Ambil daftar tarif SPP untuk tahun ajaran ini
		const settings = await db
			.select()
			.from(sppSettings)
			.where(
				and(
					eq(sppSettings.school_id, schoolId),
					eq(sppSettings.academic_year_id, academicYearId)
				)
			);

		if (settings.length === 0) {
			return fail(400, {
				message: 'Belum ada tarif SPP untuk tahun ajaran ini. Tambahkan tarif terlebih dahulu.'
			});
		}

		const tarifMap: Record<string, number> = {};
		for (const s of settings) {
			tarifMap[s.level] = s.amount;
		}

		// Ambil daftar siswa beserta level kelasnya
		const studentList = await db
			.select({
				id: students.id,
				classLevel: classes.level
			})
			.from(students)
			.innerJoin(classes, eq(students.class_id, classes.id))
			.where(eq(students.school_id, schoolId));

		if (studentList.length === 0) {
			return fail(400, { message: 'Belum ada siswa terdaftar pada kelas di sekolah ini.' });
		}

		const monthNames: Record<number, string> = {
			1: 'Januari',
			2: 'Februari',
			3: 'Maret',
			4: 'April',
			5: 'Mei',
			6: 'Juni',
			7: 'Juli',
			8: 'Agustus',
			9: 'September',
			10: 'Oktober',
			11: 'November',
			12: 'Desember'
		};

		let createdCount = 0;
		const now = Date.now();

		// Tentukan list bulan yang digenerate
		// Jika startMonth <= endMonth, misal 7 s/d 12: [7,8,9,10,11,12]
		// Jika 1 s/d 6: [1,2,3,4,5,6]
		const monthsToGenerate: number[] = [];
		if (startMonth <= endMonth) {
			for (let m = startMonth; m <= endMonth; m++) monthsToGenerate.push(m);
		} else {
			// Misal 7 s/d 6 (1 tahun penuh)
			for (let m = startMonth; m <= 12; m++) monthsToGenerate.push(m);
			for (let m = 1; m <= endMonth; m++) monthsToGenerate.push(m);
		}

		for (const student of studentList) {
			const tarif = tarifMap[student.classLevel] ?? settings[0].amount;

			for (const m of monthsToGenerate) {
				// Hitung tahun kalender: misal bulan 1-6 tahun kalender berikutnya jika siklus tahun ajaran
				const billYear = m >= 7 ? year : year + 1;

				const [existing] = await db
					.select()
					.from(sppPayments)
					.where(
						and(
							eq(sppPayments.school_id, schoolId),
							eq(sppPayments.student_id, student.id),
							eq(sppPayments.academic_year_id, academicYearId),
							eq(sppPayments.month, m),
							eq(sppPayments.year, billYear)
						)
					);

				if (!existing) {
					await db.insert(sppPayments).values({
						school_id: schoolId,
						student_id: student.id,
						academic_year_id: academicYearId,
						month: m,
						month_name: monthNames[m] ?? `Bulan ${m}`,
						year: billYear,
						amount: tarif,
						amount_paid: 0,
						status: 'pending',
						created_at: now,
						updated_at: now
					});
					createdCount++;
				}
			}
		}

		return {
			success: true,
			message: `Berhasil membuat ${createdCount} tagihan SPP baru untuk ${studentList.length} siswa.`
		};
	}
};
