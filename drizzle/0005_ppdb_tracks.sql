CREATE TABLE `ppdb_tracks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ppdb_tracks_is_active_check" CHECK(is_active IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX `idx_ppdb_tracks_school_active` ON `ppdb_tracks` (`school_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_ppdb_tracks_deleted_at` ON `ppdb_tracks` (`deleted_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `ppdb_tracks_school_id_code_unique` ON `ppdb_tracks` (`school_id`,`code`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ppdb_registrations` (
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
	CONSTRAINT "ppdb_registrations_status_check" CHECK(status IN ('submitted', 'verified', 'accepted', 'rejected', 'enrolled'))
);
--> statement-breakpoint
INSERT INTO `__new_ppdb_registrations`("id", "school_id", "batch_id", "registration_number", "full_name", "nisn", "nik", "gender", "birth_place", "birth_date", "religion", "address", "phone", "email", "previous_school", "graduation_year", "track", "major_choice", "parent_name", "parent_phone", "parent_job", "status", "selection_score", "notes", "converted_student_id", "created_at", "updated_at", "deleted_at") SELECT "id", "school_id", "batch_id", "registration_number", "full_name", "nisn", "nik", "gender", "birth_place", "birth_date", "religion", "address", "phone", "email", "previous_school", "graduation_year", "track", "major_choice", "parent_name", "parent_phone", "parent_job", "status", "selection_score", "notes", "converted_student_id", "created_at", "updated_at", "deleted_at" FROM `ppdb_registrations`;--> statement-breakpoint
DROP TABLE `ppdb_registrations`;--> statement-breakpoint
ALTER TABLE `__new_ppdb_registrations` RENAME TO `ppdb_registrations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `ppdb_registrations_registration_number_unique` ON `ppdb_registrations` (`registration_number`);--> statement-breakpoint
CREATE INDEX `idx_ppdb_registrations_school_batch` ON `ppdb_registrations` (`school_id`,`batch_id`);--> statement-breakpoint
CREATE INDEX `idx_ppdb_registrations_school_status` ON `ppdb_registrations` (`school_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_ppdb_registrations_nisn` ON `ppdb_registrations` (`nisn`);--> statement-breakpoint
CREATE INDEX `idx_ppdb_registrations_deleted_at` ON `ppdb_registrations` (`deleted_at`);