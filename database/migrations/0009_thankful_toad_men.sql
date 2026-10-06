CREATE TABLE `product_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`product_id` integer NOT NULL,
	`seller_id` integer NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`file_name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `product_photos_user_product_idx` ON `product_photos` (`user_id`,`product_id`);