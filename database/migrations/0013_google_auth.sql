CREATE TABLE google_identities (subject TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES auth_users(id));
--> statement-breakpoint
CREATE TABLE google_states (state_hash TEXT PRIMARY KEY, verifier TEXT NOT NULL, nonce TEXT NOT NULL, return_path TEXT NOT NULL, expires_at INTEGER NOT NULL);
