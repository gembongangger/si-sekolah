CREATE TABLE `collection_project_targets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`target_type` text NOT NULL,
	`target_id` integer,
	FOREIGN KEY (`project_id`) REFERENCES `collection_projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "collection_targets_type_check" CHECK(target_type IN ('all', 'teacher')),
	CONSTRAINT "collection_targets_id_check" CHECK((target_type = 'all' AND target_id IS NULL) OR (target_type = 'teacher' AND target_id IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX `idx_collection_targets_project` ON `collection_project_targets` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `collection_targets_project_type_id_unique` ON `collection_project_targets` (`project_id`,`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `collection_projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`deadline` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_by` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "collection_projects_is_active_check" CHECK(is_active IN (0, 1))
);
--> statement-breakpoint
CREATE INDEX `idx_collection_projects_school_active` ON `collection_projects` (`school_id`,`is_active`);--> statement-breakpoint
CREATE INDEX `idx_collection_projects_deleted_at` ON `collection_projects` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `collection_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`project_id` integer NOT NULL,
	`teacher_id` integer NOT NULL,
	`file_url` text NOT NULL,
	`note` text,
	`submitted_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `collection_projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_collection_submissions_project` ON `collection_submissions` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_collection_submissions_teacher` ON `collection_submissions` (`teacher_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `collection_submissions_project_teacher_unique` ON `collection_submissions` (`project_id`,`teacher_id`);--> statement-breakpoint
