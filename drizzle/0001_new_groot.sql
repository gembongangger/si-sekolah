ALTER TABLE `academic_years` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `idx_academic_years_deleted_at` ON `academic_years` (`deleted_at`);--> statement-breakpoint
ALTER TABLE `class_subjects` ADD `created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL;--> statement-breakpoint
ALTER TABLE `class_subjects` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `idx_class_subjects_deleted_at` ON `class_subjects` (`deleted_at`);--> statement-breakpoint
ALTER TABLE `classes` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `idx_classes_deleted_at` ON `classes` (`deleted_at`);--> statement-breakpoint
ALTER TABLE `sanctions` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `idx_sanctions_deleted_at` ON `sanctions` (`deleted_at`);--> statement-breakpoint
ALTER TABLE `subjects` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `idx_subjects_deleted_at` ON `subjects` (`deleted_at`);--> statement-breakpoint
ALTER TABLE `time_slots` ADD `created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL;--> statement-breakpoint
ALTER TABLE `time_slots` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `idx_time_slots_deleted_at` ON `time_slots` (`deleted_at`);