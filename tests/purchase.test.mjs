import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { seedCatalogue } from "../backend/worker/catalogue-seeds.js";
import { googleAuth } from "../backend/google-auth.js";
test("all catalogue photographs are packaged", () => {
  for (const product of seedCatalogue) {
    assert.ok(product.images.length >= 2, product.title);
    for (const src of product.images) {
      const photo = fs.readFileSync(
        new URL("../frontend/assets/images/" + src, import.meta.url),
      );
      assert.ok(photo.length > 100, src);
      if (src.endsWith(".webp"))
        assert.equal(photo.toString("ascii", 8, 12), "WEBP");
    }
    assert.ok(product.img, product.title);
    assert.ok(
      fs.existsSync(
        new URL("../frontend/assets/images/" + product.img, import.meta.url),
      ),
      product.img,
    );
  }
});
test("buy now signs in, synchronizes and opens selected product checkout", async () => {
  const text = fs.readFileSync(
    new URL("../frontend/src/profile-commerce.js", import.meta.url),
    "utf8",
  );
  const code = text.slice(
    text.indexOf("async function buyNow("),
    text.indexOf(
      "window.addEventListener",
      text.indexOf("async function buyNow("),
    ),
  );
  const events = [];
  const product = {
    id: 1,
    visible: true,
    approved: true,
    stock: 2,
    title: "Test",
    price: 20,
  };
  const context = {
    products: [product],
    shopOf: () => ({ name: "Shop" }),
    sellerInCurrentMarket: () => true,
    deliverySaving: false,
    activeRole: "buyer",
    window: { ensureYaviyaSignedIn: async () => events.push("login") },
    loadMarket: async () => {
      events.push("sync");
      return true;
    },
    customerProfile: { name: "Buyer" },
    Map,
    showCheckout: (selection) => events.push([...selection]),
    $: () => ({ insertAdjacentHTML: () => {} }),
    T: (x) => x,
    esc: (x) => x,
    money: (x) => x,
    toast: (x) => events.push(x),
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  await context.buyNow(1);
  assert.equal(events[0], "login");
  assert.equal(events[1], "sync");
  assert.equal(events[2][0][0], 1);
  assert.equal(events[2][0][1], 1);
});
test("Google auth rejects unconfigured provider and invalid state without contacting Google", async () => {
  const request = new Request("https://shop.test/api/auth/google");
  assert.equal((await googleAuth(request, {}, {})).status, 503);
  const config = {
    GOOGLE_CLIENT_ID: "client",
    GOOGLE_CLIENT_SECRET: "secret",
    GOOGLE_REDIRECT_URI: "https://shop.test/api/auth/google-callback",
  };
  assert.equal(
    (
      await googleAuth(
        new Request("https://shop.test/api/auth/google-callback?state=invalid"),
        {},
        config,
        () => {
          throw Error("must not fetch");
        },
      )
    ).status,
    400,
  );
});
