CREATE TABLE `coin_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`delta` integer NOT NULL,
	`reference` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `coin_events_user_idx` ON `coin_events` (`user_id`);