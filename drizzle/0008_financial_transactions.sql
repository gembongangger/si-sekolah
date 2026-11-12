CREATE TABLE IF NOT EXISTS `keuangan_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`school_id` integer NOT NULL,
	`academic_year_id` integer NOT NULL,
	`type` text DEFAULT '' NOT NULL CHECK(type IN ('pemasukan', 'pengeluaran')),
	`category` text DEFAULT '' NOT NULL,
	`amount` integer NOT NULL CHECK(amount >= 0),
	`date` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`reference_type` text,
	`reference_id` integer,
	`notes` text,
	`created_by` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `idx_keuangan_trans_school` ON `keuangan_transactions` (`school_id`);--> statement-breakpoint
CREATE INDEX `idx_keuangan_trans_school_year` ON `keuangan_transactions` (`school_id`, `academic_year_id`);--> statement-breakpoint
CREATE INDEX `idx_keuangan_trans_deleted_at` ON `keuangan_transactions` (`deleted_at`);--> statement-breakpoint
ALTER TABLE `keuangan_transactions` ADD FOREIGN KEY (`school_id`) REFERENCES `schools` ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan_transactions` ADD FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `keuangan_transactions` ADD FOREIGN KEY (`created_by`) REFERENCES `users` ON DELETE set null ON UPDATE no action;
