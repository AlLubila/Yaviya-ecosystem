CREATE TABLE `courier_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`courier_user_id` text NOT NULL,
	`country` text NOT NULL,
	`sender` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `courier_messages_thread_idx` ON `courier_messages` (`country`,`courier_user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `delivery_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`buyer_user_id` text NOT NULL,
	`courier_user_id` text,
	`country` text NOT NULL,
	`order_id` text NOT NULL,
	`seller_scores` text NOT NULL,
	`seller_names` text NOT NULL,
	`courier_score` integer,
	`comment` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `delivery_reviews_country_idx` ON `delivery_reviews` (`country`,`created_at`);--> statement-breakpoint
CREATE INDEX `delivery_reviews_courier_idx` ON `delivery_reviews` (`courier_user_id`);