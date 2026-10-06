import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import { Secret, TOTP } from "otpauth";
import { createDatabase } from "../backend/database.js";
import { createApplication } from "../backend/application.js";
import { migrate } from "../scripts/migrate.mjs";
import { primaryAuthenticated } from "../backend/two-factor.js";
import { googleAuth } from "../backend/google-auth.js";
import { startSession } from "../backend/auth.js";
process.env.MFA_ENCRYPTION_KEY = randomBytes(32).toString("hex");
const password = "test-password-two-factor-2026";
const cookie = (response) =>
  response.headers
    .getSetCookie()
    .map((x) => x.split(";")[0])
    .join("; ");
async function fixture() {
  const db = await createDatabase({ SQLITE_PATH: ":memory:" });
  await migrate(db);
  const app = createApplication(db);
  const call = (action, session = "", body, origin = "https://yaviya.test") =>
    app(
      new Request(`https://yaviya.test/api/auth/${action}`, {
        method: body ? "POST" : "GET",
        headers: {
          Cookie: session,
          Origin: origin,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  const signup = await call("signup", "", {
    login: "mfa@example.test",
    password,
  });
  assert.equal(signup.status, 200);
  const user = (await signup.json()).user,
    session = cookie(signup);
  const setup = async () => {
    const response = await call("mfa-setup", session, { password });
    assert.equal(response.status, 200, await response.clone().text());
    return response.json();
  };
  const enable = async () => {
    const configuration = await setup();
    const activationCode = new TOTP({
      secret: configuration.secret,
    }).generate();
    const response = await call("mfa-enable", session, {
      password,
      code: activationCode,
    });
    assert.equal(response.status, 200, await response.clone().text());
    return {
      ...(await response.json()),
      session: cookie(response),
      activationCode,
      ...configuration,
    };
  };
  const login = () => call("login", "", { login: user.login, password });
  return { db, call, user, session, setup, enable, login };
}
test("TOTP library agrees with RFC 6238 SHA1 vectors", () => {
  const generator = new TOTP({
    secret: Secret.fromUTF8("12345678901234567890"),
    digits: 8,
  });
  for (const [seconds, expected] of [
    [59, "94287082"],
    [1111111109, "07081804"],
    [1111111111, "14050471"],
    [1234567890, "89005924"],
    [2000000000, "69279037"],
    [20000000000, "65353130"],
  ])
    assert.equal(generator.generate({ timestamp: seconds * 1000 }), expected);
});
test("enrollment requires session, same origin, password and verified code; encrypted storage and session rotation", async () => {
  const f = await fixture();
  try {
    assert.equal((await f.call("mfa-setup", "", { password })).status, 401);
    assert.equal(
      (await f.call("mfa-setup", f.session, { password }, "https://evil.test"))
        .status,
      403,
    );
    assert.equal(
      (await f.call("mfa-setup", f.session, { password: "wrong" })).status,
      403,
    );
    const config = await f.setup();
    assert.match(config.qrCode, /^data:image\/png;base64,/);
    const stored = await f.db.prepare("SELECT * FROM auth_mfa").first();
    assert.equal(stored.enabled, 0);
    assert.ok(!stored.secret_cipher.includes(config.secret));
    assert.equal(
      (await f.call("mfa-enable", f.session, { password, code: "invalid" }))
        .status,
      400,
    );
    assert.equal((await f.call("mfa-status", f.session)).status, 200);
    const response = await f.call("mfa-enable", f.session, {
      password,
      code: new TOTP({ secret: config.secret }).generate(),
    });
    assert.equal(response.status, 200);
    const value = await response.json();
    assert.equal(value.recoveryCodes.length, 8);
    const hashes = (
      await f.db.prepare("SELECT code_hash FROM auth_mfa_recovery").all()
    ).results;
    assert.equal(hashes.length, 8);
    assert.ok(hashes.every((x) => /^[a-f0-9]{64}$/.test(x.code_hash)));
    assert.ok(
      !JSON.stringify(hashes).includes(
        value.recoveryCodes[0].replaceAll("-", ""),
      ),
    );
    assert.equal(
      (await (await f.call("session", f.session)).json()).user,
      null,
    );
    assert.equal(
      (await (await f.call("session", cookie(response))).json()).user.id,
      f.user.id,
    );
    assert.equal(
      (await f.call("mfa-setup", cookie(response), { password })).status,
      409,
    );
  } finally {
    f.db.close();
  }
});
test("password and Google primary authentication cannot create a full session until MFA; replay resistance", async () => {
  const f = await fixture();
  try {
    const enabled = await f.enable();
    const login = await f.login();
    assert.deepEqual(await login.json(), { requiresTwoFactor: true });
    assert.match(login.headers.get("set-cookie"), /HttpOnly; SameSite=Lax/);
    assert.match(login.headers.get("set-cookie"), /Secure/);
    const challenge = cookie(login);
    assert.equal(
      (await (await f.call("session", challenge)).json()).user,
      null,
    );
    assert.equal(
      (await f.call("mfa-verify", challenge, { code: "incorrect" })).status,
      401,
    );
    // The code used to activate cannot be reused to sign in.
    assert.equal(
      (await f.call("mfa-verify", challenge, { code: enabled.activationCode }))
        .status,
      401,
    );
    const nextCode = new TOTP({ secret: enabled.secret }).generate({
      timestamp: Date.now() + 30000,
    });
    const accepted = await f.call("mfa-verify", challenge, { code: nextCode });
    assert.equal(accepted.status, 200, await accepted.clone().text());
    assert.equal(
      (await (await f.call("session", cookie(accepted))).json()).user.id,
      f.user.id,
    );
    assert.equal(
      (await f.call("mfa-verify", challenge, { code: nextCode })).status,
      401,
    );
    const request = new Request("https://yaviya.test/api/auth/google-callback");
    assert.equal((await startSession(request, f.db, f.user)).status, 401);
    const google = await primaryAuthenticated(request, f.db, f.user);
    assert.deepEqual(await google.json(), { requiresTwoFactor: true });
    const replay = await f.call("mfa-verify", cookie(google), {
      code: nextCode,
    });
    assert.equal(replay.status, 401);
  } finally {
    f.db.close();
  }
});
test("single-use recovery codes, concurrent attempts, regeneration, disable and account isolation", async () => {
  const f = await fixture();
  try {
    const enabled = await f.enable(),
      login = await f.login(),
      challenge = cookie(login);
    const bob = await f.call("signup", "", {
      login: "other@example.test",
      password,
    });
    assert.equal(
      (await (await f.call("mfa-status", cookie(bob))).json()).enabled,
      false,
    );
    assert.equal(
      (
        await f.call("mfa-disable", cookie(bob), {
          password,
          code: enabled.recoveryCodes[0],
          userId: f.user.id,
        })
      ).status,
      401,
    );
    const responses = await Promise.all([
      f.call("mfa-verify", challenge, { code: enabled.recoveryCodes[0] }),
      f.call("mfa-verify", challenge, { code: enabled.recoveryCodes[0] }),
    ]);
    assert.deepEqual(responses.map((x) => x.status).sort(), [200, 401]);
    const authenticated = cookie(responses.find((x) => x.status === 200));
    const second = cookie(await f.login());
    assert.equal(
      (await f.call("mfa-verify", second, { code: enabled.recoveryCodes[0] }))
        .status,
      401,
    );
    assert.equal(
      (await f.call("mfa-disable", authenticated, { password, code: "bad" }))
        .status,
      401,
    );
    const regen = await f.call("mfa-recovery", authenticated, {
      password,
      code: enabled.recoveryCodes[1],
    });
    assert.equal(regen.status, 200, await regen.clone().text());
    const newCodes = (await regen.json()).recoveryCodes;
    assert.equal(
      (await (await f.call("session", authenticated)).json()).user,
      null,
    );
    assert.equal(
      (await f.call("mfa-verify", second, { code: enabled.recoveryCodes[2] }))
        .status,
      401,
    );
    const disable = await f.call("mfa-disable", cookie(regen), {
      password,
      code: newCodes[0],
    });
    assert.equal(disable.status, 200, await disable.clone().text());
    assert.equal(
      (await (await f.call("mfa-status", cookie(disable))).json()).enabled,
      false,
    );
    assert.equal(
      (
        await f.db
          .prepare("SELECT COUNT(*) AS n FROM auth_mfa_recovery")
          .first()
      ).n,
      0,
    );
    assert.ok((await (await f.login()).json()).user);
  } finally {
    f.db.close();
  }
});
test("challenge expiration, attempt limit, session spoofing and user-wide throttling", async () => {
  const f = await fixture();
  try {
    const enabled = await f.enable(),
      expired = await f.login();
    await f.db.prepare("UPDATE auth_mfa_challenges SET expires_at=0").run();
    assert.equal(
      (
        await f.call("mfa-verify", cookie(expired), {
          code: enabled.recoveryCodes[0],
        })
      ).status,
      401,
    );
    const login = await f.login(),
      challenge = cookie(login);
    for (let n = 0; n < 5; n++)
      assert.equal(
        (await f.call("mfa-verify", challenge, { code: "wrong" })).status,
        401,
      );
    assert.equal(
      (
        await f.call("mfa-verify", challenge, {
          code: enabled.recoveryCodes[0],
        })
      ).status,
      401,
    );
    const newChallenge = cookie(await f.login());
    for (let n = 0; n < 3; n++)
      assert.equal(
        (await f.call("mfa-verify", newChallenge, { code: "wrong" })).status,
        401,
      );
    assert.equal(
      (
        await f.call("mfa-verify", newChallenge, {
          code: enabled.recoveryCodes[0],
        })
      ).status,
      429,
    );
    assert.equal(
      (
        await f.db
          .prepare("SELECT COUNT(*) AS n FROM auth_mfa_recovery")
          .first()
      ).n,
      8,
    );
  } finally {
    f.db.close();
  }
});
test("enrollment expiration and missing encryption configuration fail safely", async () => {
  const f = await fixture();
  try {
    const setup = await f.setup();
    await f.db.prepare("UPDATE auth_mfa SET pending_expires=0").run();
    assert.equal(
      (
        await f.call("mfa-enable", f.session, {
          password,
          code: new TOTP({ secret: setup.secret }).generate(),
        })
      ).status,
      409,
    );
    const key = process.env.MFA_ENCRYPTION_KEY;
    delete process.env.MFA_ENCRYPTION_KEY;
    try {
      assert.equal(
        (await f.call("mfa-setup", f.session, { password })).status,
        503,
      );
    } finally {
      process.env.MFA_ENCRYPTION_KEY = key;
    }
  } finally {
    f.db.close();
  }
});

test("Google callback redirects to the factor challenge and recent Google proof protects settings", async () => {
  const f = await fixture();
  try {
    const enabled = await f.enable();
    await f.db
      .prepare("UPDATE auth_users SET login=? WHERE id=?")
      .bind("google:subject-test", f.user.id)
      .run();
    await f.db
      .prepare("INSERT INTO google_identities VALUES (?,?)")
      .bind("subject-test", f.user.id)
      .run();
    const state = randomBytes(32).toString("hex"),
      hash = createHash("sha256").update(state).digest("hex");
    await f.db
      .prepare("INSERT INTO google_states VALUES (?,?,?,?,?)")
      .bind(
        hash,
        "verifier-test",
        "nonce-test",
        "/congo.html?security=1",
        Date.now() + 600000,
      )
      .run();
    const config = {
      GOOGLE_CLIENT_ID: "client-test",
      GOOGLE_CLIENT_SECRET: "secret-test",
      GOOGLE_REDIRECT_URI: "https://yaviya.test/api/auth/google-callback",
    };
    const response = await googleAuth(
      new Request(
        `https://yaviya.test/api/auth/google-callback?state=${state}&code=code-test`,
        { headers: { Cookie: `yaviya_google_state=${state}` } },
      ),
      f.db,
      config,
      async (url, options) => {
        assert.equal(url, "https://oauth2.googleapis.com/token");
        assert.equal(options.body.get("code_verifier"), "verifier-test");
        return Response.json({ id_token: "token-test" });
      },
      async (token, keys, options) => {
        assert.equal(token, "token-test");
        assert.equal(options.audience, "client-test");
        return {
          payload: {
            sub: "subject-test",
            email: "google@example.test",
            email_verified: true,
            nonce: "nonce-test",
          },
        };
      },
    );
    assert.equal(response.status, 302);
    assert.equal(
      response.headers.get("Location"),
      "/congo.html?security=1&mfa=1",
    );
    const challenge = cookie(response);
    assert.equal(
      (await (await f.call("session", challenge)).json()).user,
      null,
    );
    const verified = await f.call("mfa-verify", challenge, {
      code: enabled.recoveryCodes[0],
    });
    assert.equal(verified.status, 200);
    const session = cookie(verified);
    await f.db.prepare("UPDATE auth_sessions SET issued_at=0").run();
    assert.equal(
      (
        await f.call("mfa-recovery", session, {
          code: enabled.recoveryCodes[1],
        })
      ).status,
      403,
    );
    await f.db
      .prepare("UPDATE auth_sessions SET issued_at=?")
      .bind(Date.now())
      .run();
    assert.equal(
      (
        await f.call("mfa-recovery", session, {
          code: enabled.recoveryCodes[1],
        })
      ).status,
      200,
    );
  } finally {
    f.db.close();
  }
});
test("logout cancels an unfinished second-factor connection", async () => {
  const f = await fixture();
  try {
    const enabled = await f.enable(),
      challenge = cookie(await f.login());
    const logout = await f.call("logout", challenge, {});
    assert.equal(logout.status, 200);
    assert.equal(
      (
        await f.call("mfa-verify", challenge, {
          code: enabled.recoveryCodes[0],
        })
      ).status,
      401,
    );
  } finally {
    f.db.close();
  }
});
