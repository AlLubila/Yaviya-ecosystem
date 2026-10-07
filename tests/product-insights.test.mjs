import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createDatabase } from "../backend/database.js";
import { createApplication } from "../backend/application.js";
import { migrate } from "../scripts/migrate.mjs";
test("shared product metrics deduplicate viewers and buyers, reject spoofing and isolate sellers and markets", async () => {
  const db = await createDatabase({ SQLITE_PATH: ":memory:" });
  await migrate(db);
  const app = createApplication(db);
  const call = (path, cookie = "", body, headers = {}) =>
    app(
      new Request("https://shop.test" + path, {
        method: body ? "POST" : "GET",
        headers: {
          Origin: "https://shop.test",
          Cookie: cookie,
          "Content-Type": "application/json",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  async function signup(login, role = "buyer") {
    const r = await call("/api/auth/signup", "", {
      login,
      password: "product-statistics-fixture-2026",
    });
    const user = (await r.json()).user;
    const cookie = r.headers.getSetCookie()[0].split(";")[0];
    const p = await call("/api/customer", cookie, {
      name: login,
      phone: "+243999999999",
      email: "",
      address: "Test",
      accountType: role,
      privacyConsent: true,
      privacyVersion: "2026-10-02",
    });
    assert.equal(p.status, 200);
    return { ...user, cookie };
  }
  try {
    const admin = await signup("owner@example.test"),
      sellerA = await signup("sellerA@example.test", "seller"),
      sellerB = await signup("sellerB@example.test", "seller"),
      buyerA = await signup("buyerA@example.test"),
      buyerB = await signup("buyerB@example.test");
    await db
      .prepare("INSERT INTO admin_access VALUES ('owner',?)")
      .bind(admin.id)
      .run();
    for (const [seller, id] of [
      [sellerA, 1],
      [sellerB, 2],
    ]) {
      await db
        .prepare(
          "INSERT INTO identity_checks(user_id,kind,document_type,object_key,file_name,status,submitted_at) VALUES (?,'seller','identity','fixture','fixture','approved',?)",
        )
        .bind(seller.id, Date.now())
        .run();
      await db
        .prepare(
          "INSERT INTO owned_stores(id,user_id,name,country) VALUES (?,?,?,'CD')",
        )
        .bind(id, seller.id, "Shop " + id)
        .run();
    }
    for (const [seller, productId, sellerId, country] of [
      [sellerA, 20001, 10001, "CD"],
      [sellerB, 20002, 10002, "CD"],
      [sellerA, 20001, 10001, "CG"],
    ]) {
      const data = {
        id: productId,
        seller: sellerId,
        title: "Product " + productId,
        visible: true,
        approved: true,
      };
      await db
        .prepare("INSERT INTO market_products VALUES (?,?,?,?,?,?,10,1,?)")
        .bind(
          country + ":" + productId,
          country,
          productId,
          sellerId,
          country === "CG" ? "cg:" + seller.id : seller.id,
          JSON.stringify(data),
          Date.now(),
        )
        .run();
    }
    const view = (id, cookie = "", country = "CD", headers = {}) =>
      call(
        "/api/product-insights/view?country=" + country,
        cookie,
        { productId: id },
        headers,
      );
    assert.equal(
      (await (await view(20001, buyerA.cookie)).json()).counted,
      true,
    );
    assert.equal(
      (await (await view(20001, buyerA.cookie)).json()).counted,
      false,
    );
    assert.equal(
      (await (await view(20002, buyerA.cookie)).json()).counted,
      true,
    );
    assert.equal(
      (await (await view(20001, sellerA.cookie)).json()).counted,
      false,
    );
    assert.equal(
      (await (await view(20001, admin.cookie)).json()).counted,
      false,
    );
    const guest = await view(20001);
    assert.equal((await guest.clone().json()).counted, true);
    const guestCookie = guest.headers.getSetCookie()[0].split(";")[0];
    assert.match(guestCookie, /yaviya_visitor=/);
    assert.equal(
      (await (await view(20001, guestCookie)).json()).counted,
      false,
    );
    assert.equal(
      (await (await view(20001, guestCookie, "CG")).json()).counted,
      true,
    );
    assert.equal(
      (await view(20001, "", "CD", { Origin: "https://other.test" })).status,
      403,
    );
    assert.equal((await view(999999)).status, 404);
    const now = Date.now();
    for (const [buyer, country, items, confirmed, cancelled, age] of [
      [
        buyerA,
        "CD",
        [
          { id: 20001, q: 2 },
          { id: 20002, q: 1 },
        ],
        true,
        false,
        0,
      ],
      [buyerA, "CD", [{ id: 20001, q: 3 }], true, false, 0],
      [buyerB, "CD", [{ id: 20001, q: 1 }], true, false, 0],
      [buyerB, "CD", [{ id: 20001, q: 99 }], true, true, 0],
      [buyerB, "CD", [{ id: 20001, q: 99 }], false, false, 0],
      [buyerB, "CD", [{ id: 20002, q: 4 }], true, false, 100],
      [buyerA, "CG", [{ id: 20001, q: 1 }], true, false, 0],
    ]) {
      const id = randomUUID(),
        user = country === "CG" ? "cg:" + buyer.id : buyer.id;
      await db
        .prepare(
          "INSERT INTO market_orders(id,country,buyer_user_id,request_key,snapshot,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
        )
        .bind(
          id,
          country,
          user,
          id,
          JSON.stringify({ items, buyerConfirmed: confirmed, cancelled }),
          now - age * 86400000,
          now,
        )
        .run();
    }
    const publicResponse = await call("/api/product-insights?ids=20001,20002");
    assert.equal(publicResponse.status, 200);
    assert.deepEqual(await publicResponse.json(), {
      products: [
        { productId: 20001, buyerCount: 2 },
        { productId: 20002, buyerCount: 2 },
      ],
    });
    const sellerReport = await call(
      "/api/product-insights/report?period=30",
      sellerA.cookie,
    );
    assert.equal(sellerReport.status, 200);
    const sellerData = await sellerReport.json();
    assert.equal(sellerData.rows.length, 1);
    assert.equal(sellerData.rows[0].productId, 20001);
    assert.deepEqual(sellerData.totals, {
      uniqueViewers: 2,
      views: 2,
      buyerCount: 2,
      confirmedOrders: 3,
      unitsSold: 6,
    });
    assert.equal(
      (
        await call(
          "/api/product-insights/report?sellerId=10002",
          sellerA.cookie,
        )
      ).status,
      403,
    );
    assert.equal(
      (await call("/api/product-insights/report?country=CG", sellerA.cookie))
        .status,
      403,
    );
    assert.equal(
      (await call("/api/product-insights/report?country=ALL", sellerA.cookie))
        .status,
      403,
    );
    assert.equal(
      (
        await call("/api/product-insights/report", buyerA.cookie, undefined, {
          "yaviya-user-id": admin.id,
        })
      ).status,
      403,
    );
    assert.equal((await call("/api/product-insights/report")).status, 401);
    assert.equal(
      (
        await call(
          "/api/product-insights/report?period=constructor",
          admin.cookie,
        )
      ).status,
      400,
    );
    const central = await call(
      "/api/product-insights/report?country=ALL&period=30",
      admin.cookie,
    );
    assert.equal(central.status, 200);
    const all = await central.json();
    assert.deepEqual(all.totals, {
      uniqueViewers: 2,
      views: 4,
      buyerCount: 2,
      confirmedOrders: 4,
      unitsSold: 8,
    });
    assert.deepEqual(
      all.rows.find((r) => r.country === "CD" && r.productId === 20001),
      sellerData.rows[0],
    );
    const historic = await call(
      "/api/product-insights/report?country=ALL&period=all",
      admin.cookie,
    );
    assert.equal((await historic.json()).totals.unitsSold, 12);
    const filter = await call(
      "/api/product-insights/report?country=CD&sellerId=10002",
      admin.cookie,
    );
    assert.equal((await filter.json()).rows[0].buyerCount, 1);
    const stored = (await db.prepare("SELECT * FROM product_view_events").all())
      .results;
    assert.equal(stored.length, 4);
    assert.ok(
      stored.every(
        (r) =>
          /^[0-9a-f]{64}$/.test(r.visitor_hash) &&
          !r.visitor_hash.includes(buyerA.id),
      ),
    );
  } finally {
    db.close();
  }
});
