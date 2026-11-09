/**
 * Seed dummy data percobaan untuk MAN 1 Jember (dev, drizzle/local.db).
 * Jalankan: bun scripts/seed-dummy.ts
 * Idempotent — data yang sudah ada (email/kode unik) dilewati.
 */
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { eq, and, isNull } from 'drizzle-orm';
import {
	schools,
	users,
	teachers,
	students,
	academicYears,
	subjects,
	classes,
	classSubjects,
	timeSlots,
	violationTypes,
	sanctions,
	teachingJournals,
	studentViolations,
	schedules,
	sppSettings,
	sppPayments
} from '../src/lib/server/db/schema';

const client = createClient({ url: 'file:./drizzle/local.db' });
const db = drizzle(client);

const now = Date.now();
const SCHOOL_NAME = 'MAN 1 Jember';

// ── 1. Sekolah ──────────────────────────────────────────────
const [school] = await db.select().from(schools).where(eq(schools.name, SCHOOL_NAME));
if (!school) throw new Error(`Sekolah "${SCHOOL_NAME}" tidak ditemukan — buat dulu via UI.`);
const schoolId = school.id;
console.log(`Sekolah: ${school.name} (id=${schoolId}, npsn=${school.npsn})`);

const hash = (pw: string) => bcrypt.hashSync(pw, 12);
const GURU_PW = hash('guru12345');
const SISWA_PW = hash('siswa12345');

// ── 2. Tahun ajaran ─────────────────────────────────────────
let [year] = await db
	.select()
	.from(academicYears)
	.where(and(eq(academicYears.school_id, schoolId), eq(academicYears.name, '2026/2027'), eq(academicYears.semester, 'ganjil')));
if (!year) {
	;[year] = await db
		.insert(academicYears)
		.values({
			school_id: schoolId,
			name: '2026/2027',
			semester: 'ganjil',
			start_date: '2026-07-13',
			end_date: '2026-12-19',
			is_active: 1
		})
		.returning();
	console.log(`Tahun ajaran 2026/2027 ganjil dibuat (id=${year.id})`);
} else console.log(`Tahun ajaran sudah ada (id=${year.id})`);
const yearId = year.id;

// ── 3. Mata pelajaran ───────────────────────────────────────
const subjectList = [
	{ code: 'MAT', name: 'Matematika' },
	{ code: 'IND', name: 'Bahasa Indonesia' },
	{ code: 'ENG', name: 'Bahasa Inggris' },
	{ code: 'FIS', name: 'Fisika' },
	{ code: 'KIM', name: 'Kimia' },
	{ code: 'BIO', name: 'Biologi' }
];
const existingSubjects = await db.select().from(subjects).where(eq(subjects.school_id, schoolId));
const subjectIds: Record<string, number> = {};
for (const s of subjectList) {
	const found = existingSubjects.find((e) => e.code === s.code && !e.deleted_at);
	if (found) {
		subjectIds[s.code] = found.id;
		continue;
	}
	const [ins] = await db
		.insert(subjects)
		.values({ school_id: schoolId, ...s })
		.returning();
	subjectIds[s.code] = ins.id;
}
console.log('Mapel siap:', subjectList.map((s) => `${s.code}=${subjectIds[s.code]}`).join(' '));

// ── 4. Guru (user + profil) ─────────────────────────────────
const guruData = [
	{ name: 'Ahmad Fauzi', email: 'guru1@man1jember.sch.id', nip: '197811022008011004', gender: 'L', phone: '081231000001', mapel: 'MAT' },
	{ name: 'Siti Rohmah', email: 'guru2@man1jember.sch.id', nip: '198504122009022005', gender: 'P', phone: '081231000002', mapel: 'IND' },
	{ name: 'Budi Santoso', email: 'guru3@man1jember.sch.id', nip: '199007052012031003', gender: 'L', phone: '081231000003', mapel: 'ENG' },
	{ name: 'Dewi Lestari', email: 'guru4@man1jember.sch.id', nip: '199211182015042001', gender: 'P', phone: '081231000004', mapel: 'FIS' },
	{ name: 'Rizal Mahmoud', email: 'guru5@man1jember.sch.id', nip: '198106202010011002', gender: 'L', phone: '081231000005', mapel: 'KIM' },
	{ name: 'Nur Hayati', email: 'guru6@man1jember.sch.id', nip: '199009102016012004', gender: 'P', phone: '081231000006', mapel: 'BIO' }
];
const teacherUserIds: number[] = [];
for (const g of guruData) {
	let [u] = await db.select().from(users).where(eq(users.email, g.email));
	if (!u) {
		;[u] = await db
			.insert(users)
			.values({
				school_id: schoolId,
				name: g.name,
				email: g.email,
				password_hash: GURU_PW,
				role: 'guru',
				is_active: 1,
				created_by: 2
			})
			.returning();
	}
	teacherUserIds.push(u.id);
	let [t] = await db.select().from(teachers).where(eq(teachers.user_id, u.id));
	if (!t) {
		;[t] = await db
			.insert(teachers)
			.values({ school_id: schoolId, user_id: u.id, nip: g.nip, gender: g.gender, phone: g.phone })
			.returning();
	}
}
console.log(`Guru siap: ${guruData.length} akun (password: guru12345)`);

// ── 5. Slot waktu (Senin–Sabtu, 8 slot) ─────────────────────
const slotTemplate = [
	{ slot: 1, start: '07:00', end: '07:40' },
	{ slot: 2, start: '07:40', end: '08:20' },
	{ slot: 3, start: '08:20', end: '09:00' },
	{ slot: 4, start: '09:00', end: '09:20', is_break: 1 },
	{ slot: 5, start: '09:20', end: '10:00' },
	{ slot: 6, start: '10:00', end: '10:40' },
	{ slot: 7, start: '10:40', end: '11:20' },
	{ slot: 8, start: '11:20', end: '12:00' }
];
const existingSlots = await db
	.select()
	.from(timeSlots)
	.where(and(eq(timeSlots.school_id, schoolId), isNull(timeSlots.deleted_at)));
let slotsCreated = 0;
for (let day = 1; day <= 6; day++) {
	for (const t of slotTemplate) {
		if (existingSlots.some((s) => s.day_of_week === day && s.slot_number === t.slot)) continue;
		await db.insert(timeSlots).values({
			school_id: schoolId,
			day_of_week: day,
			slot_number: t.slot,
			start_time: t.start,
			end_time: t.end,
			is_break: t.is_break ?? 0
		});
		slotsCreated++;
	}
}
console.log(`Slot waktu dibuat: ${slotsCreated}`);

// ── 6. Kelas ────────────────────────────────────────────────
const classTemplate = [
	{ name: 'X-MIPA 1', level: 'X', homeroom: 0 },
	{ name: 'X-MIPA 2', level: 'X', homeroom: 1 },
	{ name: 'XI-MIPA 1', level: 'XI', homeroom: 2 },
	{ name: 'XI-MIPA 2', level: 'XI', homeroom: 3 },
	{ name: 'XII-MIPA 1', level: 'XII', homeroom: 4 }
];
const classIds: number[] = [];
for (const c of classTemplate) {
	let [k] = await db
		.select()
		.from(classes)
		.where(and(eq(classes.school_id, schoolId), eq(classes.name, c.name), isNull(classes.deleted_at)));
	if (!k) {
		;[k] = await db
			.insert(classes)
			.values({
				school_id: schoolId,
				academic_year_id: yearId,
				name: c.name,
				level: c.level,
				homeroom_teacher_id: teacherUserIds[c.homeroom]
			})
			.returning();
	}
	classIds.push(k.id);
}
console.log(`Kelas siap: ${classTemplate.map((c) => c.name).join(', ')}`);

// ── 7. Relasi kelas–mapel–guru ──────────────────────────────
const subjectToTeacher: Record<string, number> = {};
guruData.forEach((g, i) => {
	subjectToTeacher[g.mapel] = teacherUserIds[i];
});
let csCreated = 0;
for (const classId of classIds) {
	for (const s of subjectList) {
		const exists = await db
			.select({ id: classSubjects.id })
			.from(classSubjects)
			.where(
				and(
					eq(classSubjects.class_id, classId),
					eq(classSubjects.subject_id, subjectIds[s.code]),
					eq(classSubjects.academic_year_id, yearId)
				)
			);
		if (exists.length === 0) {
			await db.insert(classSubjects).values({
				school_id: schoolId,
				class_id: classId,
				subject_id: subjectIds[s.code],
				teacher_id: subjectToTeacher[s.code],
				academic_year_id: yearId
			});
			csCreated++;
		}
	}
}
console.log(`Relasi kelas-mapel dibuat: ${csCreated}`);

// ── 8. Siswa (5 per kelas = 25) ─────────────────────────────
const namaPool = [
	'Adi Nugraha', 'Bayu Prihatin', 'Citra Amalia', 'Dina Puspita', 'Eka Wijaya',
	'Farhan Maulana', 'Gita Safitri', 'Hendra Kusuma', 'Indah Permata', 'Joko Prasetyo',
	'Kirana Melati', 'Lutfi Hakim', 'Maya Anggraini', 'Nabil Firdaus', 'Oktaviani Rahayu',
	'Putra Ramadhan', 'Qori Ilmiah', 'Rara Dyah', 'Solikhin Aziz', 'Tania Oktavina',
	'Umair Zulkis', 'Vina Rahmawati', 'Wahyu Setiawan', 'Xena Alifah', 'Yoga Pratama'
];
const siswaFlags = ['L', 'L', 'P', 'P', 'L', 'L', 'P', 'L', 'P', 'L', 'P', 'L', 'P', 'L', 'P', 'L', 'P', 'P', 'L', 'P', 'L', 'P', 'L', 'P', 'L'];
const birthPool = ['2009-03-14', '2009-07-22', '2010-01-05', '2009-11-30', '2010-04-19'];
let siswaCreated = 0;
let siswaSeq = 1;
for (const [ci, classId] of classIds.entries()) {
	for (let i = 0; i < 5; i++) {
		const seq = ci * 5 + i;
		const nama = namaPool[seq];
		const email = nama.toLowerCase().replace(/[^a-z]+/g, '.') + '@siswa.man1jember.sch.id';
		let [u] = await db.select().from(users).where(eq(users.email, email));
		if (!u) {
			;[u] = await db
				.insert(users)
				.values({
					school_id: schoolId,
					name: nama,
					email,
					password_hash: SISWA_PW,
					role: 'siswa',
					is_active: 1,
					created_by: 2
				})
				.returning();
		}
		let [st] = await db.select().from(students).where(eq(students.user_id, u.id));
		if (!st) {
			;[st] = await db
				.insert(students)
				.values({
					school_id: schoolId,
					user_id: u.id,
					nis: `26${String(siswaSeq++).padStart(4, '0')}`,
					nisn: `00${String(70000000 + siswaSeq).slice(0, 10)}`,
					gender: siswaFlags[seq],
					class_id: classId,
					birth_date: birthPool[seq % birthPool.length],
					address: `Jl. Percobaan No. ${siswaSeq}, Jember`,
					parent_name: 'Orang Tua ' + nama.split(' ')[0],
					parent_phone: `0812${String(3456000 + siswaSeq).slice(0, 8)}`
				})
				.returning();
		}
		siswaCreated++;
	}
}
console.log(`Siswa siap: ${siswaCreated}`);

// ── 9. Jenis pelanggaran ────────────────────────────────────
const vtList = [
	{ code: 'R01', name: 'Datang terlambat', category: 'ringan', points: 5, description: 'Terlambat masuk kelas tanpa alasan jelas' },
	{ code: 'R02', name: 'Tidak memakai atribut lengkap', category: 'ringan', points: 5, description: 'Atribut seragam/peci tidak lengkap' },
	{ code: 'R03', name: 'Makan di dalam kelas', category: 'ringan', points: 5, description: 'Makan/khiar saat jam pelajaran berlangsung' },
	{ code: 'S01', name: 'Tidak mengerjakan PR 3x', category: 'sedang', points: 15, description: 'Tiga kali berturut tidak mengumpulkan tugas' },
	{ code: 'S02', name: 'Keluar lingkungan madrasah tanpa izin', category: 'sedang', points: 20, description: 'Keluar-area saat jam belajar' },
	{ code: 'B01', name: 'Berkelahi', category: 'berat', points: 50, description: 'Kekerasan fisik dengan siswa lain' },
	{ code: 'B02', name: 'Merokok di lingkungan madrasah', category: 'berat', points: 50, description: 'Temuan merokok di area madrasah' }
];
let vtCreated = 0;
for (const vt of vtList) {
	const exists = await db
		.select({ id: violationTypes.id })
		.from(violationTypes)
		.where(and(eq(violationTypes.school_id, schoolId), eq(violationTypes.code, vt.code)));
	if (exists.length === 0) {
		await db.insert(violationTypes).values({
			school_id: schoolId,
			...vt,
			is_active: 1
		});
		vtCreated++;
	}
}
console.log(`Jenis pelanggaran dibuat: ${vtCreated}`);

const allVt = await db.select().from(violationTypes).where(eq(violationTypes.school_id, schoolId));

// ── 10. Tingkatan sanksi ────────────────────────────────────
const sanctionList = [
	{ min_points: 0, max_points: 24, name: 'Pembinaan', action: 'Teguran tertulis & pembinaan oleh guru' },
	{ min_points: 25, max_points: 49, name: 'Panggilan Wali Kelas', action: 'Pemanggilan orang tua oleh wali kelas' },
	{ min_points: 50, max_points: 74, name: 'Surat Peringatan', action: 'SP kepada orang tua & bimbingan konseling' },
	{ min_points: 75, max_points: 999, name: 'Skorsing', action: 'Skorsing maksimal 3 hari pembelajaran' }
];
let sanCreated = 0;
const existingSanctions = await db.select().from(sanctions).where(isNull(sanctions.deleted_at));
for (const s of sanctionList) {
	if (existingSanctions.some((e) => e.school_id === schoolId && e.name === s.name)) continue;
	await db.insert(sanctions).values({ school_id: schoolId, ...s });
	sanCreated++;
}
console.log(`Tingkatan sanksi dibuat: ${sanCreated}`);

// ── 11. Pelanggaran siswa (contoh, admin id=2) ──────────────
const adminUserId = 2;
const allStudents = await db
	.select()
	.from(students)
	.where(eq(students.school_id, schoolId));
let svCreated = 0;
const svPlan = [
	{ studentIdx: 0, vtCode: 'R01', date: '2026-11-04', description: 'Datang pukul 07.20, terlambat 20 menit', status: 'verified' },
	{ studentIdx: 1, vtCode: 'S01', date: '2026-11-05', description: 'Tiga kali tidak mengumpulkan PR Fisika', status: 'verified' },
	{ studentIdx: 2, vtCode: 'R02', date: '2026-11-06', description: 'Belum memakai kaos kaki hitam standar', status: 'pending' }
];
for (const p of svPlan) {
	const st = allStudents[p.studentIdx];
	const vt = allVt.find((v) => v.code === p.vtCode);
	if (!st || !vt) continue;
	const exists = await db
		.select({ id: studentViolations.id })
		.from(studentViolations)
		.where(
			and(
				eq(studentViolations.student_id, st.id),
				eq(studentViolations.violation_type_id, vt.id),
				eq(studentViolations.date, p.date)
			)
		);
	if (exists.length > 0) continue;
	await db.insert(studentViolations).values({
		school_id: schoolId,
		student_id: st.id,
		violation_type_id: vt.id,
		reported_by: teacherUserIds[0],
		date: p.date,
		description: p.description,
		points_snapshot: vt.points,
		status: p.status,
		verified_by: p.status === 'verified' ? adminUserId : null,
		verified_at: p.status === 'verified' ? now : null
	});
	svCreated++;
}
console.log(`Pelanggaran contoh dibuat: ${svCreated}`);

// ── 12. Jurnal mengajar contoh (guru Matematika, X-MIPA 1) ──
const journalTopics = [
	'Bilangan Berpangkat dan Bentuk Akar',
	'Logaritma',
	'Persamaan Kuadrat',
	'Sistem Persamaan Linier Tiga Variabel'
];
let tjCreated = 0;
for (let m = 0; m < journalTopics.length; m++) {
	const date = `2026-11-0${2 + m}`;
	const classId = classIds[0];
	const subjectId = subjectIds['MAT'];
	const teacherId = teacherUserIds[0];
	const exists = await db
		.select({ id: teachingJournals.id })
		.from(teachingJournals)
		.where(
			and(
				eq(teachingJournals.teacher_id, teacherId),
				eq(teachingJournals.class_id, classId),
				eq(teachingJournals.subject_id, subjectId),
				eq(teachingJournals.date, date),
				eq(teachingJournals.meeting_number, m + 1)
			)
		);
	if (exists.length > 0) continue;
	await db.insert(teachingJournals).values({
		school_id: schoolId,
		teacher_id: teacherId,
		class_id: classId,
		subject_id: subjectId,
		academic_year_id: yearId,
		date,
		meeting_number: m + 1,
		topic: journalTopics[m],
		learning_objectives: `Siswa mampu memahami ${journalTopics[m].toLowerCase()}`,
		activities: 'Pendahuluan, penjelasan materi, kerja kelompok, penutup/evaluasi',
		attendance_summary: JSON.stringify({ hadir: 4, sakit: 0, izin: 1, alfa: 0 })
	});
	tjCreated++;
}
console.log(`Jurnal contoh dibuat: ${tjCreated}`);

// ── 13. Jadwal pelajaran contoh ─────────────────────────────
// Grid: Senin–Jumat, slot berjalan [1,2,3,5,6,7,8] (slot 4 = istirahat).
// Subject di-index agar guru tidak bentrok di slot yang sama antar kelas.
const allSlots = await db
	.select()
	.from(timeSlots)
	.where(and(eq(timeSlots.school_id, schoolId), isNull(timeSlots.deleted_at)));
const runningSlots = slotTemplate.filter((t) => !t.is_break).map((t) => t.slot);
let schCreated = 0;
for (let day = 1; day <= 5; day++) {
	for (let ci = 0; ci < classIds.length; ci++) {
		for (let si = 0; si < runningSlots.length; si++) {
			const slotNumber = runningSlots[si];
			const subject = subjectList[(slotNumber + day + ci) % subjectList.length];
			const ts = allSlots.find((s) => s.day_of_week === day && s.slot_number === slotNumber);
			if (!ts) continue;
			const exists = await db
				.select({ id: schedules.id })
				.from(schedules)
				.where(
					and(
						eq(schedules.school_id, schoolId),
						eq(schedules.time_slot_id, ts.id),
						eq(schedules.class_id, classIds[ci]),
						isNull(schedules.deleted_at)
					)
				);
			if (exists.length > 0) continue;
			await db.insert(schedules).values({
				school_id: schoolId,
				academic_year_id: yearId,
				class_id: classIds[ci],
				subject_id: subjectIds[subject.code],
				teacher_id: subjectToTeacher[subject.code],
				time_slot_id: ts.id,
				room: `Ruang ${ci + 1}0${si + 1}`
			});
			schCreated++;
		}
	}
}
console.log(`Jadwal contoh dibuat: ${schCreated}`);


// ── 14. Admin Keuangan ───────────────────────────────────────
const KEUANGAN_EMAIL = 'keuangan@man1jember.sch.id';
let [adminKeu] = await db.select().from(users).where(eq(users.email, KEUANGAN_EMAIL));
if (!adminKeu) {
	;[adminKeu] = await db
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
	console.log(`Admin Keuangan dibuat: ${adminKeu.email} (password: keuangan12345)`);
}

// ── 15. Tarif & Tagihan SPP ──────────────────────────────────
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
				eq(sppSettings.academic_year_id, yearId),
				eq(sppSettings.level, t.level)
			)
		);
	if (!existing) {
		await db.insert(sppSettings).values({
			school_id: schoolId,
			academic_year_id: yearId,
			level: t.level,
			amount: t.amount,
			description: t.description
		});
	}
}

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

const monthNames = {
	7: 'Juli', 8: 'Agustus', 9: 'September',
	10: 'Oktober', 11: 'November', 12: 'Desember'
};
const tarifMap = { X: 200000, XI: 200000, XII: 220000 };

let billsCreated = 0;
for (const s of studentList) {
	const tarif = tarifMap[s.classLevel] ?? 200000;
	for (let m = 7; m <= 12; m++) {
		const [existing] = await db
			.select()
			.from(sppPayments)
			.where(
				and(
					eq(sppPayments.school_id, schoolId),
					eq(sppPayments.student_id, s.id),
					eq(sppPayments.academic_year_id, yearId),
					eq(sppPayments.month, m),
					eq(sppPayments.year, 2026)
				)
			);
		if (!existing) {
			const isPaid = m === 7 || (m === 8 && s.id % 2 === 0);
			const invoiceNum = isPaid
				? `INV/SPP/2026${String(m).padStart(2, "0")}/${String(s.id).padStart(4, "0")}`
				: null;
			await db.insert(sppPayments).values({
				school_id: schoolId,
				student_id: s.id,
				academic_year_id: yearId,
				month: m,
				month_name: monthNames[m],
				year: 2026,
				amount: tarif,
				amount_paid: isPaid ? tarif : 0,
				status: isPaid ? 'paid' : 'pending',
				payment_date: isPaid ? `2026-0${m}-10` : null,
				payment_method: 'cash',
				invoice_number: invoiceNum,
				received_by: isPaid ? adminKeu.id : null,
				notes: isPaid ? 'Pembayaran lunas' : null
			});
			billsCreated++;
		}
	}
}
if (billsCreated > 0) console.log(`Tagihan SPP dibuat: ${billsCreated}`);

console.log('\n=== SEED SELESAI ===');
