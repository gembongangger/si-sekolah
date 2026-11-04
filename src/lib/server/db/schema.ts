import { sql } from 'drizzle-orm';
import {
	check,
	foreignKey,
	index,
	integer,
	sqliteTable,
	text,
	unique,
	type SQLiteTableExtraConfigValue
} from 'drizzle-orm/sqlite-core';

// =========================================================
// 1. TENANT: SCHOOLS
// =========================================================
export const schools = sqliteTable(
	'schools',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull(),
		npsn: text('npsn').notNull().unique(),
		address: text('address'),
		phone: text('phone'),
		email: text('email'),
		logo_url: text('logo_url'),
		timezone: text('timezone').notNull().default('Asia/Jakarta'),
		is_active: integer('is_active').notNull().default(0),
		subscription_plan: text('subscription_plan').notNull().default('free'),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		updated_at: integer('updated_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		deleted_at: integer('deleted_at')
	},
	(t): SQLiteTableExtraConfigValue[] => [
		check('schools_is_active_check', sql`is_active IN (0, 1)`),
		index('idx_schools_is_active').on(t.is_active),
		index('idx_schools_deleted_at').on(t.deleted_at)
	]
);

// =========================================================
// 2. USERS & SESSIONS
//    school_id NULL hanya untuk superadmin.
// =========================================================
export const users = sqliteTable(
	'users',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id'),
		name: text('name').notNull(),
		email: text('email').notNull().unique(),
		password_hash: text('password_hash').notNull(),
		role: text('role').notNull(),
		is_active: integer('is_active').notNull().default(0),
		created_by: integer('created_by'),
		last_login_at: integer('last_login_at'),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		updated_at: integer('updated_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		deleted_at: integer('deleted_at')
	},
	(t): SQLiteTableExtraConfigValue[] => [
		check('users_role_check', sql`role IN ('superadmin', 'admin_sekolah', 'guru', 'siswa')`),
		check(
			'users_school_role_check',
			sql`(role = 'superadmin' AND school_id IS NULL) OR (role <> 'superadmin' AND school_id IS NOT NULL)`
		),
		index('idx_users_school_role').on(t.school_id, t.role),
		index('idx_users_email').on(t.email),
		index('idx_users_deleted_at').on(t.deleted_at),
		foreignKey({
			name: 'users_school_id_schools_id_fk',
			columns: [t.school_id],
			foreignColumns: [schools.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'users_created_by_users_id_fk',
			columns: [t.created_by],
			foreignColumns: [users.id]
		}).onDelete('set null')
	]
);

export const sessions = sqliteTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		user_id: integer('user_id').notNull(),
		expires_at: integer('expires_at').notNull(),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`)
	},
	(t): SQLiteTableExtraConfigValue[] => [
		index('idx_sessions_user_id').on(t.user_id),
		index('idx_sessions_expires_at').on(t.expires_at),
		foreignKey({
			name: 'sessions_user_id_users_id_fk',
			columns: [t.user_id],
			foreignColumns: [users.id]
		}).onDelete('cascade')
	]
);

// =========================================================
// 3. MASTER AKADEMIK
// =========================================================
export const academicYears = sqliteTable(
	'academic_years',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id').notNull(),
		name: text('name').notNull(),
		semester: text('semester').notNull(),
		start_date: text('start_date').notNull(),
		end_date: text('end_date').notNull(),
		is_active: integer('is_active').notNull().default(0),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		updated_at: integer('updated_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		deleted_at: integer('deleted_at')
	},
	(t): SQLiteTableExtraConfigValue[] => [
		check('academic_years_semester_check', sql`semester IN ('ganjil', 'genap')`),
		check('academic_years_is_active_check', sql`is_active IN (0, 1)`),
		index('idx_academic_years_school_active').on(t.school_id, t.is_active),
		index('idx_academic_years_deleted_at').on(t.deleted_at),
		foreignKey({
			name: 'academic_years_school_id_schools_id_fk',
			columns: [t.school_id],
			foreignColumns: [schools.id]
		}).onDelete('cascade')
	]
);

export const subjects = sqliteTable(
	'subjects',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id').notNull(),
		code: text('code').notNull(),
		name: text('name').notNull(),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		deleted_at: integer('deleted_at')
	},
	(t): SQLiteTableExtraConfigValue[] => [
		index('idx_subjects_school').on(t.school_id),
		index('idx_subjects_deleted_at').on(t.deleted_at),
		unique('subjects_school_id_code_unique').on(t.school_id, t.code),
		foreignKey({
			name: 'subjects_school_id_schools_id_fk',
			columns: [t.school_id],
			foreignColumns: [schools.id]
		}).onDelete('cascade')
	]
);

export const classes = sqliteTable(
	'classes',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id').notNull(),
		academic_year_id: integer('academic_year_id').notNull(),
		name: text('name').notNull(),
		level: text('level').notNull(),
		homeroom_teacher_id: integer('homeroom_teacher_id'),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		deleted_at: integer('deleted_at')
	},
	(t): SQLiteTableExtraConfigValue[] => [
		index('idx_classes_school_year').on(t.school_id, t.academic_year_id),
		index('idx_classes_deleted_at').on(t.deleted_at),
		unique('classes_school_id_academic_year_id_name_unique').on(
			t.school_id,
			t.academic_year_id,
			t.name
		),
		foreignKey({
			name: 'classes_school_id_schools_id_fk',
			columns: [t.school_id],
			foreignColumns: [schools.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'classes_academic_year_id_academic_years_id_fk',
			columns: [t.academic_year_id],
			foreignColumns: [academicYears.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'classes_homeroom_teacher_id_users_id_fk',
			columns: [t.homeroom_teacher_id],
			foreignColumns: [users.id]
		}).onDelete('set null')
	]
);

// =========================================================
// 4. PROFIL GURU & SISWA
// =========================================================
export const teachers = sqliteTable(
	'teachers',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id').notNull(),
		user_id: integer('user_id').notNull().unique(),
		nip: text('nip'),
		gender: text('gender'),
		phone: text('phone'),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`)
	},
	(t): SQLiteTableExtraConfigValue[] => [
		index('idx_teachers_school').on(t.school_id),
		unique('teachers_school_id_nip_unique').on(t.school_id, t.nip),
		check('teachers_gender_check', sql`gender IN ('L', 'P')`),
		foreignKey({
			name: 'teachers_school_id_schools_id_fk',
			columns: [t.school_id],
			foreignColumns: [schools.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'teachers_user_id_users_id_fk',
			columns: [t.user_id],
			foreignColumns: [users.id]
		}).onDelete('cascade')
	]
);

export const students = sqliteTable(
	'students',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id').notNull(),
		user_id: integer('user_id').notNull().unique(),
		nis: text('nis'),
		nisn: text('nisn'),
		gender: text('gender'),
		class_id: integer('class_id'),
		birth_date: text('birth_date'),
		address: text('address'),
		parent_name: text('parent_name'),
		parent_phone: text('parent_phone'),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`)
	},
	(t): SQLiteTableExtraConfigValue[] => [
		index('idx_students_school_class').on(t.school_id, t.class_id),
		index('idx_students_school_nis').on(t.school_id, t.nis),
		check('students_gender_check', sql`gender IN ('L', 'P')`),
		unique('students_school_id_nis_unique').on(t.school_id, t.nis),
		foreignKey({
			name: 'students_school_id_schools_id_fk',
			columns: [t.school_id],
			foreignColumns: [schools.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'students_user_id_users_id_fk',
			columns: [t.user_id],
			foreignColumns: [users.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'students_class_id_classes_id_fk',
			columns: [t.class_id],
			foreignColumns: [classes.id]
		}).onDelete('set null')
	]
);

// =========================================================
// 5. RELASI KELAS–MAPEL–GURU
// =========================================================
export const classSubjects = sqliteTable(
	'class_subjects',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id').notNull(),
		class_id: integer('class_id').notNull(),
		subject_id: integer('subject_id').notNull(),
		teacher_id: integer('teacher_id').notNull(),
		academic_year_id: integer('academic_year_id').notNull(),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		deleted_at: integer('deleted_at')
	},
	(t): SQLiteTableExtraConfigValue[] => [
		index('idx_class_subjects_school_teacher').on(t.school_id, t.teacher_id),
		index('idx_class_subjects_deleted_at').on(t.deleted_at),
		unique(
			'class_subjects_school_class_subject_year_unique'
		).on(t.school_id, t.class_id, t.subject_id, t.academic_year_id),
		foreignKey({
			name: 'class_subjects_school_id_schools_id_fk',
			columns: [t.school_id],
			foreignColumns: [schools.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'class_subjects_class_id_classes_id_fk',
			columns: [t.class_id],
			foreignColumns: [classes.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'class_subjects_subject_id_subjects_id_fk',
			columns: [t.subject_id],
			foreignColumns: [subjects.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'class_subjects_teacher_id_users_id_fk',
			columns: [t.teacher_id],
			foreignColumns: [users.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'class_subjects_academic_year_id_academic_years_id_fk',
			columns: [t.academic_year_id],
			foreignColumns: [academicYears.id]
		}).onDelete('cascade')
	]
);

// =========================================================
// 6. JURNAL MENGAJAR
// =========================================================
export const teachingJournals = sqliteTable(
	'teaching_journals',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id').notNull(),
		teacher_id: integer('teacher_id').notNull(),
		class_id: integer('class_id').notNull(),
		subject_id: integer('subject_id').notNull(),
		academic_year_id: integer('academic_year_id').notNull(),
		date: text('date').notNull(),
		meeting_number: integer('meeting_number').notNull(),
		topic: text('topic').notNull(),
		learning_objectives: text('learning_objectives'),
		activities: text('activities'),
		notes: text('notes'),
		attendance_summary: text('attendance_summary'),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		updated_at: integer('updated_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		deleted_at: integer('deleted_at')
	},
	(t): SQLiteTableExtraConfigValue[] => [
		index('idx_journals_school_teacher_date').on(t.school_id, t.teacher_id, t.date),
		index('idx_journals_school_class_date').on(t.school_id, t.class_id, t.date),
		unique(
			'teaching_journals_school_teacher_class_subject_date_meeting_unique'
		).on(t.school_id, t.teacher_id, t.class_id, t.subject_id, t.date, t.meeting_number),
		foreignKey({
			name: 'teaching_journals_school_id_schools_id_fk',
			columns: [t.school_id],
			foreignColumns: [schools.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'teaching_journals_teacher_id_users_id_fk',
			columns: [t.teacher_id],
			foreignColumns: [users.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'teaching_journals_class_id_classes_id_fk',
			columns: [t.class_id],
			foreignColumns: [classes.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'teaching_journals_subject_id_subjects_id_fk',
			columns: [t.subject_id],
			foreignColumns: [subjects.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'teaching_journals_academic_year_id_academic_years_id_fk',
			columns: [t.academic_year_id],
			foreignColumns: [academicYears.id]
		}).onDelete('cascade')
	]
);

// =========================================================
// 7. POIN PELANGGARAN
// =========================================================
export const violationTypes = sqliteTable(
	'violation_types',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id').notNull(),
		code: text('code').notNull(),
		name: text('name').notNull(),
		category: text('category').notNull(),
		points: integer('points').notNull(),
		description: text('description'),
		is_active: integer('is_active').notNull().default(0),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`)
	},
	(t): SQLiteTableExtraConfigValue[] => [
		index('idx_violation_types_school').on(t.school_id, t.is_active),
		check('violation_types_category_check', sql`category IN ('ringan', 'sedang', 'berat')`),
		check('violation_types_points_check', sql`points >= 0`),
		unique('violation_types_school_id_code_unique').on(t.school_id, t.code),
		foreignKey({
			name: 'violation_types_school_id_schools_id_fk',
			columns: [t.school_id],
			foreignColumns: [schools.id]
		}).onDelete('cascade')
	]
);

export const studentViolations = sqliteTable(
	'student_violations',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id').notNull(),
		student_id: integer('student_id').notNull(),
		violation_type_id: integer('violation_type_id').notNull(),
		reported_by: integer('reported_by').notNull(),
		date: text('date').notNull(),
		description: text('description'),
		points_snapshot: integer('points_snapshot').notNull(),
		evidence_url: text('evidence_url'),
		status: text('status').notNull().default('pending'),
		verified_by: integer('verified_by'),
		verified_at: integer('verified_at'),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		deleted_at: integer('deleted_at')
	},
	(t): SQLiteTableExtraConfigValue[] => [
		index('idx_violations_school_student_date').on(t.school_id, t.student_id, t.date),
		index('idx_violations_school_status').on(t.school_id, t.status),
		check('student_violations_status_check', sql`status IN ('pending', 'verified', 'rejected')`),
		foreignKey({
			name: 'student_violations_school_id_schools_id_fk',
			columns: [t.school_id],
			foreignColumns: [schools.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'student_violations_student_id_students_id_fk',
			columns: [t.student_id],
			foreignColumns: [students.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'student_violations_violation_type_id_violation_types_id_fk',
			columns: [t.violation_type_id],
			foreignColumns: [violationTypes.id]
		}).onDelete('restrict'),
		foreignKey({
			name: 'student_violations_reported_by_users_id_fk',
			columns: [t.reported_by],
			foreignColumns: [users.id]
		}).onDelete('restrict'),
		foreignKey({
			name: 'student_violations_verified_by_users_id_fk',
			columns: [t.verified_by],
			foreignColumns: [users.id]
		}).onDelete('set null')
	]
);

export const studentPointSummaries = sqliteTable(
	'student_point_summaries',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id').notNull(),
		student_id: integer('student_id').notNull(),
		academic_year_id: integer('academic_year_id').notNull(),
		total_points: integer('total_points').notNull().default(0),
		last_violation_at: integer('last_violation_at'),
		updated_at: integer('updated_at').notNull().default(sql`(unixepoch('subsec') * 1000)`)
	},
	(t): SQLiteTableExtraConfigValue[] => [
		index('idx_point_summaries_school_student').on(t.school_id, t.student_id),
		unique(
			'student_point_summaries_school_student_year_unique'
		).on(t.school_id, t.student_id, t.academic_year_id),
		foreignKey({
			name: 'student_point_summaries_school_id_schools_id_fk',
			columns: [t.school_id],
			foreignColumns: [schools.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'student_point_summaries_student_id_students_id_fk',
			columns: [t.student_id],
			foreignColumns: [students.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'student_point_summaries_academic_year_id_academic_years_id_fk',
			columns: [t.academic_year_id],
			foreignColumns: [academicYears.id]
		}).onDelete('cascade')
	]
);

export const sanctions = sqliteTable(
	'sanctions',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id').notNull(),
		min_points: integer('min_points').notNull(),
		max_points: integer('max_points').notNull(),
		name: text('name').notNull(),
		action: text('action').notNull(),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		deleted_at: integer('deleted_at')
	},
	(t): SQLiteTableExtraConfigValue[] => [
		index('idx_sanctions_school').on(t.school_id, t.min_points),
		index('idx_sanctions_deleted_at').on(t.deleted_at),
		check('sanctions_points_check', sql`min_points >= 0 AND max_points >= min_points`)
	]
);

// =========================================================
// 8. JADWAL SEKOLAH
// =========================================================
export const timeSlots = sqliteTable(
	'time_slots',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id').notNull(),
		day_of_week: integer('day_of_week').notNull(),
		slot_number: integer('slot_number').notNull(),
		start_time: text('start_time').notNull(),
		end_time: text('end_time').notNull(),
		is_break: integer('is_break').notNull().default(0),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		deleted_at: integer('deleted_at')
	},
	(t): SQLiteTableExtraConfigValue[] => [
		index('idx_time_slots_school_day').on(t.school_id, t.day_of_week),
		index('idx_time_slots_deleted_at').on(t.deleted_at),
		check('time_slots_day_of_week_check', sql`day_of_week BETWEEN 1 AND 7`),
		check('time_slots_is_break_check', sql`is_break IN (0, 1)`),
		unique('time_slots_school_day_slot_unique').on(t.school_id, t.day_of_week, t.slot_number),
		foreignKey({
			name: 'time_slots_school_id_schools_id_fk',
			columns: [t.school_id],
			foreignColumns: [schools.id]
		}).onDelete('cascade')
	]
);

export const schedules = sqliteTable(
	'schedules',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id').notNull(),
		academic_year_id: integer('academic_year_id').notNull(),
		class_id: integer('class_id').notNull(),
		subject_id: integer('subject_id').notNull(),
		teacher_id: integer('teacher_id').notNull(),
		time_slot_id: integer('time_slot_id').notNull(),
		room: text('room'),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		updated_at: integer('updated_at').notNull().default(sql`(unixepoch('subsec') * 1000)`),
		deleted_at: integer('deleted_at')
	},
	(t): SQLiteTableExtraConfigValue[] => [
		index('idx_schedules_school_class').on(t.school_id, t.class_id, t.time_slot_id),
		index('idx_schedules_school_teacher').on(t.school_id, t.teacher_id, t.time_slot_id),
		index('idx_schedules_deleted_at').on(t.deleted_at),
		unique('schedules_school_time_slot_class_unique').on(
			t.school_id,
			t.time_slot_id,
			t.class_id
		),
		unique('schedules_school_time_slot_teacher_unique').on(
			t.school_id,
			t.time_slot_id,
			t.teacher_id
		),
		foreignKey({
			name: 'schedules_school_id_schools_id_fk',
			columns: [t.school_id],
			foreignColumns: [schools.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'schedules_academic_year_id_academic_years_id_fk',
			columns: [t.academic_year_id],
			foreignColumns: [academicYears.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'schedules_class_id_classes_id_fk',
			columns: [t.class_id],
			foreignColumns: [classes.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'schedules_subject_id_subjects_id_fk',
			columns: [t.subject_id],
			foreignColumns: [subjects.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'schedules_teacher_id_users_id_fk',
			columns: [t.teacher_id],
			foreignColumns: [users.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'schedules_time_slot_id_time_slots_id_fk',
			columns: [t.time_slot_id],
			foreignColumns: [timeSlots.id]
		}).onDelete('cascade')
	]
);

// =========================================================
// 9. AUDIT & NOTIFIKASI
// =========================================================
export const auditLogs = sqliteTable(
	'audit_logs',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id'),
		user_id: integer('user_id'),
		action: text('action').notNull(),
		model: text('model').notNull(),
		model_id: integer('model_id'),
		changes: text('changes'),
		ip: text('ip'),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`)
	},
	(t): SQLiteTableExtraConfigValue[] => [
		index('idx_audit_school_created').on(t.school_id, t.created_at),
		foreignKey({
			name: 'audit_logs_school_id_schools_id_fk',
			columns: [t.school_id],
			foreignColumns: [schools.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'audit_logs_user_id_users_id_fk',
			columns: [t.user_id],
			foreignColumns: [users.id]
		}).onDelete('set null')
	]
);

export const notifications = sqliteTable(
	'notifications',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		school_id: integer('school_id').notNull(),
		user_id: integer('user_id').notNull(),
		title: text('title').notNull(),
		body: text('body'),
		read_at: integer('read_at'),
		created_at: integer('created_at').notNull().default(sql`(unixepoch('subsec') * 1000)`)
	},
	(t): SQLiteTableExtraConfigValue[] => [
		index('idx_notifications_user_read').on(t.user_id, t.read_at),
		foreignKey({
			name: 'notifications_school_id_schools_id_fk',
			columns: [t.school_id],
			foreignColumns: [schools.id]
		}).onDelete('cascade'),
		foreignKey({
			name: 'notifications_user_id_users_id_fk',
			columns: [t.user_id],
			foreignColumns: [users.id]
		}).onDelete('cascade')
	]
);

// Schema gabungan untuk migrasi & query
export const schema = {
	schools,
	users,
	sessions,
	academicYears,
	subjects,
	classes,
	teachers,
	students,
	classSubjects,
	teachingJournals,
	violationTypes,
	studentViolations,
	studentPointSummaries,
	sanctions,
	timeSlots,
	schedules,
	auditLogs,
	notifications
};

export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type AcademicYear = typeof academicYears.$inferSelect;
export type NewAcademicYear = typeof academicYears.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
export type Teacher = typeof teachers.$inferSelect;
export type NewTeacher = typeof teachers.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type ClassSubject = typeof classSubjects.$inferSelect;
export type NewClassSubject = typeof classSubjects.$inferInsert;
export type TeachingJournal = typeof teachingJournals.$inferSelect;
export type NewTeachingJournal = typeof teachingJournals.$inferInsert;
export type ViolationType = typeof violationTypes.$inferSelect;
export type NewViolationType = typeof violationTypes.$inferInsert;
export type StudentViolation = typeof studentViolations.$inferSelect;
export type NewStudentViolation = typeof studentViolations.$inferInsert;
export type StudentPointSummary = typeof studentPointSummaries.$inferSelect;
export type NewStudentPointSummary = typeof studentPointSummaries.$inferInsert;
export type Sanction = typeof sanctions.$inferSelect;
export type NewSanction = typeof sanctions.$inferInsert;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type NewTimeSlot = typeof timeSlots.$inferInsert;
export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
