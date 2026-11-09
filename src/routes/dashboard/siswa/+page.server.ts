import { error, redirect, fail } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters/zod4';
import type { PageServerLoad, Actions } from './$types';
import { requireRole, requireAdminSekolah } from '$lib/server/auth/guard';
import { siswaCreateSchema, siswaUpdateSchema } from '$lib/validation/siswa';
import { users, students, classes, schools } from '$lib/server/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';

export const load: PageServerLoad = async ({ locals }) => {
	// admin_sekolah: kelola penuh. guru: lihat data siswa (read-only).
	const user = requireRole(locals.user, 'admin_sekolah', 'admin_keuangan', 'guru');
	if (user.schoolId === null) {
		throw error(403, 'User harus memiliki sekolah terkait');
	}
	const canManage = user.role === 'admin_sekolah';
	const db = locals.db;
	const schoolId = user.schoolId;

	const siswaList = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			is_active: users.is_active,
			created_at: users.created_at,
			student_id: students.id,
			nis: students.nis,
			nisn: students.nisn,
			gender: students.gender,
			class_id: students.class_id,
			birth_date: students.birth_date,
			address: students.address,
			parent_name: students.parent_name,
			parent_phone: students.parent_phone,
			class_name: classes.name
		})
		.from(users)
		.leftJoin(students, eq(students.user_id, users.id))
		.leftJoin(classes, eq(classes.id, students.class_id))
		.where(
			and(
				eq(users.role, 'siswa'),
				eq(users.school_id, schoolId),
				isNull(users.deleted_at)
			)
		)
		.orderBy(desc(users.created_at));

	// Daftar kelas aktif di sekolah ini
	const kelasList = await db
		.select({ id: classes.id, name: classes.name, level: classes.level })
		.from(classes)
		.where(and(eq(classes.school_id, schoolId), isNull(classes.deleted_at)))
		.orderBy(classes.name);

	const form = await superValidate(zod(siswaCreateSchema));
	return { siswas: siswaList, kelas: kelasList, form, canManage };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;

		const form = await superValidate(request, zod(siswaCreateSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const {
			name, email, password, nis, nisn, gender,
			class_id, birth_date, address, parent_name, parent_phone, is_active
		} = form.data;

		// Cek email duplikat
		const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
		if (existing.length > 0) {
			return message(form, 'Email sudah terdaftar', { status: 409 });
		}

		// Cek NIS duplikat dalam sekolah
		if (nis) {
			const dupNis = await db
				.select({ id: students.id })
				.from(students)
				.where(and(eq(students.school_id, schoolId), eq(students.nis, nis)));
			if (dupNis.length > 0) {
				return message(form, 'NIS sudah terdaftar di sekolah ini', { status: 409 });
			}
		}

		const password_hash = await bcrypt.hash(password, 12);
		const now = Date.now();

		const insertedUser = await db
			.insert(users)
			.values({
				name,
				email,
				password_hash,
				role: 'siswa',
				school_id: schoolId,
				is_active,
				created_by: user.userId,
				created_at: now,
				updated_at: now
			})
			.returning({ id: users.id });

		const newUserId = insertedUser[0].id;

		await db.insert(students).values({
			school_id: schoolId,
			user_id: newUserId,
			nis: nis || null,
			nisn: nisn || null,
			gender: gender ?? null,
			class_id: class_id ?? null,
			birth_date: birth_date || null,
			address: address || null,
			parent_name: parent_name || null,
			parent_phone: parent_phone || null,
			created_at: now
		});

		return message(form, 'Siswa berhasil ditambahkan');
	},

	update: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		const form = await superValidate(formData, zod(siswaUpdateSchema));
		if (!form.valid) {
			return message(form, 'Data tidak valid', { status: 400 });
		}

		const {
			name, email, password, nis, nisn, gender,
			class_id, birth_date, address, parent_name, parent_phone, is_active
		} = form.data;

		const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
		if (existing.length > 0 && existing[0].id !== id) {
			return message(form, 'Email sudah digunakan akun lain', { status: 409 });
		}

		const updateUser: Record<string, unknown> = {
			name, email, is_active, updated_at: Date.now()
		};
		if (password) {
			updateUser.password_hash = await bcrypt.hash(password, 12);
		}

		await db.update(users).set(updateUser).where(eq(users.id, id));
		await db.update(students).set({
			nis: nis || null,
			nisn: nisn || null,
			gender: gender ?? null,
			class_id: class_id ?? null,
			birth_date: birth_date || null,
			address: address || null,
			parent_name: parent_name || null,
			parent_phone: parent_phone || null
		}).where(eq(students.user_id, id));

		return message(form, 'Data siswa berhasil diperbarui');
	},

	delete: async ({ request, locals }) => {
		requireAdminSekolah(locals.user);
		const db = locals.db;

		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!id) throw error(400, 'ID tidak valid');

		await db.update(users).set({ deleted_at: Date.now() }).where(eq(users.id, id));
		throw redirect(303, '/dashboard/siswa');
	},

	importExcel: async ({ request, locals }) => {
		const user = requireAdminSekolah(locals.user);
		const db = locals.db;
		const schoolId = user.schoolId;

		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const payloadJson = formData.get('payload')?.toString();

		let rawRows: Record<string, any>[] = [];

		if (payloadJson) {
			try {
				rawRows = JSON.parse(payloadJson);
			} catch {
				return fail(400, { importError: 'Format data payload tidak valid' });
			}
		} else if (file && file.size > 0) {
			try {
				const buffer = await file.arrayBuffer();
				const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
				const sheetName = wb.SheetNames.includes('Data Siswa') ? 'Data Siswa' : wb.SheetNames[0];
				const ws = wb.Sheets[sheetName];
				if (!ws) {
					return fail(400, { importError: 'Sheet data siswa tidak ditemukan di file Excel' });
				}
				rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
			} catch (err: any) {
				return fail(400, { importError: 'Gagal membaca file Excel: ' + (err.message || 'Format tidak didukung') });
			}
		} else {
			return fail(400, { importError: 'Silakan pilih file Excel (.xlsx / .xls / .csv) untuk diunggah.' });
		}

		if (rawRows.length === 0) {
			return fail(400, { importError: 'File Excel kosong atau tidak memiliki baris data.' });
		}

		// Ambil daftar kelas aktif di sekolah ini
		const classRows = await db
			.select({ id: classes.id, name: classes.name, level: classes.level })
			.from(classes)
			.where(and(eq(classes.school_id, schoolId), isNull(classes.deleted_at)));

		const classMap = new Map<string, number>();
		for (const c of classRows) {
			classMap.set(c.name.trim().toLowerCase(), c.id);
			classMap.set(c.name.trim().toLowerCase().replace(/[\s\-_]/g, ''), c.id);
		}

		// Ambil semua email yang sudah ada di database
		const existingUserEmails = await db.select({ email: users.email }).from(users);
		const emailSet = new Set(existingUserEmails.map((u) => u.email.toLowerCase()));

		// Ambil semua NIS yang sudah ada di sekolah ini (aktif)
		const existingNisRows = await db
			.select({ nis: students.nis })
			.from(students)
			.innerJoin(users, eq(students.user_id, users.id))
			.where(and(eq(students.school_id, schoolId), isNull(users.deleted_at)));
		const nisSet = new Set(existingNisRows.map((s) => (s.nis || '').trim()).filter(Boolean));

		// Ambil data sekolah untuk domain email default
		const schoolRows = await db.select({ name: schools.name }).from(schools).where(eq(schools.id, schoolId));
		const schoolSlug = (schoolRows[0]?.name || 'sekolah')
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '');
		const defaultDomain = `siswa.${schoolSlug}.sch.id`;

		// Helper normalisasi key header
		const normKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');

		const defaultPassword = 'siswa12345';
		const defaultPasswordHash = await bcrypt.hash(defaultPassword, 12);
		const now = Date.now();

		let importedCount = 0;
		const errors: { row: number; name: string; message: string }[] = [];

		for (let idx = 0; idx < rawRows.length; idx++) {
			const rowNumber = idx + 2; // header baris 1
			const row = rawRows[idx];

			const normRow: Record<string, any> = {};
			for (const [k, v] of Object.entries(row)) {
				normRow[normKey(k)] = v;
			}

			// Ambil Nama Lengkap
			const rawName = String(
				normRow['namalengkap'] ?? normRow['nama'] ?? normRow['namasiswa'] ?? normRow['name'] ?? ''
			).trim();

			if (!rawName || rawName.length < 3) {
				errors.push({
					row: rowNumber,
					name: rawName || 'Tanpa Nama',
					message: 'Nama lengkap wajib diisi minimal 3 karakter.'
				});
				continue;
			}

			// Kelas
			const rawKelas = String(
				normRow['kelas'] ?? normRow['namakelas'] ?? normRow['rombel'] ?? normRow['class'] ?? ''
			).trim();

			let classId: number | null = null;
			if (rawKelas) {
				const matched =
					classMap.get(rawKelas.toLowerCase()) ??
					classMap.get(rawKelas.toLowerCase().replace(/[\s\-_]/g, ''));
				if (matched) {
					classId = matched;
				} else {
					errors.push({
						row: rowNumber,
						name: rawName,
						message: `Kelas "${rawKelas}" tidak ditemukan di daftar kelas sekolah ini.`
					});
					continue;
				}
			} else {
				errors.push({
					row: rowNumber,
					name: rawName,
					message: 'Kolom Kelas wajib diisi.'
				});
				continue;
			}

			// NIS
			const rawNis = String(
				normRow['nis'] ?? normRow['nomorinduk'] ?? normRow['noinduk'] ?? ''
			).trim();

			if (rawNis) {
				if (nisSet.has(rawNis)) {
					errors.push({
						row: rowNumber,
						name: rawName,
						message: `NIS "${rawNis}" sudah terdaftar di sekolah ini.`
					});
					continue;
				}
				nisSet.add(rawNis);
			}

			// NISN
			const rawNisn = String(
				normRow['nisn'] ?? normRow['nomornisn'] ?? normRow['nonisn'] ?? ''
			).trim();

			// Gender
			const rawGender = String(
				normRow['jeniskelamin'] ?? normRow['jk'] ?? normRow['gender'] ?? normRow['lp'] ?? ''
			).trim().toUpperCase();

			let gender: 'L' | 'P' | null = null;
			if (rawGender.startsWith('L') || rawGender === 'PRIA' || rawGender === 'LAKI-LAKI') {
				gender = 'L';
			} else if (rawGender.startsWith('P') || rawGender === 'WANITA' || rawGender === 'PEREMPUAN') {
				gender = 'P';
			}

			// Email
			let rawEmail = String(normRow['email'] ?? normRow['surel'] ?? '').trim().toLowerCase();

			if (rawEmail) {
				if (emailSet.has(rawEmail)) {
					errors.push({
						row: rowNumber,
						name: rawName,
						message: `Email "${rawEmail}" sudah digunakan akun lain.`
					});
					continue;
				}
				emailSet.add(rawEmail);
			} else {
				// Auto-generate email unik
				const cleanName = rawName
					.toLowerCase()
					.replace(/[^a-z0-9]/g, '.')
					.replace(/\.+/g, '.')
					.replace(/^\.|\.$/g, '');
				let candidate = rawNis
					? `${cleanName}.${rawNis}@${defaultDomain}`
					: `${cleanName}@${defaultDomain}`;
				let counter = 1;
				while (emailSet.has(candidate)) {
					candidate = `${cleanName}.${counter}@${defaultDomain}`;
					counter++;
				}
				rawEmail = candidate;
				emailSet.add(rawEmail);
			}

			// Password
			const rawPassword = String(
				normRow['password'] ?? normRow['katasandi'] ?? normRow['sandi'] ?? ''
			).trim();
			const passwordHash =
				rawPassword && rawPassword.length >= 8
					? await bcrypt.hash(rawPassword, 12)
					: defaultPasswordHash;

			// Tanggal Lahir
			const rawBirthDate =
				normRow['tanggallahir'] ?? normRow['tgllahir'] ?? normRow['birthdate'] ?? normRow['dob'];
			let birthDate: string | null = null;
			if (typeof rawBirthDate === 'number') {
				const d = new Date(Math.round((rawBirthDate - 25569) * 86400 * 1000));
				if (!isNaN(d.getTime())) {
					birthDate = d.toISOString().slice(0, 10);
				}
			} else if (rawBirthDate) {
				const str = String(rawBirthDate).trim();
				if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
					birthDate = str;
				} else {
					const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
					if (m) {
						birthDate = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
					}
				}
			}

			// Alamat & Orang Tua
			const address =
				String(normRow['alamat'] ?? normRow['address'] ?? normRow['domisili'] ?? '').trim() ||
				null;
			const parentName =
				String(
					normRow['namaorangtua'] ??
						normRow['namaortu'] ??
						normRow['orangtua'] ??
						normRow['wali'] ??
						''
				).trim() || null;
			const parentPhone =
				String(
					normRow['teleponorangtua'] ??
						normRow['nohportu'] ??
						normRow['notelepon'] ??
						normRow['telepon'] ??
						normRow['hportu'] ??
						''
				).trim() || null;

			// Simpan ke users
			const [insertedUser] = await db
				.insert(users)
				.values({
					name: rawName,
					email: rawEmail,
					password_hash: passwordHash,
					role: 'siswa',
					school_id: schoolId,
					is_active: 1,
					created_by: user.userId,
					created_at: now,
					updated_at: now
				})
				.returning({ id: users.id });

			// Simpan ke students
			await db.insert(students).values({
				school_id: schoolId,
				user_id: insertedUser.id,
				nis: rawNis || null,
				nisn: rawNisn || null,
				gender,
				class_id: classId,
				birth_date: birthDate,
				address,
				parent_name: parentName,
				parent_phone: parentPhone,
				created_at: now
			});

			importedCount++;
		}

		return {
			importSuccess: true,
			importedCount,
			skippedCount: errors.length,
			errors: errors.slice(0, 30),
			message: `Berhasil mengimpor ${importedCount} siswa.${
				errors.length > 0 ? ` (${errors.length} baris dilewati karena ada kendala)` : ''
			}`
		};
	}
};
