ALTER TABLE identity_checks ADD COLUMN issuing_country TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE identity_checks ADD COLUMN document_mime TEXT NOT NULL DEFAULT '';
