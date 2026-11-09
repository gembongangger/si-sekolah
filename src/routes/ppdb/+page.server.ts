import type { PageServerLoad } from './$types';
import { schools, ppdbBatches, academicYears, ppdbRegistrations } from '$lib/server/db/schema';
import { eq, and, isNull, desc, count } from 'drizzle-orm';

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

export const load: PageServerLoad = async ({ locals }) => {
	const db = locals.db;

	// Ambil daftar sekolah yang memiliki PPDB aktif
	const activeBatches = await db
		.select({
			id: ppdbBatches.id,
			schoolId: ppdbBatches.school_id,
			schoolName: schools.name,
			schoolAddress: schools.address,
			schoolPhone: schools.phone,
			schoolLogo: schools.logo_url,
			schoolTimezone: schools.timezone,
			name: ppdbBatches.name,
			startDate: ppdbBatches.start_date,
			endDate: ppdbBatches.end_date,
			quota: ppdbBatches.quota,
			fee: ppdbBatches.registration_fee,
			description: ppdbBatches.description,
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

	// Hitung total pendaftar per batch
	const batchRegistrantCounts: Record<number, number> = {};
	for (const b of activeBatches) {
		const [c] = await db
			.select({ count: count() })
			.from(ppdbRegistrations)
			.where(
				and(
					eq(ppdbRegistrations.batch_id, b.id),
					isNull(ppdbRegistrations.deleted_at)
				)
			);
		batchRegistrantCounts[b.id] = c?.count ?? 0;
	}

	const today = todayInTimeZone('Asia/Jakarta');

	return {
		batches: activeBatches
			.map((b) => ({
				...b,
				totalRegistrants: batchRegistrantCounts[b.id] ?? 0,
				periodStatus:
					today < b.startDate ? 'upcoming' : today > b.endDate ? 'closed' : 'open'
			}))
			.filter((b) => b.periodStatus === 'open')
	};
};
