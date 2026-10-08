import test from "node:test";
import assert from "node:assert/strict";
import { sensitiveRateLimit } from "../backend/rate-limit.js";
import { handlePhoneAuth } from "../backend/phone-auth.js";
import { createApplication } from "../backend/application.js";
const request = (path, body = {}) => new Request(`https://yaviya.test/api/auth/${path}`, { method: "POST", headers: { Origin: "https://yaviya.test", "Content-Type": "application/json" }, body: JSON.stringify(body) });
test("distributed limiter rejects excess traffic and fails closed when configured provider is unavailable", async () => {
  const config = { UPSTASH_REDIS_REST_URL: "https://redis.test", UPSTASH_REDIS_REST_TOKEN: "test-only" };
  assert.equal(await sensitiveRateLimit(request("login"), {}, async () => { throw Error(); }), null);
  assert.equal((await sensitiveRateLimit(request("login"), config, async () => Response.json({ result: 21 }))).status, 429);
  assert.equal((await sensitiveRateLimit(request("login"), config, async () => { throw Error(); })).status, 503);
});
test("SMS never authenticates without a configured provider or a confirmed matching phone", async () => {
  assert.equal((await handlePhoneAuth(request("phone-send"), {}, "phone-send", {})).status, 503);
  const config = { SUPABASE_URL: "https://supabase.test", SUPABASE_ANON_KEY: "test-only" };
  const db = { batch: async () => [], prepare: () => ({ bind() { return this; }, first: async () => ({ count: 1 }) }) };
  assert.equal((await handlePhoneAuth(request("phone-verify", { phone: "+243999999999", code: "123456" }), db, "phone-verify", config, async () => Response.json({ user: { phone: "242999999999", phone_confirmed_at: "today" } }))).status, 401);
});
test("production administrator cannot access business API without enrolling MFA", async () => {
  let calls = 0;
  const db = { dialect: "postgres", prepare: () => ({ bind() { return this; }, first: async () => (++calls === 1 ? { id: "admin", login: "test@example.invalid" } : calls === 2 ? { user_id: "admin" } : null) }) };
  const app = createApplication(db);
  const response = await app(new Request("https://yaviya.test/api/marketplace?view=admin", { headers: { Cookie: `yaviya_session=${"a".repeat(64)}` } }));
  assert.equal(response.status, 403);
  assert.equal((await response.json()).code, "ADMIN_MFA_REQUIRED");
});

test("phone selection offers the correct country prefix and switches back to email", async () => {
  const { JSDOM } = await import("jsdom");
  const { readFile } = await import("node:fs/promises");
  for (const [country, prefix] of [["CD", "+243"], ["CG", "+242"]]) {
    const dom = new JSDOM('<html lang="fr"><body></body></html>', { url: "https://yaviya.test", runScripts: "outside-only" });
    const w = dom.window;
    w.YAVIYA_COUNTRY = country;
    w.fetch = async () => Response.json({ user: null, pending: false });
    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event("close")); };
    w.eval(await readFile("frontend/src/auth-independent.js", "utf8"));
    const pending = w.ensureYaviyaSignedIn().catch(() => {});
    for (let n=0; n<30 && !w.document.querySelector('dialog'); n++) await new Promise(resolve => setTimeout(resolve, 10));
    const method = w.document.querySelector('[name="loginMethod"]');
    method.value = "phone"; method.dispatchEvent(new w.Event("change"));
    assert.equal(w.document.querySelector('[name="login"]').value, prefix);
    assert.equal(w.document.querySelector('.auth-country').hidden, false);
    method.value = "email"; method.dispatchEvent(new w.Event("change"));
    assert.equal(w.document.querySelector('[name="login"]').type, "email");
    assert.equal(w.document.querySelector('.auth-country').hidden, true);
    w.document.querySelector('.close').click(); await pending; dom.window.close();
  }
});

test("Supabase JWT bridge rejects unconfirmed identities and invalid bearer tokens", async () => {
  const { supabaseIdentity } = await import("../backend/supabase-auth.js");
  const req = new Request("https://yaviya.test", { headers: { Authorization: "Bearer a.b.c" } });
  const config = { SUPABASE_URL: "https://supabase.test", SUPABASE_ANON_KEY: "test-only" };
  const id = "12345678-1234-1234-1234-123456789012";
  assert.equal(await supabaseIdentity(req, config, async () => Response.json({ id, email: "someone@example.invalid" })), null);
  assert.equal(await supabaseIdentity(req, config, async () => Response.json({}, { status: 401 })), null);
  assert.deepEqual(await supabaseIdentity(req, config, async () => Response.json({ id, email: "someone@example.invalid", email_confirmed_at: "today" })), { id, login: "someone@example.invalid" });
});
