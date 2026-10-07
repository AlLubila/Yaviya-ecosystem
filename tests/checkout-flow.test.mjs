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
    const follow = f.w.document.querySelector("[data-follow-order]");
    assert.ok(follow);
    assert.equal(follow.dataset.followOrder, order.id);
    assert.match(
      f.w.document.querySelector(".order-confirmation").textContent,
      /Commande enregistrée/,
    );
    f.run("showTracking()");
    const refreshedFollow = f.w.document.querySelector("[data-follow-order]");
    assert.equal(refreshedFollow.dataset.followOrder, order.id);
    refreshedFollow.click();
    assert.ok(f.w.document.querySelector(`[data-shared-order="${order.id}"]`));
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
    assert.equal(
      form.querySelector('[value="seller"][name="accountType"]').disabled,
      true,
    );
    assert.equal(
      form.querySelector('[value="courier"][name="accountType"]').disabled,
      true,
    );
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
      12,
    );
    assert.deepEqual(
      config.categorySections.map((s) => s[0]),
      [
        "Alimentation & épicerie",
        "Automobile",
        "Beauté & soins",
        "Bébé & enfants",
        "Industrie & commerce",
        "Maison & cuisine",
        "Mode",
        "Musique & divertissement",
        "Santé & bien-être",
        "Sports & plein air",
        "Voyage & bagages",
        "Électronique",
      ],
    );
    const section = config.categorySections.findIndex(
      (s) => s[0] === "Sports & plein air",
    );
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
    assert.equal(form.elements.category.options.length, 12);
    form.elements.category.value = "Industrie & commerce";
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
      assert.equal(doc.querySelector(".product-detail-info .demo-note"), null);
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

test("product help opens the chatbot inside the dialog, fictional demo counts stay labelled and admin metrics render", async () => {
  const f = await fixture();
  try {
    await until(() => f.run("marketReady && customerProfile!==null"));
    await until(() =>
      f.w.document
        .querySelector('[data-product-buyers="1"]')
        ?.textContent.includes("acheteurs · démo"),
    );
    f.run("showProductDetails(1)");
    const modal = f.w.document.querySelector("#modal");
    f.w.document.querySelector(".product-help").click();
    assert.equal(modal.querySelector("#chat-panel").hidden, false);
    assert.equal(f.w.document.activeElement.id, "chat-input");
    const form = f.w.document.querySelector("#chat-form");
    form.querySelector("input").value = "Comment vérifier les photos ?";
    form.dispatchEvent(
      new f.w.Event("submit", { bubbles: true, cancelable: true }),
    );
    assert.match(
      f.w.document.querySelector(".bot-message:last-child").textContent,
      /miniatures/,
    );
    f.w.document.querySelector("#chat-panel").dispatchEvent(
      new f.w.KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      }),
    );
    assert.equal(modal.open, true);
    assert.equal(f.w.document.querySelector("#chat-panel").hidden, true);
    assert.equal(
      f.w.document.querySelector("#chat-panel").parentElement,
      f.w.document.body,
    );
    const events = () =>
      f.db
        .prepare("SELECT COUNT(*) AS total FROM product_view_events")
        .first("total");
    for (let i = 0; i < 200 && (await events()) !== 1; i++) await pause();
    assert.equal(await events(), 1);
    modal.close();
    f.setSession(f.adminSession);
    f.run('activeRole="admin"');
    await f.run("loadMarket(false)");
    f.run("showAdmin()");
    f.w.document.querySelector('[data-dashboard-tab="productStats"]').click();
    await until(() => f.w.document.querySelector(".product-insights table"));
    assert.equal(
      f.w.document.querySelector('[data-dashboard-panel="productStats"]')
        .hidden,
      false,
    );
    assert.match(
      f.w.document.querySelector(".product-insights").textContent,
      /Visiteurs distincts/,
    );
    const country = f.w.document.querySelector("[data-insight-country]");
    country.value = "CD";
    country.dispatchEvent(new f.w.Event("change", { bubbles: true }));
    await until(() => f.w.document.querySelector(".product-insights table"));
    const period = f.w.document.querySelector("[data-insight-period]");
    period.value = "7";
    period.dispatchEvent(new f.w.Event("change", { bubbles: true }));
    await until(() => f.w.document.querySelector(".product-insights table"));
    assert.deepEqual(f.errors, []);
  } finally {
    f.close();
  }
});

test("expanded demo catalogue stays browsable without API and each new subcategory opens its products", async () => {
  const f = await fixture({ offline: true });
  try {
    assert.equal(
      f.run("products.filter(p => p.id >= 600 && p.id <= 620).length"),
      21,
    );
    for (const seed of config.demoCatalogue) {
      const section = config.categorySections.findIndex(
        ([cat, , , children]) =>
          cat === seed.category &&
          children.some(([label]) => label === seed.subcategory),
      );
      assert.ok(section >= 0, seed.title);
      const item = config.categorySections[section][3].findIndex(
        ([label]) => label === seed.subcategory,
      );
      f.run(`showCategoryProducts(${section}, ${item})`);
      assert.ok(
        f.w.document.querySelector(`[data-detail="${seed.id}"]`),
        seed.title,
      );
      f.run(`showProductDetails(${seed.id})`);
      assert.equal(
        f.w.document.querySelectorAll("[data-gallery-index]").length,
        2,
        seed.title,
      );
      assert.match(
        f.w.document.querySelector(`[data-product-buyers="${seed.id}"]`)
          .textContent,
        /\d+ acheteurs · démo/,
      );
    }
    assert.deepEqual(f.errors, []);
  } finally {
    f.close();
  }
});

test("existing catalogues backfill missing demo references without overwriting seller edits", async () => {
  const f = await fixture();
  try {
    await until(() => f.run("marketReady"));
    const row = await f.db
      .prepare("SELECT data FROM market_products WHERE key='CD:1'")
      .first();
    const edited = {
      ...JSON.parse(row.data),
      title: "Titre modifié par le vendeur",
    };
    await f.db
      .prepare("UPDATE market_products SET data=?,stock=7 WHERE key='CD:1'")
      .bind(JSON.stringify(edited))
      .run();
    await f.db.prepare("DELETE FROM market_products WHERE key='CD:600'").run();
    await f.run("loadMarket(false)");
    const restored = await f.db
      .prepare("SELECT data FROM market_products WHERE key='CD:600'")
      .first();
    assert.equal(
      JSON.parse(restored.data).title,
      config.demoCatalogue[0].title,
    );
    const preserved = await f.db
      .prepare("SELECT data,stock FROM market_products WHERE key='CD:1'")
      .first();
    assert.equal(JSON.parse(preserved.data).title, edited.title);
    assert.equal(preserved.stock, 7);
    assert.deepEqual(f.errors, []);
  } finally {
    f.close();
  }
});

test("commune delivery prices agree between checkout and persisted orders", async () => {
  const f = await fixture();
  try {
    await until(() => f.run("marketReady"));
    assert.equal(f.run('deliveryCost("home",2,"Kinshasa","Matete")'), 20000);
    assert.equal(
      f.run('deliveryCost("express",1,"Kinshasa","Kimbanseke")'),
      20000,
    );
    assert.equal(f.run('deliveryCost("home",1,"Lubumbashi","Kenya")'), 7500);
    for (const [commune, fee] of [
      ["Matete", 10000],
      ["Kimbanseke", 12500],
    ]) {
      const response = await f.direct(
        "/api/marketplace/orders",
        {
          requestKey: randomUUID(),
          items: [{ id: 1, q: 1 }],
          city: "Kinshasa",
          commune,
          address: "Adresse fictive",
          recipient: { name: "Test Buyer", phone: "+243999999999" },
          paymentId: "cod",
          delivery: { mode: "home" },
        },
        f.session,
      );
      assert.equal(response.status, 201, await response.clone().text());
      const data = await response.json();
      assert.equal(data.order.total, 85000 + fee);
    }
    assert.deepEqual(f.errors, []);
  } finally {
    f.close();
  }
});

test("buyer country, currency and language survive reload without changing checkout market", async () => {
  const f = await fixture();
  try {
    await until(() => f.run("marketReady"));
    f.run("showRegister()");
    const form = f.w.document.querySelector("#register-form");
    assert.equal(form.elements.residenceCountry.options.length, 250);
    assert.equal(form.elements.currency.options.length, 4);
    const original = await (
      await f.direct("/api/customer", undefined, f.session)
    ).json();
    const body = {
      ...original,
      privacyConsent: true,
      residenceCountry: "FR",
      currency: "USD",
      preferredLanguage: "en",
    };
    let response = await f.direct("/api/customer", body, f.session);
    assert.equal(response.status, 200, await response.clone().text());
    const saved = await (
      await f.direct("/api/customer", undefined, f.session)
    ).json();
    assert.equal(saved.residenceCountry, "FR");
    assert.equal(saved.currency, "USD");
    assert.equal(saved.preferredLanguage, "en");
    await f.run(`customerAPI(${JSON.stringify(body)})`);
    assert.equal(f.run("language"), "en");
    await f.run("loadMarket(false)");
    f.run("showRegister()");
    assert.equal(
      f.w.document.querySelector("#register-form").elements.currency.value,
      "USD",
    );
    assert.equal(f.run("window.YAVIYA_COUNTRY"), "CD");
    assert.match(f.run("money(10000)"), /FC/);
    for (const patch of [
      { residenceCountry: "ZZ" },
      { currency: "FAKE" },
      { preferredLanguage: "zz" },
    ]) {
      response = await f.direct(
        "/api/customer",
        { ...body, ...patch },
        f.session,
      );
      assert.equal(response.status, 400);
    }
    response = await f.direct(
      "/api/customer",
      {
        ...original,
        privacyConsent: true,
        residenceCountry: undefined,
        currency: undefined,
        preferredLanguage: undefined,
      },
      f.session,
    );
    assert.equal(response.status, 200);
    const retained = await (
      await f.direct("/api/customer", undefined, f.session)
    ).json();
    assert.equal(retained.currency, "USD");
    const coupons = await f.direct("/api/coupons", undefined, f.session);
    assert.equal(coupons.status, 200);
    f.run("showMyYaviya()");
    assert.match(
      f.w.document.querySelector(".profile-preferences-summary").textContent,
      /France.*USD.*English/,
    );
    assert.deepEqual(f.errors, []);
  } finally {
    f.close();
  }
});
