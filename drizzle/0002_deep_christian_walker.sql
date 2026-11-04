ALTER TABLE `schedules` ADD `updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL;--> statement-breakpoint
ALTER TABLE `schedules` ADD `deleted_at` integer;--> statement-breakpoint
CREATE INDEX `idx_schedules_deleted_at` ON `schedules` (`deleted_at`);