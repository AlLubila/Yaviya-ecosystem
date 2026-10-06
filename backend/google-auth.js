import { randomBytes, createHash, randomUUID } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { passwordHash } from "./auth.js";
const hash = (s) => createHash("sha256").update(s).digest("hex");
const keys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
export async function googleAuth(
  request,
  db,
  config = process.env,
  fetcher = fetch,
  verifyToken = jwtVerify,
) {
  const url = new URL(request.url),
    client = config.GOOGLE_CLIENT_ID,
    secret = config.GOOGLE_CLIENT_SECRET;
  if (request.method !== "GET")
    return Response.json({ error: "Méthode refusée" }, { status: 405 });
  if (!client || !secret || !config.GOOGLE_REDIRECT_URI)
    return Response.json(
      {
        error: "Connexion Google à configurer. Utilisez le formulaire YAVIYA.",
      },
      { status: 503 },
    );
  const callback = new URL(config.GOOGLE_REDIRECT_URI);
  if (
    callback.origin !== url.origin ||
    callback.pathname !== "/api/auth/google-callback"
  )
    return Response.json(
      { error: "Domaine Google incorrect" },
      { status: 503 },
    );
  const secure = url.protocol === "https:" ? "; Secure" : "";
  const stateCookie = (value) =>
    `yaviya_google_state=${value}; HttpOnly; SameSite=Lax; Path=/api/auth; Max-Age=${value ? 600 : 0}${secure}`;
  if (url.pathname.endsWith("/google")) {
    const state = randomBytes(32).toString("hex"),
      verifier = randomBytes(32).toString("base64url"),
      nonce = randomBytes(32).toString("hex");
    const requested = url.searchParams.get("return") || "/";
    const returnPath = ["/", "/index.html", "/congo.html"].includes(
      requested.split("?")[0],
    )
      ? requested
      : "/";
    await db
      .prepare("DELETE FROM google_states WHERE expires_at<?")
      .bind(Date.now())
      .run();
    await db
      .prepare("INSERT INTO google_states VALUES (?,?,?,?,?)")
      .bind(hash(state), verifier, nonce, returnPath, Date.now() + 600000)
      .run();
    const target = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    target.search = new URLSearchParams({
      client_id: client,
      redirect_uri: callback.href,
      response_type: "code",
      scope: "openid email profile",
      state,
      nonce,
      code_challenge: createHash("sha256").update(verifier).digest("base64url"),
      code_challenge_method: "S256",
    }).toString();
    return new Response(null, {
      status: 302,
      headers: {
        Location: target.href,
        "Set-Cookie": stateCookie(state),
        "Cache-Control": "no-store",
      },
    });
  }
  const state = url.searchParams.get("state") || "",
    storedCookie = request.headers
      .get("cookie")
      ?.split(";")
      .map((x) => x.trim())
      .find((x) => x.startsWith("yaviya_google_state="))
      ?.split("=")[1];
  if (!/^[a-f0-9]{64}$/.test(state) || state !== storedCookie)
    return Response.json(
      { error: "Connexion Google expirée. Réessayez." },
      { status: 400 },
    );
  const result = await db
    .prepare(
      "DELETE FROM google_states WHERE state_hash=? AND expires_at>? RETURNING *",
    )
    .bind(hash(state), Date.now())
    .first();
  if (!result || !url.searchParams.get("code"))
    return Response.json(
      { error: "Connexion Google annulée ou expirée" },
      { status: 400 },
    );
  const response = await fetcher("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: client,
      client_secret: secret,
      redirect_uri: callback.href,
      grant_type: "authorization_code",
      code: url.searchParams.get("code"),
      code_verifier: result.verifier,
    }),
  });
  const token = await response.json();
  if (!response.ok || !token.id_token)
    return Response.json(
      { error: "Connexion Google refusée" },
      { status: 401 },
    );
  const { payload } = await verifyToken(token.id_token, keys, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: client,
  });
  if (
    payload.nonce !== result.nonce ||
    !payload.sub ||
    !payload.email ||
    payload.email_verified !== true
  )
    return Response.json(
      { error: "Compte Google non vérifié" },
      { status: 401 },
    );
  let identity = await db
    .prepare("SELECT user_id FROM google_identities WHERE subject=?")
    .bind(payload.sub)
    .first();
  let user;
  if (identity)
    user = await db
      .prepare("SELECT id,login FROM auth_users WHERE id=?")
      .bind(identity.user_id)
      .first();
  else {
    // Never link by email: a password account may have an unverified email.
    user = { id: randomUUID(), login: "google:" + payload.sub };
    await db.batch([
      db
        .prepare(
          "INSERT INTO auth_users (id,login,password_hash,created_at) VALUES (?,?,?,?)",
        )
        .bind(
          user.id,
          user.login,
          await passwordHash(randomBytes(32).toString("hex")),
          Date.now(),
        ),
      db
        .prepare("INSERT INTO google_identities VALUES (?,?)")
        .bind(payload.sub, user.id),
    ]);
  }
  const { primaryAuthenticated } = await import("./two-factor.js");
  const session = await primaryAuthenticated(request, db, user);
  const authentication = await session.clone().json();
  const headers = new Headers(session.headers);
  headers.set(
    "Location",
    authentication.requiresTwoFactor
      ? result.return_path +
          (result.return_path.includes("?") ? "&" : "?") +
          "mfa=1"
      : result.return_path,
  );
  if (session.status !== 200) return session;
  headers.append("Set-Cookie", stateCookie(""));
  return new Response(null, { status: 302, headers });
}
