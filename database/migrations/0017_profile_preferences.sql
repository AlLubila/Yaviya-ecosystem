ALTER TABLE customers ADD COLUMN country_code TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE customers ADD COLUMN currency TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE customers ADD COLUMN preferred_language TEXT NOT NULL DEFAULT 'fr';
