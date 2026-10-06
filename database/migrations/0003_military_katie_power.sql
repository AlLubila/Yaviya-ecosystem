ALTER TABLE `customers` ADD `account_type` text DEFAULT 'buyer' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `privacy_version` text;--> statement-breakpoint
ALTER TABLE `customers` ADD `privacy_accepted_at` integer;