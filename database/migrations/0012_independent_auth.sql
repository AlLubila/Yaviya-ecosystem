CREATE TABLE auth_users (id TEXT PRIMARY KEY, login TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE auth_sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES auth_users(id), expires_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE INDEX auth_sessions_expiry ON auth_sessions(expires_at);
--> statement-breakpoint
CREATE TABLE auth_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
--> statement-breakpoint
CREATE TABLE private_files (key TEXT PRIMARY KEY, body BLOB NOT NULL, content_type TEXT NOT NULL);
