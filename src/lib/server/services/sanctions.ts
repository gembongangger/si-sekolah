/**
 * Sanksi otomatis berdasarkan akumulasi poin siswa.
 * Dipanggil setelah total poin berubah (pencatatan pelanggaran baru).
 */
import type { Database } from '$lib/server/db';
import { sanctions, studentSanctions } from '$lib/server/db/schema';
import type { Sanction } from '$lib/server/db/schema';
import { and, eq, isNull, lte, desc } from 'drizzle-orm';

type Database_ = Database;
type AppliedSanction = Sanction;

export type StudentSanctionRecord = {
	id: number;
	name: string;
	action: string;
	total_points: number;
};

export type ApplySanctionsArgs = {
	schoolId: number;
	studentId: number;
	academicYearId: number;
	totalPoints: number;
	appliedBy?: number | null;
};

/**
 * Cocokkan total poin dengan tingkat sanksi sekolah yang aktif
 * (min_points <= totalPoints), lalu catat tier yang belum pernah
 * ter-trigger untuk siswa ini pada tahun ajaran yang sama.
 * Idempotent — tier yang sudah ada dilewati.
 *
 * @returns daftar sanksi baru yang baru dicatat (kosong jika tier sudah pernah tercapai)
 */
export async function applySanctions(
	db: Database_,
	{ schoolId, studentId, academicYearId, totalPoints, appliedBy }: ApplySanctionsArgs
): Promise<StudentSanctionRecord[]> {
	if (totalPoints <= 0) return [];

	// Semua tingkat sanksi aktif di sekolah ini dengan min_points <= total poin
	const tiers = await db
		.select()
		.from(sanctions)
		.where(
			and(
				eq(sanctions.school_id, schoolId),
				isNull(sanctions.deleted_at),
				lte(sanctions.min_points, totalPoints)
			)
		)
		.orderBy(desc(sanctions.min_points));

	if (tiers.length === 0) return [];

	// Tier yang sudah pernah ter-trigger untuk siswa ini
	const existing = await db
		.select({ sanction_id: studentSanctions.sanction_id })
		.from(studentSanctions)
		.where(
			and(
				eq(studentSanctions.school_id, schoolId),
				eq(studentSanctions.student_id, studentId),
				eq(studentSanctions.academic_year_id, academicYearId)
			)
		);
	const alreadyApplied = new Set(existing.map((e) => e.sanction_id));
	const toApply = tiers.filter((t) => !alreadyApplied.has(t.id));
	if (toApply.length === 0) return [];

	const now = Date.now();
	await db.insert(studentSanctions).values(
		toApply.map((t) => ({
			school_id: schoolId,
			student_id: studentId,
			sanction_id: t.id,
			academic_year_id: academicYearId,
			total_points: totalPoints,
			applied_by: appliedBy ?? null,
			created_at: now
		}))
	);

	return toApply.map((t) => ({
		id: t.id,
		name: t.name,
		action: t.action,
		total_points: totalPoints
	}));
}

export type { AppliedSanction };
