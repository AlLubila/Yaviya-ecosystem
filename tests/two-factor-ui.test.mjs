import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { JSDOM } from "jsdom";
import { TOTP } from "otpauth";
import { createDatabase } from "../backend/database.js";
import { createApplication } from "../backend/application.js";
import { migrate } from "../scripts/migrate.mjs";
process.env.MFA_ENCRYPTION_KEY = randomBytes(32).toString("hex");
const password = "Frontend-test-password-2026!";
async function waitFor(check) {
  for (let n = 0; n < 150; n++) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("UI action did not complete");
}
test("frontend enrollment, recovery download screen and second-factor sign-in use the real API", async () => {
  const db = await createDatabase({ SQLITE_PATH: ":memory:" });
  await migrate(db);
  const app = createApplication(db);
  const dom = new JSDOM(
    '<html lang="fr"><body><header></header></body></html>',
    { url: "https://yaviya.test/", runScripts: "outside-only" },
  );
  const w = dom.window,
    jar = new Map();
  w.Request = Request;
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new w.Event("close"));
  };
  w.HTMLFormElement.prototype.reportValidity = function () {
    return true;
  };
  w.fetch = async (input, options) => {
    const original = new Request(
      input instanceof Request ? input : new URL(input, w.location.href),
      options,
    );
    const headers = new Headers(original.headers);
    headers.set("Cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
    if (original.method !== "GET") headers.set("Origin", w.location.origin);
    const response = await app(new Request(original, { headers }));
    for (const entry of response.headers.getSetCookie()) {
      const [k, ...rest] = entry.split(";")[0].split("=");
      const v = rest.join("=");
      if (v) jar.set(k, v);
      else jar.delete(k);
    }
    return response;
  };
  try {
    await w.fetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ login: "frontend@example.test", password }),
    });
    w.eval(await readFile("frontend/src/auth-independent.js", "utf8"));
    w.eval(await readFile("frontend/src/two-factor-settings.js", "utf8"));
    await w.showYaviyaSecurity();
    let form = w.document.querySelector(".mfa-settings form");
    assert.ok(form);
    form.querySelector('[name="password"]').value = password;
    form.dispatchEvent(new w.Event("submit", { cancelable: true }));
    await waitFor(() => w.document.querySelector(".mfa-secret"));
    const secret = w.document.querySelector(".mfa-secret").value;
    assert.match(secret, /^[A-Z2-7]+$/);
    assert.match(
      w.document.querySelector(".mfa-qr").src,
      /^data:image\/png;base64,/,
    );
    form.querySelector('[name="code"]').value = new TOTP({ secret }).generate();
    form.dispatchEvent(new w.Event("submit", { cancelable: true }));
    await waitFor(() => w.document.querySelector(".mfa-codes"));
    const codes = w.document
      .querySelector(".mfa-codes")
      .textContent.split("\n");
    assert.equal(codes.length, 8);
    assert.ok(w.document.querySelector(".mfa-download"));
    w.document.querySelector(".mfa-done").click();
    assert.equal(w.document.querySelector("dialog"), null);
    await w.yaviyaAuthRequest("logout", {});
    const pending = w.ensureYaviyaSignedIn();
    await waitFor(() =>
      w.document.querySelector('.independent-auth [name="login"]'),
    );
    form = w.document.querySelector("dialog form");
    form.querySelector('[name="login"]').value = "frontend@example.test";
    form.querySelector('[name="password"]').value = password;
    form.dispatchEvent(new w.Event("submit", { cancelable: true }));
    await waitFor(() => w.document.querySelector('dialog [name="code"]'));
    assert.equal(jar.has("yaviya_session"), false);
    form.querySelector('[name="code"]').value = "incorrect";
    form.dispatchEvent(new w.Event("submit", { cancelable: true }));
    await waitFor(() => w.document.querySelector(".auth-error")?.textContent);
    assert.equal(jar.has("yaviya_session"), false);
    assert.ok(w.document.querySelector("dialog"));
    form.querySelector('[name="code"]').value = codes[0];
    form.dispatchEvent(new w.Event("submit", { cancelable: true }));
    const user = await pending;
    assert.equal(user.login, "frontend@example.test");
    assert.ok(jar.has("yaviya_session"));
    assert.equal(w.document.querySelector("dialog"), null);
    const state = await w.yaviyaAuthRequest("mfa-status");
    assert.equal(state.enabled, true);
    assert.equal(state.recoveryCodesRemaining, 7);
  } finally {
    w.close();
    db.close();
  }
});
