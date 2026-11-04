CREATE TABLE `academic_years` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`name` text NOT NULL,
	`semester` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`is_active` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "academic_years_semester_check" CHECK(semester IN ('ganjil', 'genap')),
	CONSTRAINT "academic_years_is_active_check" CHECK(is_active IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX `idx_academic_years_school_active` ON `academic_years` (`school_id`,`is_active`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer,
	`user_id` integer,
	`action` text NOT NULL,
	`model` text NOT NULL,
	`model_id` integer,
	`changes` text,
	`ip` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_audit_school_created` ON `audit_logs` (`school_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `class_subjects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`class_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`teacher_id` integer NOT NULL,
	`academic_year_id` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_class_subjects_school_teacher` ON `class_subjects` (`school_id`,`teacher_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `class_subjects_school_class_subject_year_unique` ON `class_subjects` (`school_id`,`class_id`,`subject_id`,`academic_year_id`);--> statement-breakpoint
CREATE TABLE `classes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`academic_year_id` integer NOT NULL,
	`name` text NOT NULL,
	`level` text NOT NULL,
	`homeroom_teacher_id` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`homeroom_teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_classes_school_year` ON `classes` (`school_id`,`academic_year_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `classes_school_id_academic_year_id_name_unique` ON `classes` (`school_id`,`academic_year_id`,`name`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`read_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_notifications_user_read` ON `notifications` (`user_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `sanctions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`min_points` integer NOT NULL,
	`max_points` integer NOT NULL,
	`name` text NOT NULL,
	`action` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT "sanctions_points_check" CHECK(min_points >= 0 AND max_points >= min_points)
);
--> statement-breakpoint
CREATE INDEX `idx_sanctions_school` ON `sanctions` (`school_id`,`min_points`);--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`academic_year_id` integer NOT NULL,
	`class_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`teacher_id` integer NOT NULL,
	`time_slot_id` integer NOT NULL,
	`room` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_schedules_school_class` ON `schedules` (`school_id`,`class_id`,`time_slot_id`);--> statement-breakpoint
CREATE INDEX `idx_schedules_school_teacher` ON `schedules` (`school_id`,`teacher_id`,`time_slot_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `schedules_school_time_slot_class_unique` ON `schedules` (`school_id`,`time_slot_id`,`class_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `schedules_school_time_slot_teacher_unique` ON `schedules` (`school_id`,`time_slot_id`,`teacher_id`);--> statement-breakpoint
CREATE TABLE `schools` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`npsn` text NOT NULL,
	`address` text,
	`phone` text,
	`email` text,
	`logo_url` text,
	`timezone` text DEFAULT 'Asia/Jakarta' NOT NULL,
	`is_active` integer DEFAULT 0 NOT NULL,
	`subscription_plan` text DEFAULT 'free' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "schools_is_active_check" CHECK(is_active IN (0, 1))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schools_npsn_unique` ON `schools` (`npsn`);--> statement-breakpoint
CREATE INDEX `idx_schools_is_active` ON `schools` (`is_active`);--> statement-breakpoint
CREATE INDEX `idx_schools_deleted_at` ON `schools` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user_id` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expires_at` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `student_point_summaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`academic_year_id` integer NOT NULL,
	`total_points` integer DEFAULT 0 NOT NULL,
	`last_violation_at` integer,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_point_summaries_school_student` ON `student_point_summaries` (`school_id`,`student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `student_point_summaries_school_student_year_unique` ON `student_point_summaries` (`school_id`,`student_id`,`academic_year_id`);--> statement-breakpoint
CREATE TABLE `student_violations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`violation_type_id` integer NOT NULL,
	`reported_by` integer NOT NULL,
	`date` text NOT NULL,
	`description` text,
	`points_snapshot` integer NOT NULL,
	`evidence_url` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`verified_by` integer,
	`verified_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`violation_type_id`) REFERENCES `violation_types`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`reported_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "student_violations_status_check" CHECK(status IN ('pending', 'verified', 'rejected'))
);
--> statement-breakpoint
CREATE INDEX `idx_violations_school_student_date` ON `student_violations` (`school_id`,`student_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_violations_school_status` ON `student_violations` (`school_id`,`status`);--> statement-breakpoint
CREATE TABLE `students` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`nis` text,
	`nisn` text,
	`gender` text,
	`class_id` integer,
	`birth_date` text,
	`address` text,
	`parent_name` text,
	`parent_phone` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "students_gender_check" CHECK(gender IN ('L', 'P'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_user_id_unique` ON `students` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_students_school_class` ON `students` (`school_id`,`class_id`);--> statement-breakpoint
CREATE INDEX `idx_students_school_nis` ON `students` (`school_id`,`nis`);--> statement-breakpoint
CREATE UNIQUE INDEX `students_school_id_nis_unique` ON `students` (`school_id`,`nis`);--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_subjects_school` ON `subjects` (`school_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `subjects_school_id_code_unique` ON `subjects` (`school_id`,`code`);--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`nip` text,
	`gender` text,
	`phone` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "teachers_gender_check" CHECK(gender IN ('L', 'P'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `teachers_user_id_unique` ON `teachers` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_teachers_school` ON `teachers` (`school_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `teachers_school_id_nip_unique` ON `teachers` (`school_id`,`nip`);--> statement-breakpoint
CREATE TABLE `teaching_journals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`teacher_id` integer NOT NULL,
	`class_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`academic_year_id` integer NOT NULL,
	`date` text NOT NULL,
	`meeting_number` integer NOT NULL,
	`topic` text NOT NULL,
	`learning_objectives` text,
	`activities` text,
	`notes` text,
	`attendance_summary` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_journals_school_teacher_date` ON `teaching_journals` (`school_id`,`teacher_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_journals_school_class_date` ON `teaching_journals` (`school_id`,`class_id`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `teaching_journals_school_teacher_class_subject_date_meeting_unique` ON `teaching_journals` (`school_id`,`teacher_id`,`class_id`,`subject_id`,`date`,`meeting_number`);--> statement-breakpoint
CREATE TABLE `time_slots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`day_of_week` integer NOT NULL,
	`slot_number` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`is_break` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "time_slots_day_of_week_check" CHECK(day_of_week BETWEEN 1 AND 7),
	CONSTRAINT "time_slots_is_break_check" CHECK(is_break IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX `idx_time_slots_school_day` ON `time_slots` (`school_id`,`day_of_week`);--> statement-breakpoint
CREATE UNIQUE INDEX `time_slots_school_day_slot_unique` ON `time_slots` (`school_id`,`day_of_week`,`slot_number`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`is_active` integer DEFAULT 0 NOT NULL,
	`created_by` integer,
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "users_role_check" CHECK(role IN ('superadmin', 'admin_sekolah', 'guru', 'siswa')),
	CONSTRAINT "users_school_role_check" CHECK((role = 'superadmin' AND school_id IS NULL) OR (role <> 'superadmin' AND school_id IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_school_role` ON `users` (`school_id`,`role`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_deleted_at` ON `users` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `violation_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`points` integer NOT NULL,
	`description` text,
	`is_active` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "violation_types_category_check" CHECK(category IN ('ringan', 'sedang', 'berat')),
	CONSTRAINT "violation_types_points_check" CHECK(points >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_violation_types_school` ON `violation_types` (`school_id`,`is_active`);--> statement-breakpoint
CREATE UNIQUE INDEX `violation_types_school_id_code_unique` ON `violation_types` (`school_id`,`code`);