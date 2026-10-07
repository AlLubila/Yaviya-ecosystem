import { marketContext, ensureSeeds } from "./commerce.js";
import { seedShops, seedShopsCG } from "./catalogue-seeds.js";
const reply = (data, status = 200, headers = {}) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const periods = {
  7: 7,
  30: 30,
  quarter: 90,
  semester: 180,
  year: 365,
  all: null,
};
function queryParts(country, sellerIds, ids, publicOnly) {
  const clauses = [],
    args = [];
  if (country !== "ALL") {
    clauses.push("p.country=?");
    args.push(country);
  }
  if (sellerIds) {
    clauses.push(`p.seller_id IN (${sellerIds.map(() => "?").join(",")})`);
    args.push(...sellerIds);
  }
  if (ids) {
    clauses.push(`p.product_id IN (${ids.map(() => "?").join(",")})`);
    args.push(...ids);
  }
  if (publicOnly)
    clauses.push(
      "json_extract(p.data,'$.visible')=1 AND json_extract(p.data,'$.approved')=1",
    );
  return {
    where: clauses.length ? "WHERE " + clauses.join(" AND ") : "",
    args,
  };
}
async function metrics(env, filter, since) {
  // Pre-aggregate views and orders separately to avoid multiplying either count.
  const common = `WITH eligible AS (SELECT p.* FROM market_products p ${filter.where}),
    viewed AS (SELECT v.* FROM product_view_events v JOIN eligible p ON p.country=v.country AND p.product_id=v.product_id WHERE v.viewed_at>=?),
    bought AS (SELECT o.id,CASE WHEN o.buyer_user_id LIKE 'cg:%' THEN substr(o.buyer_user_id,4) ELSE o.buyer_user_id END AS buyer_user_id,o.country,json_extract(i.value,'$.id') AS product_id,json_extract(i.value,'$.q') AS quantity
      FROM market_orders o,json_each(o.snapshot,'$.items') i
      JOIN eligible p ON p.country=o.country AND p.product_id=json_extract(i.value,'$.id')
      WHERE o.created_at>=? AND COALESCE(json_extract(o.snapshot,'$.cancelled'),0)=0 AND json_extract(o.snapshot,'$.buyerConfirmed')=1)`;
  const args = [...filter.args, since, since];
  const rows = (
    await env.DB.prepare(
      common +
        ` SELECT p.country,p.product_id AS productId,p.seller_id AS sellerId,json_extract(p.data,'$.title') AS title,
    (SELECT COUNT(DISTINCT visitor_hash) FROM viewed v WHERE v.country=p.country AND v.product_id=p.product_id) AS uniqueViewers,
    (SELECT COUNT(*) FROM viewed v WHERE v.country=p.country AND v.product_id=p.product_id) AS views,
    (SELECT COUNT(DISTINCT buyer_user_id) FROM bought b WHERE b.country=p.country AND b.product_id=p.product_id) AS buyerCount,
    (SELECT COUNT(DISTINCT id) FROM bought b WHERE b.country=p.country AND b.product_id=p.product_id) AS confirmedOrders,
    COALESCE((SELECT SUM(quantity) FROM bought b WHERE b.country=p.country AND b.product_id=p.product_id),0) AS unitsSold
    FROM eligible p ORDER BY p.country,p.seller_id,p.product_id`,
    )
      .bind(...args)
      .all()
  ).results;
  const totals = await env.DB.prepare(
    common +
      ` SELECT
    (SELECT COUNT(DISTINCT visitor_hash) FROM viewed) AS uniqueViewers,
    (SELECT COUNT(*) FROM viewed) AS views,
    (SELECT COUNT(DISTINCT buyer_user_id) FROM bought) AS buyerCount,
    (SELECT COUNT(DISTINCT id) FROM bought) AS confirmedOrders,
    COALESCE((SELECT SUM(quantity) FROM bought),0) AS unitsSold`,
  )
    .bind(...args)
    .first();
  return { rows, totals };
}
async function visitorHash(request, user) {
  let cookie = "",
    identity;
  if (user) identity = "account:" + user.replace(/^cg:/, "");
  else {
    const current = request.headers
      .get("cookie")
      ?.match(/(?:^|;\s*)yaviya_visitor=([a-f0-9-]{36})(?:;|$)/)?.[1];
    const id = current || crypto.randomUUID();
    identity = "browser:" + id;
    if (!current)
      cookie = `yaviya_visitor=${id}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=31536000${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
  }
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(identity),
  );
  return {
    hash: Array.from(new Uint8Array(digest), (n) =>
      n.toString(16).padStart(2, "0"),
    ).join(""),
    cookie,
  };
}
export async function handleProductInsights(request, env) {
  const url = new URL(request.url),
    user = request.headers.get("yaviya-user-id");
  try {
    const country = url.searchParams.get("country") || "CD";
    if (!["CD", "CG", "ALL"].includes(country)) fail("Marché invalide");
    const report = url.pathname === "/api/product-insights/report";
    if (country === "ALL" && !report) fail("Choisissez un marché");
    if (
      request.method !== "GET" &&
      request.headers.get("origin") !== url.origin
    )
      fail("Origine refusée", 403);
    const ctx = await marketContext(
      env,
      user || (country === "CG" ? "cg:anonymous" : "anonymous"),
    );
    if (report) {
      if (request.method !== "GET") fail("Méthode non autorisée", 405);
      if (!user) fail("Connexion requise", 401);
      if (!ctx.isAdmin && (!ctx.sellerIds.length || country !== ctx.country))
        fail("Accès réservé au vendeur concerné ou à l’admin", 403);
    }
    await ensureSeeds(env, ctx);
    if (report) {
      const period = url.searchParams.get("period") || "30";
      if (!Object.hasOwn(periods, period)) fail("Période invalide");
      const since =
        periods[period] === null ? 0 : Date.now() - periods[period] * 86400000;
      let sellerIds = ctx.isAdmin ? null : ctx.sellerIds;
      if (url.searchParams.has("sellerId")) {
        const id = Number(url.searchParams.get("sellerId"));
        if (!Number.isSafeInteger(id) || id < 1) fail("Boutique invalide");
        if (!ctx.isAdmin && !ctx.sellerIds.includes(id))
          fail("Boutique non autorisée", 403);
        sellerIds = [id];
      }
      const data = await metrics(
        env,
        queryParts(country, sellerIds, null, false),
        since,
      );
      const stores = (
        await env.DB.prepare(
          "SELECT id+10000 AS id,name,country FROM owned_stores",
        ).all()
      ).results;
      const shops = [
        ...seedShops.map((s) => ({ ...s, country: "CD" })),
        ...seedShopsCG.map((s) => ({ ...s, country: "CG" })),
        ...stores,
      ];
      for (const row of data.rows)
        row.sellerName =
          shops.find((s) => s.country === row.country && s.id === row.sellerId)
            ?.name || String(row.sellerId);
      return reply({ ...data, period, country, generatedAt: Date.now() });
    }
    if (url.pathname === "/api/product-insights" && request.method === "GET") {
      const raw = url.searchParams.get("ids") || "",
        parts = raw.split(",");
      if (
        parts.length > 100 ||
        !parts.every(
          (id) =>
            /^\d+$/.test(id) &&
            Number.isSafeInteger(Number(id)) &&
            Number(id) > 0,
        )
      )
        fail("Produits invalides");
      const data = await metrics(
        env,
        queryParts(country, null, [...new Set(parts.map(Number))], true),
        0,
      );
      // Public endpoint only exposes aggregates, never visitor or buyer identities.
      return reply({
        products: data.rows.map(({ productId, buyerCount }) => ({
          productId,
          buyerCount,
        })),
      });
    }
    if (url.pathname !== "/api/product-insights/view") fail("Introuvable", 404);
    if (request.method !== "POST") fail("Méthode non autorisée", 405);
    if (request.headers.get("origin") !== url.origin)
      fail("Origine refusée", 403);
    const d = await request.json();
    if (!Number.isSafeInteger(d.productId) || d.productId < 1)
      fail("Produit invalide");
    const product = await env.DB.prepare(
      "SELECT * FROM market_products WHERE country=? AND product_id=? AND json_extract(data,'$.visible')=1 AND json_extract(data,'$.approved')=1",
    )
      .bind(country, d.productId)
      .first();
    if (!product) fail("Produit introuvable", 404);
    if (ctx.isAdmin || (user && product.owner_user_id === user))
      return reply({ counted: false });
    const { hash, cookie } = await visitorHash(request, user),
      now = Date.now(),
      bucket = Math.floor(now / 1800000);
    const result = await env.DB.prepare(
      `INSERT INTO product_view_events(country,product_id,visitor_hash,bucket,viewed_at)
      SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM product_view_events WHERE visitor_hash=? AND bucket=?)<100
      ON CONFLICT(country,product_id,visitor_hash,bucket) DO NOTHING`,
    )
      .bind(country, d.productId, hash, bucket, now, hash, bucket)
      .run();
    return reply(
      { counted: result.meta.changes > 0 },
      200,
      cookie ? { "Set-Cookie": cookie } : {},
    );
  } catch (e) {
    if (!e.status) console.error("Product insights unavailable", e.message);
    return reply(
      {
        error: e.status
          ? e.message
          : "Statistiques temporairement indisponibles",
      },
      e.status || 503,
    );
  }
}
