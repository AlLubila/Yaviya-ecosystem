create index auth_sessions_user_idx on runtime.auth_sessions(user_id);
create index google_identities_user_idx on runtime.google_identities(user_id);
create index auth_mfa_challenges_user_idx on runtime.auth_mfa_challenges(user_id);
