import {
  createHash,
  randomBytes,
  randomUUID,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
import { TOTP, Secret } from "otpauth";
import QRCode from "qrcode";
import { authenticatedUser, passwordMatches, startSession } from "./auth.js";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const json = (data, status = 200, headers = {}) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
function key() {
  const value = process.env.MFA_ENCRYPTION_KEY || "";
  if (!/^[a-f0-9]{64}$/i.test(value))
    throw new Error(
      "MFA_ENCRYPTION_KEY must contain 32 random bytes encoded as hex",
    );
  return Buffer.from(value, "hex");
}
function encrypt(secret, userId) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(userId));
  const body = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body]
    .map((x) => x.toString("base64url"))
    .join(".");
}
function decrypt(value, userId) {
  const [iv, tag, body] = value
    .split(".")
    .map((x) => Buffer.from(x, "base64url"));
  const cipher = createDecipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(userId));
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(body), cipher.final()]).toString("utf8");
}
export const totpFor = (secret, label = "Compte") =>
  new TOTP({
    issuer: "YAVIYA",
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
function stepFor(row, token) {
  if (typeof token !== "string" || !/^\d{6}$/.test(token)) return null;
  const timestamp = Date.now(),
    delta = totpFor(decrypt(row.secret_cipher, row.user_id)).validate({
      token,
      window: 1,
      timestamp,
    });
  return delta === null ? null : Math.floor(timestamp / 30000) + delta;
}
const record = (db, id) =>
  db.prepare("SELECT * FROM auth_mfa WHERE user_id=?").bind(id).first();
function challengeCookie(request, token) {
  return `yaviya_mfa=${token}; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=${token ? 300 : 0}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
function challengeToken(request) {
  return (
    request.headers
      .get("cookie")
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("yaviya_mfa="))
      ?.slice(11) || ""
  );
}
async function challengeRow(request, db) {
  const token = challengeToken(request);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return db
    .prepare(
      "SELECT c.* FROM auth_mfa_challenges c JOIN auth_mfa m ON m.user_id=c.user_id AND m.generation=c.generation AND m.enabled=1 WHERE c.token_hash=? AND c.expires_at>? AND c.attempts<5",
    )
    .bind(hash(token), Date.now())
    .first();
}
// Shared by password and Google authentication. No full session before the factor.
export async function primaryAuthenticated(request, db, user) {
  const row = await record(db, user.id);
  if (!row?.enabled) return startSession(request, db, user);
  const token = randomBytes(32).toString("hex");
  await db
    .prepare("DELETE FROM auth_mfa_challenges WHERE expires_at<?")
    .bind(Date.now())
    .run();
  await db
    .prepare(
      "INSERT INTO auth_mfa_challenges (token_hash,user_id,generation,expires_at) VALUES (?,?,?,?)",
    )
    .bind(hash(token), user.id, row.generation, Date.now() + 300000)
    .run();
  const previous =
    request.headers
      .get("cookie")
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("yaviya_session="))
      ?.slice(15) || "";
  if (previous)
    await db
      .prepare("DELETE FROM auth_sessions WHERE token_hash=?")
      .bind(hash(previous))
      .run();
  const response = json({ requiresTwoFactor: true }, 200, {
    "Set-Cookie": challengeCookie(request, token),
  });
  response.headers.append(
    "Set-Cookie",
    `yaviya_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`,
  );
  return response;
}
async function limited(request, db, userId) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const keys = [hash(`mfa-user:${userId}`), hash(`mfa-ip:${ip}`)],
    now = Date.now();
  await db.batch(
    keys.map((k) =>
      db
        .prepare(
          "INSERT INTO auth_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN auth_limits.expires_at<? THEN 1 ELSE auth_limits.count+1 END, expires_at=CASE WHEN auth_limits.expires_at<? THEN excluded.expires_at ELSE auth_limits.expires_at END",
        )
        .bind(k, now + 900000, now, now),
    ),
  );
  for (const k of keys)
    if (
      (
        await db
          .prepare("SELECT count FROM auth_limits WHERE key=?")
          .bind(k)
          .first()
      ).count > 10
    )
      return false;
  return true;
}
async function consumeFactor(db, row, token) {
  const step = stepFor(row, token);
  if (step !== null) {
    const result = await db
      .prepare(
        "UPDATE auth_mfa SET last_step=? WHERE user_id=? AND generation=? AND enabled=1 AND last_step<? RETURNING user_id",
      )
      .bind(step, row.user_id, row.generation, step)
      .first();
    return !!result;
  }
  if (typeof token !== "string") return false;
  const normalized = token.replace(/[-\s]/g, "").toUpperCase();
  if (!/^[A-F0-9]{20}$/.test(normalized)) return false;
  return !!(await db
    .prepare(
      "DELETE FROM auth_mfa_recovery WHERE user_id=? AND code_hash=? AND EXISTS (SELECT 1 FROM auth_mfa WHERE user_id=? AND generation=? AND enabled=1) RETURNING user_id",
    )
    .bind(
      row.user_id,
      hash(`${row.user_id}:${normalized}`),
      row.user_id,
      row.generation,
    )
    .first());
}
function recoveryCodes() {
  return Array.from({ length: 8 }, () =>
    randomBytes(10).toString("hex").toUpperCase().match(/.{4}/g).join("-"),
  );
}
async function primaryProof(request, db, user, body) {
  if (user.login.startsWith("google:")) {
    return !!(await db
      .prepare(
        "SELECT 1 FROM auth_sessions WHERE token_hash=? AND user_id=? AND issued_at>? AND expires_at>?",
      )
      .bind(
        hash(
          request.headers
            .get("cookie")
            ?.split(";")
            .map((x) => x.trim())
            .find((x) => x.startsWith("yaviya_session="))
            ?.slice(15) || "",
        ),
        user.id,
        Date.now() - 300000,
        Date.now(),
      )
      .first());
  }
  const row = await db
    .prepare("SELECT password_hash FROM auth_users WHERE id=?")
    .bind(user.id)
    .first();
  return (
    typeof body.password === "string" &&
    body.password.length <= 128 &&
    (await passwordMatches(body.password, row.password_hash))
  );
}
export async function handleTwoFactor(request, db, action) {
  if (action === "mfa-challenge" && request.method === "GET")
    return json({ pending: !!(await challengeRow(request, db)) });
  const user = await authenticatedUser(request, db);
  if (action === "mfa-status" && request.method === "GET") {
    if (!user) return json({ error: "Connexion requise" }, 401);
    const row = await record(db, user.id);
    const count = await db
      .prepare(
        "SELECT COUNT(*) AS count FROM auth_mfa_recovery WHERE user_id=?",
      )
      .bind(user.id)
      .first();
    return json({
      enabled: !!row?.enabled,
      recoveryCodesRemaining: count.count,
      googleAccount: user.login.startsWith("google:"),
      available: /^[a-f0-9]{64}$/i.test(process.env.MFA_ENCRYPTION_KEY || ""),
    });
  }
  if (request.method !== "POST") return json({ error: "Méthode refusée" }, 405);
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return json({ error: "Origine refusée" }, 403);
  let body;
  try {
    body = await request.json();
    if (!body || typeof body !== "object") throw Error();
  } catch {
    return json({ error: "Formulaire invalide" }, 400);
  }
  if (action === "mfa-verify") {
    const challenge = await challengeRow(request, db);
    if (!challenge)
      return json(
        { error: "Connexion expirée. Recommencez avec votre identifiant." },
        401,
      );
    const attempt = await db
      .prepare(
        "UPDATE auth_mfa_challenges SET attempts=attempts+1 WHERE token_hash=? AND expires_at>? AND attempts<5 RETURNING token_hash",
      )
      .bind(challenge.token_hash, Date.now())
      .first();
    if (!attempt || !(await limited(request, db, challenge.user_id)))
      return json(
        { error: "Trop de tentatives. Réessayez dans 15 minutes." },
        429,
      );
    const row = await record(db, challenge.user_id);
    if (
      !row?.enabled ||
      row.generation !== challenge.generation ||
      !(await consumeFactor(db, row, body.code))
    )
      return json(
        {
          error:
            "Code incorrect ou déjà utilisé. Attendez un nouveau code ou utilisez un code de secours.",
        },
        401,
      );
    const used = await db
      .prepare(
        "DELETE FROM auth_mfa_challenges WHERE token_hash=? AND expires_at>? RETURNING user_id",
      )
      .bind(challenge.token_hash, Date.now())
      .first();
    if (!used) return json({ error: "Connexion expirée" }, 401);
    const account = await db
      .prepare("SELECT id,login FROM auth_users WHERE id=?")
      .bind(row.user_id)
      .first();
    const response = await startSession(request, db, account, row.generation);
    response.headers.append("Set-Cookie", challengeCookie(request, ""));
    return response;
  }
  if (!user) return json({ error: "Connexion requise" }, 401);
  if (
    !["mfa-setup", "mfa-enable", "mfa-disable", "mfa-recovery"].includes(action)
  )
    return json({ error: "Introuvable" }, 404);
  if (!(await limited(request, db, user.id)))
    return json(
      { error: "Trop de tentatives. Réessayez dans 15 minutes." },
      429,
    );
  if (!(await primaryProof(request, db, user, body)))
    return json(
      {
        error: user.login.startsWith("google:")
          ? "Reconnectez-vous avec Google puis réessayez dans les 5 minutes."
          : "Confirmez votre mot de passe.",
      },
      403,
    );
  let row = await record(db, user.id);
  if (action === "mfa-setup") {
    if (row?.enabled)
      return json({ error: "La double authentification est déjà active" }, 409);
    if (!/^[a-f0-9]{64}$/i.test(process.env.MFA_ENCRYPTION_KEY || ""))
      return json(
        { error: "Double authentification à configurer par l’hébergeur" },
        503,
      );
    const secret = new Secret({ size: 20 }).base32,
      generation = randomUUID(),
      uri = totpFor(
        secret,
        user.login.startsWith("google:")
          ? `Google ${user.id.slice(0, 8)}`
          : user.login,
      ).toString();
    const saved = await db
      .prepare(
        "INSERT INTO auth_mfa (user_id,generation,secret_cipher,pending_expires) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET generation=excluded.generation,secret_cipher=excluded.secret_cipher,pending_expires=excluded.pending_expires,last_step=-1 WHERE auth_mfa.enabled=0 RETURNING user_id",
      )
      .bind(user.id, generation, encrypt(secret, user.id), Date.now() + 600000)
      .first();
    if (!saved)
      return json({ error: "La double authentification est déjà active" }, 409);
    return json({
      secret,
      qrCode: await QRCode.toDataURL(uri, { width: 240, margin: 2 }),
      expiresIn: 600,
    });
  }
  if (action === "mfa-enable") {
    if (!row || row.enabled || row.pending_expires < Date.now())
      return json({ error: "Configuration expirée. Recommencez." }, 409);
    const step = stepFor(row, body.code);
    if (step === null) return json({ error: "Code incorrect" }, 400);
    // One winning activation only. Recovery creation and session revocation are atomic.
    const codes = recoveryCodes(),
      generation = randomUUID();
    const changed = await db.batch([
      db
        .prepare(
          "UPDATE auth_mfa SET enabled=1,last_step=?,generation=? WHERE user_id=? AND generation=? AND enabled=0 AND pending_expires>? RETURNING user_id",
        )
        .bind(step, generation, user.id, row.generation, Date.now()),
      ...codes.map((code) =>
        db
          .prepare(
            "INSERT INTO auth_mfa_recovery SELECT user_id,? FROM auth_mfa WHERE user_id=? AND generation=? AND enabled=1 AND last_step=? ON CONFLICT DO NOTHING",
          )
          .bind(
            hash(`${user.id}:${code.replaceAll("-", "")}`),
            user.id,
            generation,
            step,
          ),
      ),
      db
        .prepare(
          "DELETE FROM auth_sessions WHERE user_id=? AND EXISTS (SELECT 1 FROM auth_mfa WHERE user_id=? AND generation=?)",
        )
        .bind(user.id, user.id, generation),
      db
        .prepare(
          "DELETE FROM auth_mfa_challenges WHERE user_id=? AND EXISTS (SELECT 1 FROM auth_mfa WHERE user_id=? AND generation=?)",
        )
        .bind(user.id, user.id, generation),
    ]);
    if (!changed[0].results.length)
      return json(
        { error: "Configuration déjà modifiée. Reconnectez-vous." },
        409,
      );
    const response = await startSession(request, db, user, generation);
    const value = await response.json();
    return json(
      { ...value, recoveryCodes: codes, enabled: true },
      response.status,
      Object.fromEntries(response.headers),
    );
  }
  if (!row?.enabled || !(await consumeFactor(db, row, body.code)))
    return json({ error: "Code incorrect ou déjà utilisé" }, 401);
  const generation = randomUUID(),
    codes = action === "mfa-recovery" ? recoveryCodes() : [];
  const exists =
    "EXISTS (SELECT 1 FROM auth_mfa WHERE user_id=? AND generation=?)";
  const changed = await db.batch([
    db
      .prepare(
        "UPDATE auth_mfa SET generation=?,enabled=? WHERE user_id=? AND generation=? AND enabled=1 RETURNING user_id",
      )
      .bind(
        generation,
        action === "mfa-disable" ? 0 : 1,
        user.id,
        row.generation,
      ),
    db
      .prepare(`DELETE FROM auth_mfa_recovery WHERE user_id=? AND ${exists}`)
      .bind(user.id, user.id, generation),
    ...codes.map((code) =>
      db
        .prepare(
          "INSERT INTO auth_mfa_recovery SELECT user_id,? FROM auth_mfa WHERE user_id=? AND generation=?",
        )
        .bind(
          hash(`${user.id}:${code.replaceAll("-", "")}`),
          user.id,
          generation,
        ),
    ),
    db
      .prepare(`DELETE FROM auth_sessions WHERE user_id=? AND ${exists}`)
      .bind(user.id, user.id, generation),
    db
      .prepare(`DELETE FROM auth_mfa_challenges WHERE user_id=? AND ${exists}`)
      .bind(user.id, user.id, generation),
    ...(action === "mfa-disable"
      ? [
          db
            .prepare("DELETE FROM auth_mfa WHERE user_id=? AND generation=?")
            .bind(user.id, generation),
        ]
      : []),
  ]);
  if (!changed[0].results.length)
    return json(
      { error: "La sécurité du compte a changé. Reconnectez-vous." },
      409,
    );
  const response = await startSession(
    request,
    db,
    user,
    action === "mfa-disable" ? null : generation,
  );
  const value = await response.json();
  return json(
    {
      ...value,
      ...(codes.length ? { recoveryCodes: codes } : {}),
      enabled: action !== "mfa-disable",
    },
    response.status,
    Object.fromEntries(response.headers),
  );
}
