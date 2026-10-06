CREATE TABLE `market_couriers` (
	`user_id` text PRIMARY KEY NOT NULL,
	`country` text NOT NULL,
	`available` integer DEFAULT 0 NOT NULL,
	`payout_method` text DEFAULT 'mobile_money' NOT NULL,
	`payout_account` text DEFAULT '' NOT NULL,
	`benefits_accepted` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `market_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`sender_user_id` text NOT NULL,
	`sender_role` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `market_messages_order_idx` ON `market_messages` (`order_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `market_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`country` text NOT NULL,
	`buyer_user_id` text NOT NULL,
	`courier_user_id` text,
	`request_key` text NOT NULL,
	`snapshot` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `market_orders_country_idx` ON `market_orders` (`country`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `market_orders_request_idx` ON `market_orders` (`request_key`);--> statement-breakpoint
CREATE TABLE `market_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`seller_id` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `market_participants_user_idx` ON `market_participants` (`user_id`,`order_id`);--> statement-breakpoint
CREATE INDEX `market_participants_order_idx` ON `market_participants` (`order_id`);--> statement-breakpoint
CREATE TABLE `market_products` (
	`key` text PRIMARY KEY NOT NULL,
	`country` text NOT NULL,
	`product_id` integer NOT NULL,
	`seller_id` integer NOT NULL,
	`owner_user_id` text NOT NULL,
	`data` text NOT NULL,
	`stock` integer NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `market_products_country_idx` ON `market_products` (`country`);--> statement-breakpoint
CREATE INDEX `market_products_owner_idx` ON `market_products` (`owner_user_id`);