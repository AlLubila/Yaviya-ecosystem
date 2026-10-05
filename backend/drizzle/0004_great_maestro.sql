CREATE TABLE `admin_access` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `identity_checks` (
	`user_id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`company_name` text DEFAULT '' NOT NULL,
	`company_rcm` text DEFAULT '' NOT NULL,
	`document_type` text NOT NULL,
	`object_key` text NOT NULL,
	`file_name` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`submitted_at` integer NOT NULL,
	`reviewed_at` integer
);
--> statement-breakpoint
CREATE TABLE `owned_stores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`country` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `owned_stores_user_idx` ON `owned_stores` (`user_id`);