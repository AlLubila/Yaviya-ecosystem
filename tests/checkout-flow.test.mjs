import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { randomUUID } from "node:crypto";
import { JSDOM } from "jsdom";
import { createDatabase } from "../backend/database.js";
import { createApplication } from "../backend/application.js";
import { migrate } from "../scripts/migrate.mjs";
import config from "../backend/data/market-config.json" with { type: "json" };
const password = "checkout-fixture-password-2026";
const pause = () => new Promise((r) => setTimeout(r, 10));
async function until(check) {
  for (let i = 0; i < 200; i++) {
    if (check()) return;
    await pause();
  }
  throw Error("Flow timed out");
}
async function fixture({ profile = true, offline = false } = {}) {
  const db = await createDatabase({ SQLITE_PATH: ":memory:" });
  await migrate(db);
  const app = createApplication(db),
    jar = new Map();
  const direct = (path, body, cookie = "") =>
    app(
      new Request("https://yaviya.test" + path, {
        method: body ? "POST" : "GET",
        headers: {
          Origin: "https://yaviya.test",
          Cookie: cookie,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  const owner = await direct("/api/auth/signup", {
    login: "owner@example.test",
    password,
  });
  const admin = (await owner.json()).user,
    adminSession = owner.headers.getSetCookie()[0].split(";")[0];
  await db
    .prepare("INSERT INTO admin_access VALUES (?,?)")
    .bind("owner", admin.id)
    .run();
  const signup = await direct("/api/auth/signup", {
      login: "buyer@example.test",
      password,
    }),
    user = (await signup.json()).user;
  const session = signup.headers.getSetCookie()[0].split(";")[0];
  jar.set("yaviya_session", session.split("=")[1]);
  if (profile)
    await direct(
      "/api/customer",
      {
        name: "Test Buyer",
        firstName: "Test",
        lastName: "Buyer",
        phone: "+243999999999",
        email: "",
        address: "Fictional address",
        accountType: "buyer",
        privacyConsent: true,
        privacyVersion: "2026-10-02",
      },
      session,
    );
  const html = await readFile(
      new URL("../frontend/pages/index.html", import.meta.url),
      "utf8",
    ),
    dom = new JSDOM(html, {
      url: "https://yaviya.test/",
      runScripts: "outside-only",
      pretendToBeVisual: true,
    }),
    w = dom.window;
  w.Request = Request;
  w.URL.revokeObjectURL = () => {};
  w.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  w.HTMLDialogElement.prototype.close = function () {
    this.open = false;
    this.dispatchEvent(new w.Event("close"));
  };
  const errors = [];
  w.addEventListener("error", (e) => errors.push(e.error));
  w.fetch = async (input, options) => {
    const request = new Request(
        input instanceof Request ? input : new URL(input, w.location.href),
        options,
      ),
      headers = new Headers(request.headers);
    headers.set("Cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
    if (request.method !== "GET") headers.set("Origin", w.location.origin);
    await pause();
    const response = offline
      ? Response.json({ error: "Service unavailable" }, { status: 503 })
      : await app(new Request(request, { headers }));
    for (const cookie of response.headers.getSetCookie()) {
      const [k, v] = cookie.split(";")[0].split("=");
      if (v) jar.set(k, v);
      else jar.delete(k);
    }
    return response;
  };
  const context = dom.getInternalVMContext();
  for (const [, script] of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
    const source =
      script === "market-config.js"
        ? "window.YAVIYA_MARKET_CONFIG=" + JSON.stringify(config)
        : await readFile(
            new URL("../frontend/src/" + script, import.meta.url),
            "utf8",
          );
    vm.runInContext(source, context, { filename: script });
  }
  const run = (s) => vm.runInContext(s, context);
  return {
    db,
    w,
    run,
    user,
    direct,
    session,
    adminSession,
    errors,
    setSession: (cookie) => jar.set("yaviya_session", cookie.split("=")[1]),
    close: () => {
      w.close();
      db.close();
    },
  };
}
test("real catalogue click waits for ongoing synchronization and saves exactly the chosen product", async () => {
  const f = await fixture();
  try {
    await until(() => f.run("marketReady && customerProfile!==null"));
    // Simulate a concurrent polling request at the exact time of the purchase.
    const loading = f.run("loadMarket(false)");
    f.w.document.querySelector('[data-buy-now="1"]').click();
    await loading;
    await until(() => f.w.document.querySelector("#checkout-form"));
    const form = f.w.document.querySelector("#checkout-form");
    assert.match(
      f.w.document.querySelector(".instant-purchase").textContent,
      /Quantité : 1/,
    );
    const city = form.querySelector("#city");
    assert.equal(city.options.length, 97);
    assert.ok(
      [...city.options]
        .filter((o) => o.value && !config.deliverableCities.includes(o.value))
        .every((o) => o.disabled),
    );
    assert.equal(
      [...city.options].find((o) => o.value === "Goma").disabled,
      true,
    );
    city.value = "Kinshasa";
    city.dispatchEvent(new f.w.Event("change"));
    const commune = form.querySelector("#commune");
    commune.value = "Gombe";
    commune.dispatchEvent(new f.w.Event("change"));
    form.querySelector("#address").value = "Avenue fictive 12";
    assert.equal(form.querySelector("button.primary").disabled, false);
    form.dispatchEvent(
      new f.w.Event("submit", { cancelable: true, bubbles: true }),
    );
    await until(() => f.w.document.querySelector("[data-shared-order]"));
    const rows = (
      await f.db
        .prepare("SELECT snapshot FROM market_orders WHERE buyer_user_id=?")
        .bind(f.user.id)
        .all()
    ).results;
    assert.equal(rows.length, 1);
    const order = JSON.parse(rows[0].snapshot);
    assert.equal(order.items.length, 1);
    assert.equal(order.items[0].id, 1);
    assert.equal(order.items[0].q, 1);
    assert.equal(order.city, "Kinshasa");
    assert.deepEqual(f.errors, []);
  } finally {
    f.close();
  }
});
test("new buyer returns to the selected purchase after completing the real registration form", async () => {
  const f = await fixture({ profile: false });
  try {
    await until(() => f.run("marketReady"));
    f.w.document.querySelector('[data-buy-now="2"]').click();
    await until(() => f.w.document.querySelector("#register-form"));
    const form = f.w.document.querySelector("#register-form"),
      buyer = form.querySelector('[name="accountType"][value="buyer"]');
    buyer.checked = true;
    buyer.dispatchEvent(new f.w.Event("change"));
    for (const [name, value] of Object.entries({
      firstName: "Test",
      lastName: "Buyer",
      phone: "+243999999999",
      address: "Fictional address",
    }))
      form.elements[name].value = value;
    form.elements.privacyConsent.checked = true;
    form.dispatchEvent(
      new f.w.Event("submit", { cancelable: true, bubbles: true }),
    );
    await until(() => f.w.document.querySelector("#checkout-form"));
    assert.match(
      f.w.document.querySelector(".instant-purchase").textContent,
      /Baskets/,
    );
    assert.deepEqual(f.errors, []);
  } finally {
    f.close();
  }
});
test("offline account service gives a persistent purchase error and a retry action", async () => {
  const f = await fixture({ offline: true });
  try {
    f.w.document.querySelector('[data-buy-now="1"]').click();
    await until(() => f.w.document.querySelector('#modal [role="alert"]'));
    assert.ok(f.w.document.querySelector('#modal [data-buy-now="1"]'));
    assert.equal(
      (await f.db.prepare("SELECT COUNT(*) AS n FROM market_orders").first()).n,
      0,
    );
  } finally {
    f.close();
  }
});
test("all future DRC destinations are rejected for every delivery mode, including forged requests", async () => {
  const f = await fixture();
  try {
    await until(() => f.run("marketReady"));
    for (const city of config.cities.filter(
      (c) => !config.deliverableCities.includes(c),
    ))
      for (const mode of ["home", "express", "hand", "relay"]) {
        const response = await f.direct(
          "/api/marketplace/orders",
          {
            requestKey: randomUUID(),
            items: [{ id: 1, q: 1 }],
            paymentId: "cod",
            recipient: { name: "Test", phone: "+243999999999" },
            city,
            commune: "Gombe",
            address: "Fictional address",
            delivery: { mode },
          },
          f.session,
        );
        assert.equal(response.status, 400, city + " " + mode);
        assert.match(
          (await response.json()).error,
          /uniquement à Kinshasa et Lubumbashi/,
        );
      }
    assert.equal(
      (await f.db.prepare("SELECT COUNT(*) AS n FROM market_orders").first()).n,
      0,
    );
  } finally {
    f.close();
  }
});

test("expanded categories persist seller classification and open the matching products", async () => {
  const f = await fixture();
  try {
    await until(() => f.run("marketReady"));
    const state = await (
      await f.direct("/api/marketplace?view=admin", undefined, f.adminSession)
    ).json();
    const product = state.catalogue.find((p) => p.id === 1);
    let response = await f.direct(
      "/api/marketplace/catalogue",
      { ...product, category: "Sport", subcategory: "Fitness & musculation" },
      f.adminSession,
    );
    assert.equal(response.status, 200, await response.clone().text());
    await f.run("loadMarket(false)");
    f.run("showCategories()");
    assert.equal(
      f.w.document.querySelectorAll(".category-tree section").length,
      20,
    );
    const section = config.categorySections.findIndex((s) => s[0] === "Sport");
    f.w.document
      .querySelector(
        `[data-category-section="${section}"][data-category-item="0"]`,
      )
      .click();
    assert.ok(
      f.w.document.querySelector('.subcategory-products [data-buy-now="1"]'),
    );
    f.run(`showCategoryProducts(${section},1)`);
    assert.equal(
      f.w.document.querySelector('.subcategory-products [data-buy-now="1"]'),
      null,
    );
    response = await f.direct(
      "/api/marketplace/catalogue",
      { ...product, category: "Sport", subcategory: "Impossible" },
      f.adminSession,
    );
    assert.equal(response.status, 400);
    f.setSession(f.adminSession);
    await f.run("loadMarket(false)");
    f.run("editProduct(1)");
    const form = f.w.document.querySelector("#product-form");
    assert.ok(form);
    assert.equal(form.elements.category.options.length, 19);
    form.elements.category.value = "Agriculture";
    form.elements.category.dispatchEvent(new f.w.Event("change"));
    assert.ok(
      [...form.elements.subcategory.options].some(
        (o) => o.value === "Irrigation",
      ),
    );
    assert.deepEqual(f.errors, []);
  } finally {
    f.close();
  }
});

test("every demo product has distinct gallery views, clean windows and working popular FAQ feedback", async () => {
  const f = await fixture();
  try {
    await until(() => f.run("marketReady && customerProfile!==null"));
    const ids = JSON.parse(
      f.run("JSON.stringify(products.filter(p => shopOf(p)).map(p=>p.id))"),
    );
    assert.ok(ids.length >= 39);
    for (const id of ids) {
      f.run(`showProductDetails(${id})`);
      const doc = f.w.document;
      assert.equal(doc.querySelector(".page-back"), null);
      assert.ok(doc.querySelector("#modal > .close"));
      const thumbs = [...doc.querySelectorAll("[data-gallery-index]")];
      assert.ok(thumbs.length >= 2, "Product " + id);
      const main = doc.querySelector("#product-gallery-image"),
        first = main.src;
      thumbs[1].click();
      assert.notEqual(main.src, first);
      assert.equal(thumbs[1].getAttribute("aria-pressed"), "true");
      doc
        .querySelector(".product-gallery")
        .dispatchEvent(
          new f.w.KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
        );
      assert.equal(main.src, first);
      assert.match(
        doc.querySelector(".product-detail-info .demo-note").textContent,
        /illustratives/,
      );
      doc.querySelector("#modal > .close").click();
      assert.equal(doc.querySelector("#modal").open, false);
    }
    const questions = [...f.w.document.querySelectorAll("#home-faq details")];
    assert.equal(questions.length, 17);
    const photoQuestion = questions.find(
      (x) => x.dataset.popularQuestion === "photos",
    );
    photoQuestion.open = true;
    assert.match(photoQuestion.textContent, /angles|angle/);
    photoQuestion.querySelector('[data-resolved="true"]').click();
    await until(() =>
      photoQuestion
        .querySelector(".faq-vote-status")
        .textContent.includes("enregistré"),
    );
    const feedback = await f.direct("/api/faq-feedback", undefined, f.session);
    assert.ok(
      (await feedback.json()).some(
        (x) => x.question === "photos" && x.resolved,
      ),
    );
    f.run('language="en"; applyLanguage()');
    assert.match(
      f.w.document.querySelector('[data-popular-question="security"]')
        .textContent,
      /two-factor/,
    );
    assert.deepEqual(f.errors, []);
  } finally {
    f.close();
  }
});
