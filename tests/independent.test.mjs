import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createDatabase, createPrivateFiles } from "../backend/database.js";
import { createApplication } from "../backend/application.js";
import { migrate } from "../scripts/migrate.mjs";

async function fixture() {
  const db = await createDatabase({ SQLITE_PATH: ":memory:" });
  await migrate(db);
  const application = createApplication(db);
  const call = (path, cookie = "", body, options = {}) =>
    application(
      new Request(`http://localhost${path}`, {
        method: body ? "POST" : "GET",
        headers: {
          ...(body
            ? {
                Origin: "http://localhost",
                ...(body instanceof FormData
                  ? {}
                  : { "Content-Type": "application/json" }),
              }
            : {}),
          Cookie: cookie,
          ...options.headers,
        },
        body: body
          ? body instanceof FormData
            ? body
            : JSON.stringify(body)
          : undefined,
      }),
    );
  const signup = async (login) => {
    const response = await call("/api/auth/signup", "", {
      login,
      password: "a-fictitious-password-2026",
    });
    assert.equal(response.status, 200, await response.clone().text());
    return {
      ...(await response.json()).user,
      cookie: response.headers.get("set-cookie").split(";")[0],
    };
  };
  const profile = async (user, role) => {
    const response = await call("/api/customer", user.cookie, {
      name: `Test ${role}`,
      firstName: "Test",
      lastName: role,
      phone: "+243999999999",
      email: "",
      address: "Adresse fictive",
      accountType: role,
      privacyConsent: true,
      privacyVersion: "2026-10-02",
    });
    assert.equal(response.status, 200, await response.clone().text());
    return response.json();
  };
  return { db, call, signup, profile };
}

test("sessions, CSRF, profile isolation, spoofed identity, logout and persistence", async () => {
  const { db, call, signup, profile } = await fixture();
  try {
    const alice = await signup("alice@example.test"),
      bob = await signup("+243888888888");
    const ids = await profile(alice, "buyer");
    assert.match(ids.customerNumber, /^YVC-\d{4}[a-z]$/);
    await profile(bob, "buyer");
    assert.equal(
      (
        await call("/api/customer", "", undefined, {
          headers: {
            "yaviya-user-id": alice.id,
            "oai-authenticated-user-id": alice.id,
          },
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await call(
          "/api/customer",
          alice.cookie,
          { wishlistOnly: true, wishlist: [1, 2] },
          { headers: { Origin: "https://evil.example" } },
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await call("/api/customer", alice.cookie, {
          wishlistOnly: true,
          wishlist: [1, 2],
        })
      ).status,
      200,
    );
    assert.deepEqual(
      (await (await call("/api/customer", alice.cookie)).json()).wishlist,
      [1, 2],
    );
    assert.deepEqual(
      (await (await call("/api/customer", bob.cookie)).json()).wishlist,
      [],
    );
    assert.equal(
      (await call("/api/verification/bootstrap", bob.cookie, {})).status,
      403,
    );
    assert.equal(
      (await call("/api/auth/logout", alice.cookie, {})).status,
      200,
    );
    assert.equal((await call("/api/customer", alice.cookie)).status, 401);
    const login = await call("/api/auth/login", "", {
      login: "alice@example.test",
      password: "a-fictitious-password-2026",
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie").split(";")[0];
    assert.deepEqual(
      (await (await call("/api/customer", cookie)).json()).wishlist,
      [1, 2],
    );
    const files = createPrivateFiles(db);
    const bytes = new Uint8Array([0, 1, 254, 255]);
    await files.put("private-test", bytes, {
      httpMetadata: { contentType: "application/pdf" },
    });
    assert.deepEqual((await files.get("private-test")).body, bytes);
    await files.delete("private-test");
    assert.equal(await files.get("private-test"), null);
    await assert.rejects(
      db.batch([
        db
          .prepare("INSERT INTO private_files VALUES (?,?,?)")
          .bind("rollback", bytes, "x"),
        db.prepare("INSERT INTO missing_table VALUES (1)"),
      ]),
    );
    assert.equal(await files.get("rollback"), null);
  } finally {
    db.close();
  }
});

test("original shared buyer/seller/courier/admin delivery, private proof and ratings", async () => {
  const { db, call, signup, profile } = await fixture();
  try {
    const admin = await signup("admin@example.test"),
      buyer = await signup("buyer@example.test"),
      seller = await signup("seller@example.test"),
      courier = await signup("courier@example.test");
    await db
      .prepare("INSERT INTO admin_access (id,user_id) VALUES (?,?)")
      .bind("owner", admin.id)
      .run();
    await profile(admin, "buyer");
    await profile(buyer, "buyer");
    await profile(seller, "seller");
    await profile(courier, "courier");
    for (const [user, role] of [
      [seller, "seller"],
      [courier, "courier"],
    ]) {
      const form = new FormData();
      for (const [key, value] of Object.entries({
        companyName: "Boutique test",
        unregistered: "true",
        documentType: "identity",
        issuingCountry: "CD",
        identityConfirmed: "true",
        sellerPlan: "free",
        courierPlan: "standard",
        courierPayoutMethod: "cash",
        courierBenefitsAccepted: "true",
      }))
        form.set(key, value);
      form.set(
        "document",
        new Blob([new Uint8Array([255, 216, 255, 1])], { type: "image/jpeg" }),
        "identite-fictive.jpg",
      );
      form.set("issuingCountry", "ZZ");
      assert.equal(
        (await call("/api/verification", user.cookie, form)).status,
        400,
      );
      form.set("issuingCountry", "CD");
      form.set("documentType", "licence-c");
      if (user === seller) {
        assert.equal(
          (await call("/api/verification", user.cookie, form)).status,
          400,
        );
        form.set("documentType", "identity");
      }
      form.set(
        "document",
        new Blob(["%PDF-fictive"], { type: "application/pdf" }),
        "photo.pdf",
      );
      assert.equal(
        (await call("/api/verification", user.cookie, form)).status,
        400,
      );
      form.delete("document");
      assert.equal(
        (await call("/api/verification", user.cookie, form)).status,
        400,
      );
      form.set(
        "document",
        new Blob([new Uint8Array([255, 216, 255, 1])], { type: "image/jpeg" }),
        "identite-fictive.jpg",
      );
      const response = await call("/api/verification", user.cookie, form);
      assert.equal(response.status, 200, await response.clone().text());
      assert.equal(
        (
          await call(
            `/api/verification/document?userId=${user.id}`,
            buyer.cookie,
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await call(
            `/api/verification/document?userId=${user.id}`,
            admin.cookie,
          )
        ).status,
        200,
      );
      const approved = await call("/api/verification/reviews", admin.cookie, {
        userId: user.id,
        decision: "approve",
        identityChecked: true,
        companyChecked: true,
      });
      assert.equal(approved.status, 200, await approved.clone().text());
    }
    const sellerState = await (
      await call("/api/marketplace?view=seller", seller.cookie)
    ).json();
    const sellerId = sellerState.sellerIds[0];
    assert.ok(sellerId > 10000);
    const product = {
      id: 9001,
      seller: sellerId,
      title: "Produit de test",
      category: "Mode",
      family: "Mode",
      price: 10000,
      stock: 3,
      visible: true,
      approved: false,
      img: "product-tie.jpg",
      images: ["product-tie.jpg"],
      desc: "Fictif",
    };
    let response = await call(
      "/api/marketplace/catalogue",
      seller.cookie,
      product,
    );
    assert.equal(response.status, 200, await response.clone().text());
    const adminState = await (
      await call("/api/marketplace?view=admin", admin.cookie)
    ).json();
    const saved = adminState.catalogue.find((p) => p.id === product.id);
    assert.ok(saved);
    response = await call("/api/marketplace/catalogue", admin.cookie, {
      ...saved,
      approved: true,
    });
    assert.equal(response.status, 200, await response.clone().text());
    const orderRequest = {
      requestKey: randomUUID(),
      items: [{ id: 9001, q: 1 }],
      paymentId: "cod",
      recipient: { name: "Acheteur test", phone: "+243999999999" },
      city: "Kinshasa",
      commune: "Gombe",
      address: "Adresse fictive",
      delivery: { mode: "home" },
    };
    response = await call(
      "/api/marketplace/orders",
      buyer.cookie,
      orderRequest,
    );
    assert.equal(response.status, 201, await response.clone().text());
    let order = (await response.json()).order;
    const duplicate = await (
      await call("/api/marketplace/orders", buyer.cookie, orderRequest)
    ).json();
    assert.equal(duplicate.order.id, order.id);
    const mutate = async (user, action, extra = {}) => {
      const r = await call("/api/marketplace/orders/action", user.cookie, {
        orderId: order.id,
        revision: order.revision,
        action,
        ...extra,
      });
      assert.equal(r.status, 200, await r.clone().text());
      order = (await r.json()).order;
    };
    await mutate(seller, "seller_accept", { sellerId });
    await mutate(seller, "seller_prepare", { sellerId });
    response = await call("/api/marketplace/courier", courier.cookie, {
      available: true,
      payoutMethod: "cash",
      payoutAccount: "",
      benefitsAccepted: true,
    });
    assert.equal(response.status, 200);
    await mutate(courier, "courier_claim");
    await mutate(courier, "courier_collect");
    const proof = new FormData();
    proof.set("orderId", order.id);
    proof.set("revision", order.revision);
    proof.set("delivered", "true");
    proof.set("cashCollected", "true");
    proof.set(
      "photo",
      new Blob([new Uint8Array([255, 216, 255, 1])], { type: "image/jpeg" }),
      "preuve-fictive.jpg",
    );
    response = await call("/api/marketplace/proof", courier.cookie, proof);
    assert.equal(response.status, 200, await response.clone().text());
    order = (await response.json()).order;
    await mutate(buyer, "buyer_receipt", { cashPaid: true });
    response = await call("/api/delivery-reviews", buyer.cookie, {
      orderId: order.id,
      sellerScores: { [sellerId]: 5 },
      courierScore: 4,
      comment: "Test fictif",
    });
    assert.equal(response.status, 200, await response.clone().text());
    const reviews = await (
      await call("/api/delivery-reviews?view=courier", courier.cookie)
    ).json();
    assert.equal(reviews[0].courierScore, 4);
    const sellerReviews = await (
      await call("/api/delivery-reviews?view=seller", seller.cookie)
    ).json();
    assert.equal(sellerReviews[0].sellerScores[sellerId], 5);
    assert.equal(
      (await call("/api/marketplace/proof?orderId=" + order.id, seller.cookie))
        .status,
      200,
    );
    assert.equal(
      (await call("/api/marketplace?view=admin", buyer.cookie)).status,
      403,
    );
  } finally {
    db.close();
  }
});

test("serverless production refuses ephemeral storage when remote credentials are missing", async () => {
  await assert.rejects(createDatabase({ VERCEL: "1" }), /TURSO_DATABASE_URL/);
});
