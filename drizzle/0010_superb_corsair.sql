CREATE TABLE `piket_kbm_manual_absences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`date` text NOT NULL,
	`class_id` integer NOT NULL,
	`time_slot_id` integer NOT NULL,
	`teacher_id` integer NOT NULL,
	`note` text,
	`recorded_by` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`time_slot_id`) REFERENCES `time_slots`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_piket_manual_school_date` ON `piket_kbm_manual_absences` (`school_id`,`date`);--> statement-breakpoint
CREATE INDEX `idx_piket_manual_deleted_at` ON `piket_kbm_manual_absences` (`deleted_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `piket_manual_unique` ON `piket_kbm_manual_absences` (`school_id`,`date`,`class_id`,`time_slot_id`,`teacher_id`);