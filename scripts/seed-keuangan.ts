/**
 * Seed data admin keuangan dan pembayaran SPP untuk MAN 1 Jember.
 * Jalankan: bun scripts/seed-keuangan.ts
 */
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { eq, and, isNull } from 'drizzle-orm';
import {
	schools,
	users,
	academicYears,
	students,
	classes,
	sppSettings,
	sppPayments
} from '../src/lib/server/db/schema';

const client = createClient({ url: 'file:./drizzle/local.db' });
const db = drizzle(client);

const SCHOOL_NAME = 'MAN 1 Jember';
const [school] = await db.select().from(schools).where(eq(schools.name, SCHOOL_NAME));
if (!school) throw new Error(`Sekolah "${SCHOOL_NAME}" tidak ditemukan.`);
const schoolId = school.id;
console.log(`Sekolah: ${school.name} (id=${schoolId})`);

const hash = (pw: string) => bcrypt.hashSync(pw, 12);

// 1. Akun Admin Keuangan
const KEUANGAN_EMAIL = 'keuangan@man1jember.sch.id';
let [adminKeuangan] = await db.select().from(users).where(eq(users.email, KEUANGAN_EMAIL));
if (!adminKeuangan) {
	;[adminKeuangan] = await db
		.insert(users)
		.values({
			school_id: schoolId,
			name: 'Bendahara Keuangan MAN 1 Jember',
			email: KEUANGAN_EMAIL,
			password_hash: hash('keuangan12345'),
			role: 'admin_keuangan',
			is_active: 1
		})
		.returning();
	console.log(`Akun Admin Keuangan dibuat: ${adminKeuangan.email} (id=${adminKeuangan.id})`);
} else {
	console.log(`Akun Admin Keuangan sudah ada: ${adminKeuangan.email} (id=${adminKeuangan.id})`);
}

// 2. Tahun Ajaran Aktif
const [activeYear] = await db
	.select()
	.from(academicYears)
	.where(and(eq(academicYears.school_id, schoolId), eq(academicYears.is_active, 1)));
if (!activeYear) throw new Error('Tahun ajaran aktif tidak ditemukan');
console.log(`Tahun Ajaran: ${activeYear.name} (${activeYear.semester})`);

// 3. Tarif SPP per Tingkat (spp_settings)
const defaultTarif = [
	{ level: 'X', amount: 200000, description: 'SPP Bulanan Kelas X' },
	{ level: 'XI', amount: 200000, description: 'SPP Bulanan Kelas XI' },
	{ level: 'XII', amount: 220000, description: 'SPP Bulanan Kelas XII' }
];

for (const t of defaultTarif) {
	const [existing] = await db
		.select()
		.from(sppSettings)
		.where(
			and(
				eq(sppSettings.school_id, schoolId),
				eq(sppSettings.academic_year_id, activeYear.id),
				eq(sppSettings.level, t.level)
			)
		);
	if (!existing) {
		await db.insert(sppSettings).values({
			school_id: schoolId,
			academic_year_id: activeYear.id,
			level: t.level,
			amount: t.amount,
			description: t.description
		});
		console.log(`Tarif SPP Tingkat ${t.level} dibuat: Rp ${t.amount.toLocaleString('id-ID')}`);
	}
}

// 4. Buat Tagihan SPP Siswa (Semester Ganjil: Juli - Desember 2026)
const studentList = await db
	.select({
		id: students.id,
		userId: students.user_id,
		classId: students.class_id,
		className: classes.name,
		classLevel: classes.level
	})
	.from(students)
	.innerJoin(classes, eq(students.class_id, classes.id))
	.where(eq(students.school_id, schoolId));

const monthNames: Record<number, string> = {
	7: 'Juli',
	8: 'Agustus',
	9: 'September',
	10: 'Oktober',
	11: 'November',
	12: 'Desember'
};

const tarifMap: Record<string, number> = {
	X: 200000,
	XI: 200000,
	XII: 220000
};

let billsCreated = 0;
let billsPaid = 0;

for (const s of studentList) {
	const tarif = tarifMap[s.classLevel] ?? 200000;
	// Buat tagihan bulan 7 s/d 12 tahun 2026
	for (let m = 7; m <= 12; m++) {
		const [existingPayment] = await db
			.select()
			.from(sppPayments)
			.where(
				and(
					eq(sppPayments.school_id, schoolId),
					eq(sppPayments.student_id, s.id),
					eq(sppPayments.academic_year_id, activeYear.id),
					eq(sppPayments.month, m),
					eq(sppPayments.year, 2026)
				)
			);

		if (!existingPayment) {
			// Simulasi: Bulan 7 (Juli) & 8 (Agustus) sebagian besar sudah dibayar,
			// Bulan 9 (September) sebagian siswa bayar, bulan 10-12 belum bayar.
			const isJulyOrAugust = m === 7 || (m === 8 && s.id % 2 === 0);
			const isPaid = isJulyOrAugust;
			const invoiceNum = isPaid
				? `INV/SPP/2026${String(m).padStart(2, '0')}/${String(s.id).padStart(4, '0')}`
				: null;

			await db.insert(sppPayments).values({
				school_id: schoolId,
				student_id: s.id,
				academic_year_id: activeYear.id,
				month: m,
				month_name: monthNames[m],
				year: 2026,
				amount: tarif,
				amount_paid: isPaid ? tarif : 0,
				status: isPaid ? 'paid' : 'pending',
				payment_date: isPaid ? `2026-0${m}-10` : null,
				payment_method: 'cash',
				invoice_number: invoiceNum,
				received_by: isPaid ? adminKeuangan.id : null,
				notes: isPaid ? 'Pembayaran lunas' : null
			});

			billsCreated++;
			if (isPaid) billsPaid++;
		}
	}
}

console.log(`Tagihan SPP dibuat: ${billsCreated} item (${billsPaid} lunas)`);
console.log('=== SEED KEUANGAN SELESAI ===');
