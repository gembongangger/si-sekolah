import type { PageServerLoad } from './$types';
import {
	ppdbRegistrations,
	ppdbBatches,
	schools,
	academicYears,
	students,
	classes
} from '$lib/server/db/schema';
import { eq, or, and, isNull } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	const db = locals.db;
	const numParam = url.searchParams.get('num')?.trim() || '';
	const nisnParam = url.searchParams.get('nisn')?.trim() || '';
	const registered = url.searchParams.get('registered') === '1';

	let registrationResult = null;

	if (numParam || nisnParam) {
		const searchCondition = numParam
			? eq(ppdbRegistrations.registration_number, numParam)
			: eq(ppdbRegistrations.nisn, nisnParam);

		const rows = await db
			.select({
				id: ppdbRegistrations.id,
				schoolId: ppdbRegistrations.school_id,
				schoolName: schools.name,
				schoolAddress: schools.address,
				schoolPhone: schools.phone,
				schoolEmail: schools.email,
				schoolLogo: schools.logo_url,
				batchId: ppdbRegistrations.batch_id,
				batchName: ppdbBatches.name,
				academicYearName: academicYears.name,
				academicYearSemester: academicYears.semester,
				registrationNumber: ppdbRegistrations.registration_number,
				fullName: ppdbRegistrations.full_name,
				nisn: ppdbRegistrations.nisn,
				nik: ppdbRegistrations.nik,
				gender: ppdbRegistrations.gender,
				birthPlace: ppdbRegistrations.birth_place,
				birthDate: ppdbRegistrations.birth_date,
				religion: ppdbRegistrations.religion,
				address: ppdbRegistrations.address,
				phone: ppdbRegistrations.phone,
				email: ppdbRegistrations.email,
				previousSchool: ppdbRegistrations.previous_school,
				graduationYear: ppdbRegistrations.graduation_year,
				track: ppdbRegistrations.track,
				majorChoice: ppdbRegistrations.major_choice,
				parentName: ppdbRegistrations.parent_name,
				parentPhone: ppdbRegistrations.parent_phone,
				parentJob: ppdbRegistrations.parent_job,
				status: ppdbRegistrations.status,
				selectionScore: ppdbRegistrations.selection_score,
				notes: ppdbRegistrations.notes,
				convertedStudentId: ppdbRegistrations.converted_student_id,
				createdAt: ppdbRegistrations.created_at,
				batchFee: ppdbBatches.registration_fee
			})
			.from(ppdbRegistrations)
			.innerJoin(schools, eq(ppdbRegistrations.school_id, schools.id))
			.innerJoin(ppdbBatches, eq(ppdbRegistrations.batch_id, ppdbBatches.id))
			.innerJoin(academicYears, eq(ppdbBatches.academic_year_id, academicYears.id))
			.where(and(searchCondition, isNull(ppdbRegistrations.deleted_at)))
			.limit(1);

		if (rows.length > 0) {
			const reg = rows[0];
			let enrolledClass: string | null = null;

			if (reg.convertedStudentId) {
				const studentRow = await db
					.select({
						className: classes.name
					})
					.from(students)
					.leftJoin(classes, eq(students.class_id, classes.id))
					.where(eq(students.id, reg.convertedStudentId))
					.limit(1);

				if (studentRow.length > 0) {
					enrolledClass = studentRow[0].className ?? null;
				}
			}

			registrationResult = {
				...reg,
				enrolledClass
			};
		}
	}

	return {
		numParam,
		nisnParam,
		registered,
		registrationResult,
		searched: Boolean(numParam || nisnParam)
	};
};
