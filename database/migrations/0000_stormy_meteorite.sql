CREATE TABLE `customers` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text NOT NULL,
	`address` text NOT NULL,
	`wishlist` text DEFAULT '[]' NOT NULL
);
