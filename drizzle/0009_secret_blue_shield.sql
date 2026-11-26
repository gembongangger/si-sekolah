CREATE TABLE `piket_kbm_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`teacher_id` integer NOT NULL,
	`date` text NOT NULL,
	`time_slot_id` integer NOT NULL,
	`slot_label` text NOT NULL,
	`reason` text NOT NULL,
	`task_note` text,
	`attachment_key` text,
	`attachment_name` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` integer,
	`reviewed_at` integer,
	`review_note` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "piket_kbm_status_check" CHECK(status IN ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE INDEX `idx_piket_kbm_school_status` ON `piket_kbm_requests` (`school_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_piket_kbm_school_date_teacher` ON `piket_kbm_requests` (`school_id`,`date`,`teacher_id`);--> statement-breakpoint
CREATE INDEX `idx_piket_kbm_deleted_at` ON `piket_kbm_requests` (`deleted_at`);