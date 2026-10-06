CREATE TABLE `seller_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`seller_user_id` text NOT NULL,
	`country` text NOT NULL,
	`sender` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `seller_messages_thread_idx` ON `seller_messages` (`country`,`seller_user_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `customers` ADD `first_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `last_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `identity_checks` ADD `unregistered` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `identity_checks` ADD `seller_plan` text DEFAULT 'free' NOT NULL;