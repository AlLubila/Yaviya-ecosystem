ALTER TABLE auth_sessions ADD COLUMN issued_at INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE auth_sessions ADD COLUMN mfa_generation TEXT;
--> statement-breakpoint
CREATE TABLE auth_mfa (user_id TEXT PRIMARY KEY REFERENCES auth_users(id), generation TEXT NOT NULL, secret_cipher TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 0, pending_expires INTEGER NOT NULL, last_step INTEGER NOT NULL DEFAULT -1);
--> statement-breakpoint
CREATE TABLE auth_mfa_recovery (user_id TEXT NOT NULL REFERENCES auth_users(id), code_hash TEXT NOT NULL, PRIMARY KEY(user_id,code_hash));
--> statement-breakpoint
CREATE TABLE auth_mfa_challenges (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES auth_users(id), generation TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0);
--> statement-breakpoint
CREATE INDEX auth_mfa_challenge_expiry ON auth_mfa_challenges(expires_at);
