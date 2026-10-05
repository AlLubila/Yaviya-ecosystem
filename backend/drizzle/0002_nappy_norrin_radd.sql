CREATE TABLE `faq_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question` text NOT NULL,
	`resolved` integer NOT NULL,
	`updated_at` integer NOT NULL
);
