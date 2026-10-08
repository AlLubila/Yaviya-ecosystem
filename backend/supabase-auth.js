import publicConfig from "./data/supabase-public.json" with { type: "json" };
import { randomBytes } from "node:crypto";
import { passwordHash } from "./auth.js";
export function supabaseConfig(config = process.env) {
  return {
    url: config.SUPABASE_URL || (config === process.env ? publicConfig.url : ""),
    key: config.SUPABASE_ANON_KEY || (config === process.env ? publicConfig.publishableKey : ""),
  };
}
// Validate with Auth, never decode a JWT and trust its user-editable claims.
export async function supabaseIdentity(request, config = process.env, fetcher = fetch) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer [A-Za-z0-9._-]+$/.test(authorization) || authorization.length > 8192) return null;
  const { url, key } = supabaseConfig(config);
  if (!url || !key) return null;
  const endpoint = new URL(url);
  if (endpoint.protocol !== "https:") return null;
  try {
    const response = await fetcher(new URL("/auth/v1/user", endpoint), {
      headers: { apikey: key, Authorization: authorization }, signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const user = await response.json();
    if (!/^[a-f0-9-]{36}$/i.test(user.id || "")) return null;
    const login = user.email && user.email_confirmed_at ? user.email.trim().toLowerCase() : user.phone && user.phone_confirmed_at ? "+" + user.phone.replace(/^\+/, "") : null;
    return login ? { id: user.id, login } : null;
  } catch { return null; }
}
export async function bridgeSupabaseUser(db, identity) {
  if (!identity) return null;
  await db.prepare("INSERT INTO auth_users (id,login,password_hash,created_at) VALUES (?,?,?,?) ON CONFLICT(login) DO NOTHING")
    .bind(identity.id, identity.login, await passwordHash(randomBytes(48).toString("hex")), Date.now()).run();
  return db.prepare("SELECT id,login FROM auth_users WHERE login=?").bind(identity.login).first();
}
