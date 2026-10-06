import { accountIdentifiers } from "./account-identifiers.js";
import assets from "./assets.js";
import { handleMarketplace } from "./commerce.js";
import { handleProductPhotos } from "./product-photos.js";
import { handleCourierMessages } from "./courier-messages.js";
import { handleDeliveryReviews } from "./delivery-reviews.js";
import { handleSellerMessages } from "./seller-messages.js";
import { handleDelivery } from "./delivery.js";
import { handleVerification } from "./verification.js";
import { handleCoins } from "./coins.js";
import { handleFeedback } from "./feedback.js";
const json = (v, status = 200) =>
  Response.json(v, { status, headers: { "Cache-Control": "no-store" } });
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (
      url.pathname.startsWith("/api/") &&
      url.searchParams.get("country") === "CG" &&
      request.headers.get("yaviya-user-id")
    ) {
      const headers = new Headers(request.headers);
      headers.set("yaviya-user-id", "cg:" + headers.get("yaviya-user-id"));
      request = new Request(request, { headers });
    }
    if (url.pathname.startsWith("/api/marketplace"))
      return handleMarketplace(request, env);
    if (url.pathname.startsWith("/api/product-photos"))
      return handleProductPhotos(request, env);
    if (url.pathname === "/api/courier-messages")
      return handleCourierMessages(request, env);
    if (url.pathname === "/api/delivery-reviews")
      return handleDeliveryReviews(request, env);
    if (url.pathname === "/api/seller-messages")
      return handleSellerMessages(request, env);
    if (url.pathname.startsWith("/api/demo-delivery"))
      return handleDelivery(request, env);
    if (url.pathname.startsWith("/api/verification"))
      return handleVerification(request, env);
    if (url.pathname === "/api/faq-feedback")
      return handleFeedback(request, env);
    if (url.pathname === "/api/yavicoins") return handleCoins(request, env);
    if (url.pathname === "/api/customer") {
      const userId = request.headers.get("yaviya-user-id");
      if (!userId)
        return json({ error: "Connectez-vous à votre compte YAVIYA." }, 401);
      try {
        if (request.method === "GET") {
          const row = await env.DB.prepare(
            "SELECT name,first_name AS firstName,last_name AS lastName,phone,email,address,wishlist,account_type AS accountType,privacy_version AS privacyVersion,privacy_accepted_at AS privacyAcceptedAt FROM customers WHERE user_id=?",
          )
            .bind(userId)
            .first();
          return json(
            row
              ? {
                  ...row,
                  ...(await accountIdentifiers(env, userId, row.accountType)),
                  wishlist: JSON.parse(row.wishlist),
                }
              : null,
          );
        }
        if (request.method !== "POST")
          return json({ error: "Method not allowed" }, 405);
        if (request.headers.get("origin") !== url.origin)
          return json({ error: "Origin rejected" }, 403);
        const d = await request.json();
        if (d.wishlistOnly) {
          if (
            !Array.isArray(d.wishlist) ||
            d.wishlist.length > 100 ||
            d.wishlist.some((x) => !Number.isInteger(x) || x < 1 || x > 10000)
          )
            return json({ error: "Invalid wishlist" }, 400);
          const current = await env.DB.prepare(
            "SELECT user_id FROM customers WHERE user_id=?",
          )
            .bind(userId)
            .first();
          if (!current)
            return json({ error: "Create your profile first" }, 409);
          await env.DB.prepare(
            "UPDATE customers SET wishlist=? WHERE user_id=?",
          )
            .bind(JSON.stringify(d.wishlist), userId)
            .run();
          return json({ ok: true });
        }
        if (!["buyer", "seller", "courier"].includes(d.accountType))
          return json({ error: "Choose a buyer or seller account" }, 400);
        if (d.privacyConsent !== true || d.privacyVersion !== "2026-10-02")
          return json({ error: "Accept the current privacy policy" }, 400);
        for (const k of ["name", "phone", "email", "address"])
          if (typeof d[k] !== "string" || d[k].length > 250)
            return json({ error: "Invalid profile" }, 400);
        if (
          !d.name.trim() ||
          !d.address.trim() ||
          !d.phone.trim() ||
          (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))
        )
          return json({ error: "Check your contact details" }, 400);
        const firstName =
            typeof d.firstName === "string"
              ? d.firstName.trim().slice(0, 100)
              : "",
          lastName =
            typeof d.lastName === "string"
              ? d.lastName.trim().slice(0, 100)
              : "";
        await env.DB.prepare(
          "INSERT INTO customers (user_id,name,phone,email,address,account_type,privacy_version,privacy_accepted_at,first_name,last_name) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,first_name=excluded.first_name,last_name=excluded.last_name,phone=excluded.phone,email=excluded.email,address=excluded.address,account_type=excluded.account_type,privacy_version=excluded.privacy_version,privacy_accepted_at=CASE WHEN customers.privacy_version=excluded.privacy_version THEN COALESCE(customers.privacy_accepted_at,excluded.privacy_accepted_at) ELSE excluded.privacy_accepted_at END",
        )
          .bind(
            userId,
            d.name,
            d.phone,
            d.email,
            d.address,
            d.accountType,
            d.privacyVersion,
            Date.now(),
            firstName,
            lastName,
          )
          .run();
        return json({
          ok: true,
          ...(await accountIdentifiers(env, userId, d.accountType)),
        });
      } catch (e) {
        console.error("Customer storage unavailable", e);
        return json(
          { error: "Storage temporarily unavailable. Please retry." },
          503,
        );
      }
    }
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    const a = assets[path];
    if (!a) return new Response("Not found", { status: 404 });
    return new Response(
      a.binary ? Uint8Array.from(atob(a.data), (c) => c.charCodeAt(0)) : a.data,
      {
        headers: {
          "content-type": a.type,
          "X-Content-Type-Options": "nosniff",
        },
      },
    );
  },
};
