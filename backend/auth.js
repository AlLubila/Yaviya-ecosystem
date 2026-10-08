import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
const digest = (value) => createHash("sha256").update(value).digest("hex");
const json = (data, status = 200, headers = {}) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
export const normalizeLogin = (value) =>
  typeof value === "string"
    ? value.trim().toLowerCase().replace(/\s/g, "")
    : "";

export async function passwordHash(
  password,
  salt = randomBytes(16).toString("hex"),
) {
  const hash = await scrypt(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `${salt}:${hash.toString("hex")}`;
}
export async function passwordMatches(password, encoded) {
  const computed = await passwordHash(password, encoded.split(":")[0]);
  const a = Buffer.from(computed),
    b = Buffer.from(encoded);
  return a.length === b.length && timingSafeEqual(a, b);
}
function sessionToken(request) {
  return (
    request.headers
      .get("cookie")
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("yaviya_session="))
      ?.slice(15) || ""
  );
}
export async function authenticatedUser(request, db) {
  const token = sessionToken(request);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return db
    .prepare(
      "SELECT u.id,u.login FROM auth_sessions s JOIN auth_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND NOT EXISTS (SELECT 1 FROM auth_mfa m WHERE m.user_id=u.id AND m.enabled=1 AND (s.mfa_generation IS NULL OR s.mfa_generation<>m.generation))",
    )
    .bind(digest(token), Date.now())
    .first();
}
function cookie(request, token, maxAge) {
  return `yaviya_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
export async function startSession(request, db, user, mfaGeneration = null) {
  const token = randomBytes(32).toString("hex"),
    maxAge = 7 * 24 * 3600;
  const inserted = await db
    .prepare(
      "INSERT INTO auth_sessions (token_hash,user_id,expires_at,issued_at,mfa_generation) SELECT ?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM auth_mfa WHERE user_id=? AND enabled=1 AND (generation<>? OR CAST(? AS TEXT) IS NULL)) RETURNING token_hash",
    )
    .bind(
      digest(token),
      user.id,
      Date.now() + maxAge * 1000,
      Date.now(),
      mfaGeneration,
      user.id,
      mfaGeneration,
      mfaGeneration,
    )
    .first();
  if (!inserted)
    return json(
      { error: "La sécurité du compte a changé. Reconnectez-vous." },
      401,
    );
  return json({ user: { id: user.id, login: user.login } }, 200, {
    "Set-Cookie": cookie(request, token, maxAge),
  });
}

export async function handleAuth(request, db) {
  const action = new URL(request.url).pathname.split("/").at(-1);
  if (action.startsWith("mfa-")) {
    const { handleTwoFactor } = await import("./two-factor.js");
    return handleTwoFactor(request, db, action);
  }
  if (action === "google" || action === "google-callback") {
    const { googleAuth } = await import("./google-auth.js");
    return googleAuth(request, db);
  }
  if (action === "session" && request.method === "GET")
    return json({ user: await authenticatedUser(request, db) });
  if (request.method !== "POST")
    return json({ error: "Méthode non autorisée" }, 405);
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return json({ error: "Origine refusée" }, 403);
  if (action === "logout") {
    await db
      .prepare("DELETE FROM auth_sessions WHERE token_hash=?")
      .bind(digest(sessionToken(request)))
      .run();
    const challenge =
      request.headers
        .get("cookie")
        ?.split(";")
        .map((x) => x.trim())
        .find((x) => x.startsWith("yaviya_mfa="))
        ?.slice(11) || "";
    await db
      .prepare("DELETE FROM auth_mfa_challenges WHERE token_hash=?")
      .bind(digest(challenge))
      .run();
    const response = json({ ok: true }, 200, {
      "Set-Cookie": cookie(request, "", 0),
    });
    response.headers.append(
      "Set-Cookie",
      `yaviya_mfa=; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=0${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`,
    );
    return response;
  }
  if (!["login", "signup"].includes(action))
    return json({ error: "Introuvable" }, 404);
  let body;
  try {
    body = await request.json();
    if (!body || typeof body !== "object") throw new Error("Invalid form");
  } catch {
    return json({ error: "Formulaire invalide" }, 400);
  }
  const login = normalizeLogin(body.login),
    password = body.password;
  if (
    !login ||
    login.length > 150 ||
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128 ||
    !(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login) || /^\+?[0-9]{7,15}$/.test(login)
    )
  )
    return json(
      {
        error:
          "E-mail ou téléphone valide et mot de passe de 12 à 128 caractères requis",
      },
      400,
    );
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const keys = [digest(`ip:${ip}`), digest(`login:${login}`)];
  const until = Date.now() + 15 * 60 * 1000;
  await db.batch(
    keys.map((key) =>
      db
        .prepare(
          "INSERT INTO auth_limits (key,count,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN auth_limits.expires_at<? THEN 1 ELSE auth_limits.count+1 END,expires_at=CASE WHEN auth_limits.expires_at<? THEN excluded.expires_at ELSE auth_limits.expires_at END",
        )
        .bind(key, until, Date.now(), Date.now()),
    ),
  );
  for (const key of keys)
    if (
      (
        await db
          .prepare("SELECT count FROM auth_limits WHERE key=?")
          .bind(key)
          .first()
      ).count > 10
    )
      return json(
        { error: "Trop de tentatives. Réessayez dans 15 minutes." },
        429,
      );
  let user = await db
    .prepare("SELECT id,login,password_hash FROM auth_users WHERE login=?")
    .bind(login)
    .first();
  if (action === "signup") {
    if (user)
      return json(
        { error: "Impossible de créer ce compte. Essayez de vous connecter." },
        409,
      );
    user = { id: randomUUID(), login };
    try {
      await db
        .prepare(
          "INSERT INTO auth_users (id,login,password_hash,created_at) VALUES (?,?,?,?)",
        )
        .bind(user.id, login, await passwordHash(password), Date.now())
        .run();
    } catch {
      return json(
        { error: "Impossible de créer ce compte. Essayez de vous connecter." },
        409,
      );
    }
  } else {
    // Hash even when the account does not exist, to keep failed logins comparable.
    const encoded =
      user?.password_hash ||
      `00000000000000000000000000000000:${"0".repeat(128)}`;
    if (!(await passwordMatches(password, encoded)) || !user)
      return json({ error: "Identifiant ou mot de passe incorrect" }, 401);
  }
  const { primaryAuthenticated } = await import("./two-factor.js");
  return primaryAuthenticated(request, db, user);
}
