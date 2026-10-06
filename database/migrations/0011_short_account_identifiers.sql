CREATE TABLE `account_identifiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_identifiers_user_role_idx` ON `account_identifiers` (`user_id`,`role`);