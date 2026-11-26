import { generateBuktiPPDB } from '$lib/server/pdf/bukti-ppdb';
import {
	ppdbRegistrations,
	ppdbBatches,
	schools,
	academicYears,
	students,
	classes
} from '$lib/server/db/schema';
import { eq, or, and, isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const numParam = url.searchParams.get('num')?.trim() || '';
	const nisnParam = url.searchParams.get('nisn')?.trim() || '';
	if (!numParam && !nisnParam) {
		return new Response('Parameter nomor registrasi atau NISN wajib diisi', { status: 400 });
	}

	const db = locals.db;
	const rows = await db
		.select({
			id: ppdbRegistrations.id,
			schoolName: schools.name,
			schoolAddress: schools.address,
			schoolPhone: schools.phone,
			schoolEmail: schools.email,
			batchName: ppdbBatches.name,
			academicYearName: academicYears.name,
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
			createdAt: ppdbRegistrations.created_at
		})
		.from(ppdbRegistrations)
		.innerJoin(schools, eq(ppdbRegistrations.school_id, schools.id))
		.innerJoin(ppdbBatches, eq(ppdbRegistrations.batch_id, ppdbBatches.id))
		.innerJoin(academicYears, eq(ppdbBatches.academic_year_id, academicYears.id))
		.where(and(isNull(ppdbRegistrations.deleted_at), numParam ? eq(ppdbRegistrations.registration_number, numParam) : eq(ppdbRegistrations.nisn, nisnParam)))
		.limit(1);

	if (rows.length === 0) return new Response('Pendaftaran tidak ditemukan', { status: 404 });

	const reg = rows[0];
	let enrolledClass: string | null = null;
	if (reg.convertedStudentId) {
		const studentRow = await db
			.select({ className: classes.name })
			.from(students)
			.leftJoin(classes, eq(students.class_id, classes.id))
			.where(eq(students.id, reg.convertedStudentId))
			.limit(1);
		if (studentRow.length > 0) enrolledClass = studentRow[0].className ?? null;
	}

	const data: Parameters<typeof generateBuktiPPDB>[0] = {
		schoolName: reg.schoolName,
		schoolAddress: reg.schoolAddress,
		schoolPhone: reg.schoolPhone,
		schoolEmail: reg.schoolEmail,
		batchName: reg.batchName,
		academicYearName: reg.academicYearName,
		registrationNumber: reg.registrationNumber,
		fullName: reg.fullName,
		nisn: reg.nisn ?? null,
		nik: reg.nik ?? null,
		gender: reg.gender,
		birthPlace: reg.birthPlace,
		birthDate: reg.birthDate,
		religion: reg.religion,
		address: reg.address,
		phone: reg.phone,
		email: reg.email,
		previousSchool: reg.previousSchool,
		graduationYear: reg.graduationYear,
		track: reg.track,
		majorChoice: reg.majorChoice,
		parentName: reg.parentName,
		parentPhone: reg.parentPhone,
		parentJob: reg.parentJob,
		status: reg.status,
		selectionScore: reg.selectionScore,
		notes: reg.notes,
		enrolledClass,
		createdAt: reg.createdAt
	};

	const pdf = generateBuktiPPDB(data);
	return new Response(pdf as unknown as BodyInit, {
		status: 200,
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="bukti-pendaftaran-${reg.registrationNumber}.pdf"`,
			'Cache-Control': 'private, no-store'
		}
	});
};