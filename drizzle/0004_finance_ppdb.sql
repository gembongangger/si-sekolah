CREATE TABLE `ppdb_batches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`academic_year_id` integer NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`quota` integer DEFAULT 100 NOT NULL,
	`registration_fee` integer DEFAULT 0 NOT NULL,
	`description` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ppdb_batches_is_active_check" CHECK(is_active IN (0, 1)),
	CONSTRAINT "ppdb_batches_quota_check" CHECK(quota >= 0),
	CONSTRAINT "ppdb_batches_fee_check" CHECK(registration_fee >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_ppdb_batches_school_year` ON `ppdb_batches` (`school_id`,`academic_year_id`);--> statement-breakpoint
CREATE INDEX `idx_ppdb_batches_active` ON `ppdb_batches` (`school_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_ppdb_batches_deleted_at` ON `ppdb_batches` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `ppdb_registrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`batch_id` integer NOT NULL,
	`registration_number` text NOT NULL,
	`full_name` text NOT NULL,
	`nisn` text,
	`nik` text,
	`gender` text NOT NULL,
	`birth_place` text,
	`birth_date` text NOT NULL,
	`religion` text DEFAULT 'Islam',
	`address` text NOT NULL,
	`phone` text,
	`email` text,
	`previous_school` text NOT NULL,
	`graduation_year` integer,
	`track` text DEFAULT 'reguler' NOT NULL,
	`major_choice` text NOT NULL,
	`parent_name` text NOT NULL,
	`parent_phone` text NOT NULL,
	`parent_job` text,
	`status` text DEFAULT 'submitted' NOT NULL,
	`selection_score` integer,
	`notes` text,
	`converted_student_id` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`batch_id`) REFERENCES `ppdb_batches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`converted_student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "ppdb_registrations_gender_check" CHECK(gender IN ('L', 'P')),
	CONSTRAINT "ppdb_registrations_track_check" CHECK(track IN ('reguler', 'prestasi', 'zonasi', 'afirmasi')),
	CONSTRAINT "ppdb_registrations_status_check" CHECK(status IN ('submitted', 'verified', 'accepted', 'rejected', 'enrolled'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ppdb_registrations_registration_number_unique` ON `ppdb_registrations` (`registration_number`);--> statement-breakpoint
CREATE INDEX `idx_ppdb_registrations_school_batch` ON `ppdb_registrations` (`school_id`,`batch_id`);--> statement-breakpoint
CREATE INDEX `idx_ppdb_registrations_school_status` ON `ppdb_registrations` (`school_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_ppdb_registrations_nisn` ON `ppdb_registrations` (`nisn`);--> statement-breakpoint
CREATE INDEX `idx_ppdb_registrations_deleted_at` ON `ppdb_registrations` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `spp_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`academic_year_id` integer NOT NULL,
	`month` integer NOT NULL,
	`month_name` text NOT NULL,
	`year` integer NOT NULL,
	`amount` integer NOT NULL,
	`amount_paid` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payment_date` text,
	`payment_method` text DEFAULT 'cash' NOT NULL,
	`invoice_number` text,
	`received_by` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`received_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "spp_payments_status_check" CHECK(status IN ('pending', 'paid')),
	CONSTRAINT "spp_payments_month_check" CHECK(month BETWEEN 1 AND 12),
	CONSTRAINT "spp_payments_amount_check" CHECK(amount >= 0),
	CONSTRAINT "spp_payments_amount_paid_check" CHECK(amount_paid >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_spp_payments_school_student` ON `spp_payments` (`school_id`,`student_id`);--> statement-breakpoint
CREATE INDEX `idx_spp_payments_school_status` ON `spp_payments` (`school_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_spp_payments_school_year_month` ON `spp_payments` (`school_id`,`academic_year_id`,`month`);--> statement-breakpoint
CREATE INDEX `idx_spp_payments_deleted_at` ON `spp_payments` (`deleted_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `spp_payments_school_student_year_month_unique` ON `spp_payments` (`school_id`,`student_id`,`academic_year_id`,`month`,`year`);--> statement-breakpoint
CREATE TABLE `spp_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`academic_year_id` integer NOT NULL,
	`level` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "spp_settings_amount_check" CHECK(amount >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_spp_settings_school_year` ON `spp_settings` (`school_id`,`academic_year_id`);--> statement-breakpoint
CREATE INDEX `idx_spp_settings_deleted_at` ON `spp_settings` (`deleted_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `spp_settings_school_year_level_unique` ON `spp_settings` (`school_id`,`academic_year_id`,`level`);--> statement-breakpoint
CREATE TABLE `student_sanctions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`sanction_id` integer NOT NULL,
	`academic_year_id` integer NOT NULL,
	`total_points` integer NOT NULL,
	`applied_by` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sanction_id`) REFERENCES `sanctions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_student_sanctions_school_student` ON `student_sanctions` (`school_id`,`student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `student_sanctions_student_sanction_year_unique` ON `student_sanctions` (`student_id`,`sanction_id`,`academic_year_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
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
	CONSTRAINT "users_role_check" CHECK(role IN ('superadmin', 'admin_sekolah', 'admin_keuangan', 'guru', 'siswa')),
	CONSTRAINT "users_school_role_check" CHECK((role = 'superadmin' AND school_id IS NULL) OR (role <> 'superadmin' AND school_id IS NOT NULL))
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "school_id", "name", "email", "password_hash", "role", "is_active", "created_by", "last_login_at", "created_at", "updated_at", "deleted_at") SELECT "id", "school_id", "name", "email", "password_hash", "role", "is_active", "created_by", "last_login_at", "created_at", "updated_at", "deleted_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_school_role` ON `users` (`school_id`,`role`);--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `idx_users_deleted_at` ON `users` (`deleted_at`);