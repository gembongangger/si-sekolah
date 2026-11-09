/**
 * Seed data PPDB untuk sekolah aktif (dev environment).
 * Jalankan: bun scripts/seed-ppdb.ts
 */
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { eq, and, isNull } from 'drizzle-orm';
import {
	schools,
	academicYears,
	ppdbBatches,
	ppdbRegistrations,
	ppdbTracks
} from '../src/lib/server/db/schema';
import { DEFAULT_PPDB_TRACKS } from '../src/lib/validation/ppdb';

const client = createClient({ url: 'file:./drizzle/local.db' });
const db = drizzle(client);

// Periode dibuat relatif terhadap hari ini agar data demo selalu bisa dipakai
const now = new Date();
const openFrom = new Date(now);
openFrom.setDate(openFrom.getDate() - 30);
const openUntil = new Date(now);
openUntil.setDate(openUntil.getDate() + 30);
const toISODate = (date: Date) => date.toISOString().slice(0, 10);

const schoolConfigs = [
	{
		name: 'MAN 1 Jember',
		batchName: 'Gelombang 1 - Reguler & Prestasi 2026/2027',
		fee: 50000,
		description: 'Penerimaan Peserta Didik Baru Jalur Prestasi Akademik/Non-Akademik dan Reguler Tes.',
		quota: 200,
		academicYearName: '2026/2027',
		academicYearSemester: 'ganjil' as const,
		sampleRegistrations: [
			{
				number: 'PPDB-2026-0001',
				name: 'Muhammad Ilham Saputra',
				nisn: '0098765401',
				nik: '3509121508080001',
				gender: 'L' as const,
				birthPlace: 'Jember',
				birthDate: '2008-08-15',
				address: 'Jl. Mastrip No. 45, Sumbersari, Jember',
				phone: '081234567001',
				email: 'ilham.saputra@gmail.com',
				previousSchool: 'MTsN 1 Jember',
				graduationYear: 2026,
				track: 'prestasi' as const,
				majorChoice: 'MIPA',
				parentName: 'Rahmat Saputra',
				parentPhone: '081333444001',
				parentJob: 'Wiraswasta',
				status: 'accepted' as const,
				score: 88,
				notes: 'Lolos jalur prestasi tahfidz & rapor'
			},
			{
				number: 'PPDB-2026-0002',
				name: 'Aisyah Putri Rahmadhani',
				nisn: '0098765402',
				nik: '3509125509080002',
				gender: 'P' as const,
				birthPlace: 'Jember',
				birthDate: '2008-09-12',
				address: 'Jl. Kalimantan No. 12, Kaliwates, Jember',
				phone: '081234567002',
				email: 'aisyah.putri@gmail.com',
				previousSchool: 'SMPN 1 Jember',
				graduationYear: 2026,
				track: 'prestasi' as const,
				majorChoice: 'MIPA',
				parentName: 'H. Sudarmanto',
				parentPhone: '081333444002',
				parentJob: 'PNS',
				status: 'accepted' as const,
				score: 92,
				notes: 'Juara 1 OSN Matematika Tingkat Kabupaten'
			},
			{
				number: 'PPDB-2026-0003',
				name: 'Dimas Bagus Wicaksono',
				nisn: '0098765403',
				nik: '3509122010080003',
				gender: 'L' as const,
				birthPlace: 'Banyuwangi',
				birthDate: '2008-10-20',
				address: 'Jl. Hayam Wuruk No. 88, Mangli, Jember',
				phone: '081234567003',
				email: 'dimas.bagus@gmail.com',
				previousSchool: 'SMPN 3 Jember',
				graduationYear: 2026,
				track: 'reguler' as const,
				majorChoice: 'IPS',
				parentName: 'Joko Wicaksono',
				parentPhone: '081333444003',
				parentJob: 'Karyawan Swasta',
				status: 'verified' as const,
				score: 78,
				notes: 'Berkas lengkap, menunggu hasil pengumuman'
			},
			{
				number: 'PPDB-2026-0004',
				name: 'Fatimah Az-Zahra',
				nisn: '0098765404',
				nik: '3509124407080004',
				gender: 'P' as const,
				birthPlace: 'Jember',
				birthDate: '2008-07-04',
				address: 'Jl. R.A. Kartini No. 3, Patrang, Jember',
				phone: '081234567004',
				email: 'fatimah.azzahra@gmail.com',
				previousSchool: 'MTsN 2 Jember',
				graduationYear: 2026,
				track: 'reguler' as const,
				majorChoice: 'Keagamaan',
				parentName: 'Ustadz Mansyur',
				parentPhone: '081333444004',
				parentJob: 'Guru',
				status: 'verified' as const,
				score: 84,
				notes: 'Berkas terverifikasi panitia'
			},
			{
				number: 'PPDB-2026-0005',
				name: 'Rizky Dwi Pratama',
				nisn: '0098765405',
				nik: '3509121111080005',
				gender: 'L' as const,
				birthPlace: 'Lumajang',
				birthDate: '2008-11-11',
				address: 'Jl. Gajah Mada No. 104, Kaliwates, Jember',
				phone: '081234567005',
				email: 'rizky.pratama@gmail.com',
				previousSchool: 'SMP Muhammadiyah 1 Jember',
				graduationYear: 2026,
				track: 'zonasi' as const,
				majorChoice: 'MIPA',
				parentName: 'Agus Pratama',
				parentPhone: '081333444005',
				parentJob: 'Pedagang',
				status: 'submitted' as const,
				score: null,
				notes: null
			},
			{
				number: 'PPDB-2026-0006',
				name: 'Nabila Syakira',
				nisn: '0098765406',
				nik: '3509126203080006',
				gender: 'P' as const,
				birthPlace: 'Jember',
				birthDate: '2008-03-22',
				address: 'Jl. Tidar No. 29, Sumbersari, Jember',
				phone: '081234567006',
				email: 'nabila.syakira@gmail.com',
				previousSchool: 'MTs Al-Hidayah Jember',
				graduationYear: 2026,
				track: 'afirmasi' as const,
				majorChoice: 'IPS',
				parentName: 'Subhan',
				parentPhone: '081333444006',
				parentJob: 'Buruh Harian',
				status: 'submitted' as const,
				score: null,
				notes: 'Melampirkan KIP'
			}
		]
	},
	{
		name: 'SMP 2 Malang',
		batchName: 'Gelombang 1 - PPDB SMP 2 Malang',
		fee: 0,
		description: 'Pendaftaran tahun ajaran 2026/2027',
		quota: 100,
		academicYearName: '2026/2027',
		academicYearSemester: 'ganjil' as const,
		sampleRegistrations: [
			{
				number: 'PPDB-2026-1001',
				name: 'Budi Santoso',
				nisn: '0087654301',
				nik: '3509221508080001',
				gender: 'L' as const,
				birthPlace: 'Malang',
				birthDate: '2008-05-15',
				address: 'Jl. Soekarno-Hatta No. 10, Malang',
				phone: '081234567101',
				email: 'budi.santoso@gmail.com',
				previousSchool: 'SDN 1 Malang',
				graduationYear: 2026,
				track: 'reguler' as const,
				majorChoice: 'MIPA',
				parentName: 'Joko Santoso',
				parentPhone: '081333444101',
				parentJob: 'Wiraswasta',
				status: 'verified' as const,
				score: 85,
				notes: 'Rapor bagus'
			},
			{
				number: 'PPDB-2026-1002',
				name: 'Siti Rahayu',
				nisn: '0087654302',
				nik: '3509225509080002',
				gender: 'P' as const,
				birthPlace: 'Malang',
				birthDate: '2008-08-20',
				address: 'Jl. Diponegoro No. 25, Malang',
				phone: '081234567102',
				email: 'siti.rahayu@gmail.com',
				previousSchool: 'SDN 2 Malang',
				graduationYear: 2026,
				track: 'reguler' as const,
				majorChoice: 'IPS',
				parentName: 'Siti Aminah',
				parentPhone: '081333444102',
				parentJob: 'Ibu Rumah Tangga',
				status: 'submitted' as const,
				score: null,
				notes: null
			}
		]
	}
];

for (const cfg of schoolConfigs) {
	const [school] = await db.select().from(schools).where(eq(schools.name, cfg.name));
	if (!school) {
		console.log(`Sekolah "${cfg.name}" tidak ditemukan - skip`);
		continue;
	}
	const schoolId = school.id;
	console.log(`Sekolah: ${school.name} (id=${schoolId})`);

	// 1. Tahun Ajaran
	let [year] = await db
		.select()
		.from(academicYears)
		.where(and(eq(academicYears.school_id, schoolId), eq(academicYears.is_active, 1)));

	if (!year) {
		;[year] = await db
			.insert(academicYears)
			.values({
				school_id: schoolId,
				name: cfg.academicYearName,
				semester: cfg.academicYearSemester,
				start_date: '2026-07-01',
				end_date: '2027-06-30',
				is_active: 1
			})
			.returning();
		console.log(`Tahun ajaran dibuat: ${year.name} (id=${year.id})`);
	}

	// 2. Gelombang PPDB
	let [batch] = await db
		.select()
		.from(ppdbBatches)
		.where(and(eq(ppdbBatches.school_id, schoolId), eq(ppdbBatches.name, cfg.batchName)));

	if (!batch) {
		;[batch] = await db
			.insert(ppdbBatches)
			.values({
				school_id: schoolId,
				academic_year_id: year.id,
				name: cfg.batchName,
				start_date: toISODate(openFrom),
				end_date: toISODate(openUntil),
				quota: cfg.quota,
				registration_fee: cfg.fee,
				description: cfg.description,
				is_active: 1
			})
			.returning();
		console.log(`Gelombang PPDB dibuat: ${batch.name} (id=${batch.id})`);
	} else {
		console.log(`Gelombang PPDB sudah ada: ${batch.name} (id=${batch.id})`);
	}

	// 2b. Jalur pendaftaran default (idempotent)
	const existingTrackRows = await db
		.select({ id: ppdbTracks.id })
		.from(ppdbTracks)
		.where(and(eq(ppdbTracks.school_id, schoolId), isNull(ppdbTracks.deleted_at)));

	if (existingTrackRows.length === 0) {
		await db.insert(ppdbTracks).values(
			DEFAULT_PPDB_TRACKS.map((t) => ({
				school_id: schoolId,
				code: t.code,
				name: t.name,
				description: null,
				is_active: 1
			}))
		);
		console.log(`Jalur pendaftaran default dibuat: ${DEFAULT_PPDB_TRACKS.length} jalur`);
	} else {
		console.log(`Jalur pendaftaran sudah ada: ${existingTrackRows.length} jalur`);
	}

	// 3. Pendaftar Contoh
	let created = 0;
	for (const reg of cfg.sampleRegistrations) {
		const [existing] = await db
			.select()
			.from(ppdbRegistrations)
			.where(eq(ppdbRegistrations.registration_number, reg.number));

		if (!existing) {
			await db.insert(ppdbRegistrations).values({
				school_id: schoolId,
				batch_id: batch.id,
				registration_number: reg.number,
				full_name: reg.name,
				nisn: reg.nisn,
				nik: reg.nik,
				gender: reg.gender,
				birth_place: reg.birthPlace,
				birth_date: reg.birthDate,
				address: reg.address,
				phone: reg.phone,
				email: reg.email,
				previous_school: reg.previousSchool,
				graduation_year: reg.graduationYear,
				track: reg.track,
				major_choice: reg.majorChoice,
				parent_name: reg.parentName,
				parent_phone: reg.parentPhone,
				parent_job: reg.parentJob,
				status: reg.status,
				selection_score: reg.score,
				notes: reg.notes
			});
			created++;
		}
	}
	console.log(`Data pendaftar PPDB untuk ${school.name}: ${created} pendaftar baru`);
}

console.log('=== SEED PPDB SELESAI ===');