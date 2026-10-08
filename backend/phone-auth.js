import { createHash, randomBytes, randomUUID } from "node:crypto";
import { passwordHash } from "./auth.js";
import { supabaseConfig } from "./supabase-auth.js";
import { primaryAuthenticated } from "./two-factor.js";
const json = (value, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
export async function handlePhoneAuth(request, db, action, config = process.env, fetcher = fetch) {
  if (request.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Origine refusée" }, 403);
  const provider = supabaseConfig(config);
  if (!provider.url || !provider.key) return json({ error: "La connexion SMS sera disponible après activation du fournisseur. Utilisez votre e-mail ou la connexion par mot de passe." }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Formulaire invalide" }, 400); }
  const phone = String(body.phone || "").replace(/[\s()-]/g, "");
  if (!/^\+(243|242)[0-9]{9}$/.test(phone)) return json({ error: "Numéro requis : +243 ou +242 suivi de 9 chiffres" }, 400);
  if (action === "phone-verify" && !/^[0-9]{6}$/.test(body.code || "")) return json({ error: "Code SMS à 6 chiffres requis" }, 400);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const keys = [ip, phone].map(v => createHash("sha256").update(`sms:${action}:${v}`).digest("hex"));
  const now = Date.now(), until = now + 15 * 60 * 1000;
  await db.batch(keys.map(key => db.prepare("INSERT INTO auth_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN auth_limits.expires_at<? THEN 1 ELSE auth_limits.count+1 END,expires_at=CASE WHEN auth_limits.expires_at<? THEN excluded.expires_at ELSE auth_limits.expires_at END").bind(key, until, now, now)));
  for (const key of keys) if ((await db.prepare("SELECT count FROM auth_limits WHERE key=?").bind(key).first()).count > 5) return json({ error: "Trop de tentatives SMS. Réessayez dans 15 minutes." }, 429);
  const endpoint = new URL(provider.url);
  if (endpoint.protocol !== "https:") return json({ error: "Configuration SMS indisponible" }, 503);
  try {
    const response = await fetcher(new URL(`/auth/v1/${action === "phone-send" ? "otp" : "verify"}`, endpoint), {
      method: "POST", signal: AbortSignal.timeout(10000),
      headers: { apikey: provider.key, "Content-Type": "application/json" },
      body: JSON.stringify(action === "phone-send" ? { phone, create_user: true, channel: "sms" } : { phone, token: body.code, type: "sms" }),
    });
    const value = await response.json();
    if (!response.ok) return json({ error: response.status === 429 ? "Veuillez patienter avant de demander un nouveau SMS." : "Le SMS ou le code n’a pas pu être validé. Réessayez." }, response.status === 429 ? 429 : 400);
    if (action === "phone-send") return json({ sent: true });
    if (!value.user?.phone_confirmed_at || `+${String(value.user.phone).replace(/^\+/, "")}` !== phone) return json({ error: "Numéro non vérifié" }, 401);
    // Bridge verified Supabase identities into existing accounts without breaking their IDs.
    await db.prepare("INSERT INTO auth_users (id,login,password_hash,created_at) VALUES (?,?,?,?) ON CONFLICT(login) DO NOTHING").bind(randomUUID(), phone, await passwordHash(randomBytes(48).toString("hex")), now).run();
    const user = await db.prepare("SELECT id,login FROM auth_users WHERE login=?").bind(phone).first();
    return primaryAuthenticated(request, db, user);
  } catch { return json({ error: "Service SMS temporairement indisponible" }, 503); }
}
