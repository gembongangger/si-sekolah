import { fail, redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { schools, ppdbBatches, academicYears, ppdbRegistrations, ppdbTracks, ppdbRegistrationDocuments } from '$lib/server/db/schema';
import { eq, and, isNull, desc, count, ne } from 'drizzle-orm';
import { ppdbRegistrationSchema, DEFAULT_PPDB_TRACKS } from '$lib/validation/ppdb';
import { uploadFile, generateKey } from '$lib/server/services/storage';

export const load: PageServerLoad = async ({ locals, url }) => {
	const db = locals.db;
	const preselectedBatchId = url.searchParams.get('batch') ? Number(url.searchParams.get('batch')) : null;
	const preselectedSchoolId = url.searchParams.get('sekolah') ? Number(url.searchParams.get('sekolah')) : null;

	// Ambil gelombang pendaftaran yang aktif
	const activeBatches = await db
		.select({
			id: ppdbBatches.id,
			schoolId: ppdbBatches.school_id,
			schoolName: schools.name,
			schoolTimezone: schools.timezone,
			name: ppdbBatches.name,
			startDate: ppdbBatches.start_date,
			endDate: ppdbBatches.end_date,
			quota: ppdbBatches.quota,
			fee: ppdbBatches.registration_fee,
			description: ppdbBatches.description,
			documentRequirements: ppdbBatches.document_requirements,
			academicYearName: academicYears.name,
			academicYearSemester: academicYears.semester
		})
		.from(ppdbBatches)
		.innerJoin(schools, eq(ppdbBatches.school_id, schools.id))
		.innerJoin(academicYears, eq(ppdbBatches.academic_year_id, academicYears.id))
		.where(
			and(
				eq(ppdbBatches.is_active, 1),
				isNull(ppdbBatches.deleted_at),
				eq(schools.is_active, 1)
			)
		)
		.orderBy(desc(ppdbBatches.id));

	// Ambil daftar sekolah aktif
	const activeSchools = await db
		.select({
			id: schools.id,
			name: schools.name,
			npsn: schools.npsn,
			address: schools.address
		})
		.from(schools)
		.where(and(eq(schools.is_active, 1), isNull(schools.deleted_at)))
		.orderBy(schools.name);

	// Ambil jalur pendaftaran aktif per sekolah (dikonfigurasi admin sekolah)
	const activeTracks = await db
		.select({
			id: ppdbTracks.id,
			schoolId: ppdbTracks.school_id,
			code: ppdbTracks.code,
			name: ppdbTracks.name,
			description: ppdbTracks.description
		})
		.from(ppdbTracks)
		.where(and(eq(ppdbTracks.is_active, 1), isNull(ppdbTracks.deleted_at)))
		.orderBy(ppdbTracks.id);

	// Hanya tampilkan gelombang yang berada dalam periode pendaftaran saat ini
	const openBatches = activeBatches.filter((b) => {
		const today = todayInTimeZone(b.schoolTimezone || 'Asia/Jakarta');
		return today >= b.startDate && today <= b.endDate;
	});

	return {
		activeBatches: openBatches,
		activeSchools,
		activeTracks,
		preselectedBatchId,
		preselectedSchoolId
	};
};

function todayInTimeZone(timeZone: string): string {
	try {
		const parts = new Intl.DateTimeFormat('en-CA', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).formatToParts(new Date());
		const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
		return `${get('year')}-${get('month')}-${get('day')}`;
	} catch {
		return new Date().toISOString().slice(0, 10);
	}
}

export const actions: Actions = {
	default: async ({ request, locals, platform }) => {
		const db = locals.db;
		const bucket = platform?.env?.STORAGE_BUCKET;
		const formData = await request.formData();

		const rawData = {
			school_id: formData.get('school_id'),
			batch_id: formData.get('batch_id'),
			full_name: formData.get('full_name')?.toString().trim(),
			nisn: formData.get('nisn')?.toString().trim() || undefined,
			nik: formData.get('nik')?.toString().trim() || undefined,
			gender: formData.get('gender')?.toString(),
			birth_place: formData.get('birth_place')?.toString().trim() || undefined,
			birth_date: formData.get('birth_date')?.toString().trim(),
			religion: formData.get('religion')?.toString().trim() || 'Islam',
			address: formData.get('address')?.toString().trim(),
			phone: formData.get('phone')?.toString().trim() || undefined,
			email: formData.get('email')?.toString().trim() || undefined,
			previous_school: formData.get('previous_school')?.toString().trim(),
			graduation_year: formData.get('graduation_year') ? Number(formData.get('graduation_year')) : undefined,
			track: formData.get('track')?.toString() || 'reguler',
			major_choice: formData.get('major_choice')?.toString().trim(),
			parent_name: formData.get('parent_name')?.toString().trim(),
			parent_phone: formData.get('parent_phone')?.toString().trim(),
			parent_job: formData.get('parent_job')?.toString().trim() || undefined
		};

		const parsed = ppdbRegistrationSchema.safeParse(rawData);
		if (!parsed.success) {
			const errors = parsed.error.flatten().fieldErrors;
			return fail(400, {
				error: Object.values(errors).flat()[0] || 'Data formulir belum lengkap atau tidak valid',
				errors,
				values: rawData
			});
		}

		const data = parsed.data;

		// Validasi batch aktif, periode, dan kuota
		const batchRows = await db
			.select({
				id: ppdbBatches.id,
				quota: ppdbBatches.quota,
				startDate: ppdbBatches.start_date,
				endDate: ppdbBatches.end_date,
				timezone: schools.timezone,
				documentRequirements: ppdbBatches.document_requirements
			})
			.from(ppdbBatches)
			.innerJoin(schools, eq(ppdbBatches.school_id, schools.id))
			.where(
				and(
					eq(ppdbBatches.id, data.batch_id),
					eq(ppdbBatches.school_id, data.school_id),
					eq(ppdbBatches.is_active, 1),
					isNull(ppdbBatches.deleted_at)
				)
			)
			.limit(1);

		const batch = batchRows[0];

		if (!batch) {
			return fail(400, {
				error: 'Gelombang pendaftaran yang dipilih tidak aktif atau tidak ditemukan',
				values: rawData
			});
		}

		// Validasi jalur pendaftaran terhadap konfigurasi sekolah
		const trackRows = await db
			.select({ code: ppdbTracks.code })
			.from(ppdbTracks)
			.where(
				and(
					eq(ppdbTracks.school_id, data.school_id),
					eq(ppdbTracks.is_active, 1),
					isNull(ppdbTracks.deleted_at)
				)
			);
		const allowedTrackCodes =
			trackRows.length > 0
				? trackRows.map((t) => t.code)
				: DEFAULT_PPDB_TRACKS.map((t) => t.code);

		if (!allowedTrackCodes.includes(data.track)) {
			return fail(400, {
				error: 'Jalur pendaftaran yang dipilih tidak tersedia untuk sekolah ini.',
				values: rawData
			});
		}

		const today = todayInTimeZone(batch.timezone || 'Asia/Jakarta');
		if (today < batch.startDate || today > batch.endDate) {
			return fail(400, {
				error: `Pendaftaran gelombang ini hanya dibuka pada ${batch.startDate} s.d. ${batch.endDate}.`,
				values: rawData
			});
		}

		const [registrantCount] = await db
			.select({ total: count() })
			.from(ppdbRegistrations)
			.where(
				and(
					eq(ppdbRegistrations.batch_id, data.batch_id),
					isNull(ppdbRegistrations.deleted_at),
					ne(ppdbRegistrations.status, 'rejected')
				)
			);

		if ((registrantCount?.total ?? 0) >= batch.quota) {
			return fail(400, {
				error: 'Kuota pendaftaran gelombang ini sudah penuh. Silakan pilih gelombang lain.',
				values: rawData
			});
		}

		// Cek apakah NISN sudah terdaftar di gelombang ini jika diisi
		if (data.nisn) {
			const existingNisn = await db
				.select({ id: ppdbRegistrations.id, regNum: ppdbRegistrations.registration_number })
				.from(ppdbRegistrations)
				.where(
					and(
						eq(ppdbRegistrations.school_id, data.school_id),
						eq(ppdbRegistrations.batch_id, data.batch_id),
						eq(ppdbRegistrations.nisn, data.nisn),
						isNull(ppdbRegistrations.deleted_at)
					)
				)
				.limit(1);

			if (existingNisn.length > 0) {
				return fail(400, {
					error: `NISN ${data.nisn} sudah terdaftar dengan Nomor Registrasi: ${existingNisn[0].regNum}. Silakan cek status pendaftaran.`,
					values: rawData
				});
			}
		}

		// Generate nomor registrasi unik
		// Format: PPDB-YYYY-RANDOM4
		const year = new Date().getFullYear();
		let registrationNumber = '';
		let isUnique = false;
		let attempts = 0;

		while (!isUnique && attempts < 10) {
			attempts++;
			const rand = Math.floor(1000 + Math.random() * 9000);
			const candidate = `PPDB-${year}-${rand}`;

			const existing = await db
				.select({ id: ppdbRegistrations.id })
				.from(ppdbRegistrations)
				.where(eq(ppdbRegistrations.registration_number, candidate))
				.limit(1);

			if (existing.length === 0) {
				registrationNumber = candidate;
				isUnique = true;
			}
		}

		if (!registrationNumber) {
			registrationNumber = `PPDB-${year}-${Date.now().toString().slice(-4)}`;
		}

		const now = Date.now();

		// Upload photo to R2 if provided
		let photoUrl: string | null = null;
		const photoFile = formData.get('photo') as File | null;
		if (photoFile && photoFile.size > 0 && bucket) {
			try {
				const { key } = await uploadFile(bucket, 'ppdb', photoFile, data.school_id);
				photoUrl = `/api/storage/${key}`;
			} catch (e: unknown) {
				console.error('Gagal upload foto pendaftar PPDB:', e);
				return fail(400, {
					error: 'Gagal mengunggah foto. Pastikan ukuran file < 10 MB dan format JPG/PNG/WEBP.',
					values: rawData
				});
			}
		}

		// Upload documents per requirements from batch config
		let documents: Array<{ key: string; url: string; label: string }> = [];
		if (batch.documentRequirements) {
			const fields = batch.documentRequirements.fields || [];
			for (const doc of fields) {
				const file = formData.get(`doc_${doc.key}`) as File | null;
				if (file && file.size > 0) {
					// Validate format
					const allowed = doc.formats || ['jpg', 'jpeg', 'png', 'pdf'];
					const isAllowed = allowed.some((f) => file.type === `image/${f}` || file.type === `application/pdf`);
					if (!isAllowed) {
						return fail(400, {
							error: `Format ${file.name} tidak didukung. Izinkan: ${allowed.join(', ')}`,
							values: rawData
						});
					}
					if (file.size > 10 * 1024 * 1024) {
						return fail(400, {
							error: `Ukuran ${doc.label} maksimal 10 MB`,
							values: rawData
						});
					}
					try {
						const { key: docKey } = await uploadFile(bucket, `ppdb-docs/${data.school_id}`, file, data.school_id);
						documents.push({ key: doc.key, url: `/api/storage/${docKey}`, label: doc.label });
					} catch (e: unknown) {
						console.error('Gagal upload dokumen:', e);
						return fail(400, {
							error: `Gagal mengunggah ${doc.label}`,
							values: rawData
						});
					}
				} else if (doc.required) {
					return fail(400, {
						error: `${doc.label} wajib diupload`,
						values: rawData
					});
				}
			}
		}

		try {
			const [inserted] = await db
				.insert(ppdbRegistrations)
				.values({
					school_id: data.school_id,
					batch_id: data.batch_id,
					registration_number: registrationNumber,
					full_name: data.full_name,
					nisn: data.nisn || null,
					nik: data.nik || null,
					gender: data.gender,
					birth_place: data.birth_place || null,
					birth_date: data.birth_date,
					religion: data.religion || 'Islam',
					address: data.address,
					phone: data.phone || null,
					email: data.email || null,
					previous_school: data.previous_school,
					graduation_year: data.graduation_year || year,
					track: data.track,
					major_choice: data.major_choice,
					parent_name: data.parent_name,
					parent_phone: data.parent_phone,
					parent_job: data.parent_job || null,
					photo_url: photoUrl,
					status: 'submitted',
					created_at: now,
					updated_at: now
				})
				.returning({ id: ppdbRegistrations.id });

			// Simpan dokumen yang diupload
			if (documents.length > 0 && inserted) {
				await db.insert(ppdbRegistrationDocuments).values(
					documents.map((doc) => ({
						registration_id: inserted.id,
						document_key: doc.key,
						document_label: doc.label,
						url: doc.url,
						status: 'pending'
					}))
				);
			}
		} catch (e: any) {
			console.error('Error saving PPDB registration:', e);
			return fail(500, {
				error: 'Gagal menyimpan data pendaftaran. Silakan coba beberapa saat lagi.',
				values: rawData
			});
		}

		// Redirect ke halaman cek status dengan nomor registrasi yang baru dibuat
		throw redirect(303, `/ppdb/status?registered=1&num=${registrationNumber}`);
	}
};
