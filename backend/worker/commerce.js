import { approvedIdentity } from "./identity-complete.js";
import marketConfig from "../data/market-config.json" with { type: "json" };
import { accountIdentifiers } from "./account-identifiers.js";
import {
  seedCatalogue,
  seedShops,
  seedCatalogueCG,
  seedShopsCG,
  deliveryTariffs,
  deliveryCommunes,
  deliveryCommunesCG,
} from "./catalogue-seeds.js";
import {
  validProductImage,
  validatePhotoReferences,
} from "./product-photos.js";

const json = (data, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const fail = (message, status = 400) => {
  const e = new Error(message);
  e.status = status;
  throw e;
};
const countryOf = (user) => (user.startsWith("cg:") ? "CG" : "CD");
export async function marketContext(env, user) {
  const country = countryOf(user),
    base = country === "CG" ? user.slice(3) : user;
  const admin = await env.DB.prepare(
    "SELECT user_id FROM admin_access WHERE id=?",
  )
    .bind("owner")
    .first();
  const profile = await env.DB.prepare(
    "SELECT * FROM customers WHERE user_id=?",
  )
    .bind(user)
    .first();
  const check = await env.DB.prepare(
    "SELECT kind,status,seller_plan,issuing_country,document_type,document_mime FROM identity_checks WHERE user_id=?",
  )
    .bind(user)
    .first();
  const isAdmin = admin?.user_id === base,
    approved =
      check?.status === "approved" &&
      check.kind === profile?.account_type &&
      ["image/jpeg", "image/png"].includes(check.document_mime) &&
      marketConfig.identityCountries.some(
        (c) => c.code === check.issuing_country,
      ) &&
      (check.document_type !== "licence-c" || check.kind === "courier");
  const stores = (
    await env.DB.prepare(
      "SELECT id,name,country FROM owned_stores WHERE user_id=? AND country=?",
    )
      .bind(user, country)
      .all()
  ).results;
  const seedStores = country === "CG" ? seedShopsCG : seedShops;
  const sellerIds = [
    ...(approved && profile.account_type === "seller"
      ? stores.map((s) => s.id + 10000)
      : []),
    ...(isAdmin ? seedStores.map((s) => s.id) : []),
  ];
  return {
    user,
    country,
    isAdmin,
    profile,
    check,
    stores,
    sellerIds,
    courier: approved && profile.account_type === "courier",
    owner: admin?.user_id,
  };
}
export async function ensureSeeds(env, ctx) {
  if (!ctx.owner) return;
  const seeds = ctx.country === "CG" ? seedCatalogueCG : seedCatalogue,
    owner = ctx.country === "CG" ? "cg:" + ctx.owner : ctx.owner;
  const existing = new Set(
    (
      await env.DB.prepare(
        "SELECT product_id FROM market_products WHERE country=?",
      )
        .bind(ctx.country)
        .all()
    ).results.map((p) => p.product_id),
  );
  const missing = seeds.filter((p) => !p.crossMarket && !existing.has(p.id));
  if (!missing.length) return;
  const prior = await env.DB.prepare(
    "SELECT snapshot FROM delivery_scenarios WHERE user_id=?",
  )
    .bind(owner)
    .first();
  const priorCatalogue = prior
    ? JSON.parse(prior.snapshot).catalogue || []
    : [];
  const owned = (
    await env.DB.prepare(
      "SELECT id FROM owned_stores WHERE user_id=? AND country=?",
    )
      .bind(owner, ctx.country)
      .all()
  ).results.map((s) => s.id + 10000);
  const ids = new Set(
    (ctx.country === "CG" ? seedShopsCG : seedShops).map((s) => s.id),
  );
  owned.forEach((id) => ids.add(id));
  const catalogue = new Map(missing.map((p) => [p.id, { ...p }]));
  for (const p of priorCatalogue) {
    if (!ids.has(p.seller) || p.crossMarket || existing.has(p.id)) continue;
    const restored = { ...p, images: p.images || [p.img].filter(Boolean) };
    restored.img = restored.images[0] || null;
    if (!restored.img && catalogue.get(p.id)?.img) {
      restored.img = catalogue.get(p.id).img;
      restored.images = [restored.img];
    }
    try {
      validateProduct(restored);
      catalogue.set(p.id, restored);
    } catch {}
  }
  await env.DB.batch(
    [...catalogue.values()].map((p) =>
      env.DB.prepare(
        "INSERT INTO market_products (key,country,product_id,seller_id,owner_user_id,data,stock,revision,updated_at) VALUES (?,?,?,?,?,?,?,1,?) ON CONFLICT(key) DO NOTHING",
      ).bind(
        ctx.country + ":" + p.id,
        ctx.country,
        p.id,
        p.seller,
        owner,
        JSON.stringify(p),
        p.stock,
        Date.now(),
      ),
    ),
  );
}
export async function getMarketOrder(env, id, country) {
  const row = await env.DB.prepare(
    "SELECT * FROM market_orders WHERE id=? AND country=?",
  )
    .bind(id, country)
    .first();
  return row ? { ...JSON.parse(row.snapshot), revision: row.revision } : null;
}
export async function canReadMarketOrder(env, ctx, id) {
  return (
    ctx.isAdmin ||
    !!(await env.DB.prepare(
      "SELECT id FROM market_participants WHERE order_id=? AND user_id=?",
    )
      .bind(id, ctx.user)
      .first())
  );
}
function productData(row) {
  const product = {
    ...JSON.parse(row.data),
    stock: row.stock,
    revision: row.revision,
  };
  const supplied =
    Array.isArray(product.images) && product.images.length
      ? product.images
      : [product.img];
  product.images = [
    ...new Set(
      supplied.filter(
        (src) =>
          typeof src === "string" &&
          src.trim() &&
          src !== "product-undefined.jpg",
      ),
    ),
  ];
  const demo = (row.country === "CG" ? seedCatalogueCG : seedCatalogue).find(
    (seed) => seed.id === product.id && seed.title === product.title,
  );
  if (!product.images.length && demo?.img) product.images = [...demo.images];
  if (demo && product.images.length === 1 && product.images[0] === demo.img)
    product.images = [...demo.images];
  product.img = product.images[0] || null;
  return product;
}
function paymentLabel(order) {
  return order.paymentStatus === "cash_confirmed"
    ? "Espèces confirmées par les deux parties"
    : order.cashCourierConfirmed
      ? "Encaissement déclaré · confirmation acheteur attendue"
      : order.cashBuyerConfirmed
        ? "Paiement déclaré · confirmation encaisseur attendue"
        : "Espèces à payer à la réception";
}
function serializeOrder(order) {
  return { ...order, paymentState: paymentLabel(order), shared: true };
}
async function state(env, ctx, view) {
  if (!["buyer", "seller", "courier", "admin"].includes(view))
    fail("Vue inconnue");
  if (
    (view === "admin" && !ctx.isAdmin) ||
    (view === "seller" && !ctx.sellerIds.length) ||
    (view === "courier" && !ctx.courier)
  )
    fail("Accès à cet espace non autorisé", 403);
  const rows = (
    await env.DB.prepare("SELECT * FROM market_products WHERE country=?")
      .bind(ctx.country)
      .all()
  ).results;
  const catalogue = rows
    .map(productData)
    .filter(
      (p) =>
        (p.visible && p.approved) ||
        ctx.sellerIds.includes(p.seller) ||
        ctx.isAdmin,
    );
  const stores = (
    await env.DB.prepare(
      "SELECT s.id,s.name,s.country,i.status,i.kind,i.document_type,i.document_mime,i.issuing_country FROM owned_stores s JOIN identity_checks i ON i.user_id=s.user_id WHERE s.country=? AND i.status=?",
    )
      .bind(ctx.country, "approved")
      .all()
  ).results
    .filter((row) => approvedIdentity(row, "seller"))
    .map(({ id, name, country, status }) => ({ id, name, country, status }));
  let ordersQuery = "SELECT DISTINCT o.* FROM market_orders o";
  let args = [];
  if (view !== "admin") {
    ordersQuery +=
      " JOIN market_participants p ON p.order_id=o.id WHERE o.country=? AND p.user_id=? AND p.role=?";
    args = [ctx.country, ctx.user, view];
  } else {
    ordersQuery += " WHERE o.country=?";
    args = [ctx.country];
  }
  ordersQuery += " ORDER BY o.created_at DESC LIMIT 200";
  const orders = (
    await env.DB.prepare(ordersQuery)
      .bind(...args)
      .all()
  ).results.map((row) =>
    serializeOrder({ ...JSON.parse(row.snapshot), revision: row.revision }),
  );
  const settings = await env.DB.prepare(
    "SELECT * FROM market_couriers WHERE user_id=?",
  )
    .bind(ctx.user)
    .first();
  let opportunities = [];
  if (view === "courier" && settings?.available) {
    opportunities = (
      await env.DB.prepare(
        "SELECT id,snapshot,revision FROM market_orders WHERE country=? AND courier_user_id IS NULL ORDER BY created_at LIMIT 100",
      )
        .bind(ctx.country)
        .all()
    ).results
      .map((row) => ({
        ...JSON.parse(row.snapshot),
        id: row.id,
        revision: row.revision,
      }))
      .filter(
        (o) =>
          !o.cancelled &&
          o.requestedCourier &&
          Object.values(o.sellerAccepted).every(Boolean),
      )
      .map((o) => ({
        id: o.id,
        city: o.city,
        commune: o.commune,
        parcels: Object.keys(o.sellerSteps).length,
        fee: o.delivery.fee,
        earnings: o.courierEarnings,
        revision: o.revision,
      }));
  }
  const couriers =
    view === "admin"
      ? (
          await env.DB.prepare(
            "SELECT c.user_id AS userId,c.name,m.available,i.status,i.kind,i.document_type,i.document_mime,i.issuing_country FROM customers c JOIN identity_checks i ON i.user_id=c.user_id JOIN market_couriers m ON m.user_id=c.user_id WHERE m.country=? AND c.account_type=? AND i.kind=? AND i.status=?",
          )
            .bind(ctx.country, "courier", "courier", "approved")
            .all()
        ).results
          .filter((row) => approvedIdentity(row, "courier"))
          .map(({ userId, name, available }) => ({ userId, name, available }))
      : [];
  const profile = ctx.profile
    ? {
        ...(await accountIdentifiers(env, ctx.user, ctx.profile.account_type)),
        name: ctx.profile.name,
        firstName: ctx.profile.first_name,
        lastName: ctx.profile.last_name,
        phone: ctx.profile.phone,
        email: ctx.profile.email,
        address: ctx.profile.address,
        accountType: ctx.profile.account_type,
        privacyVersion: ctx.profile.privacy_version,
        wishlist: JSON.parse(ctx.profile.wishlist),
      }
    : null;
  return {
    userId: ctx.user,
    profile,
    view,
    roles: {
      buyer: true,
      seller: ctx.sellerIds.length > 0,
      courier: ctx.courier,
      admin: ctx.isAdmin,
    },
    sellerIds: ctx.sellerIds,
    catalogue,
    stores: stores.map((s) => ({
      id: s.id + 10000,
      name: s.name,
      country: s.country,
      reviewed: true,
    })),
    orders,
    opportunities,
    couriers,
    courierSettings: settings,
    payments: {
      electronicEnabled: false,
      escrowEnabled: false,
      reason: "Compte marchand et service escrow à activer",
    },
    remuneration: {
      courierSharePercent: 100,
      label:
        "Barème pilote : frais de livraison intégralement affectés au livreur. Aucun transfert automatique.",
    },
  };
}
function validateProduct(p) {
  if (
    !p ||
    !Number.isSafeInteger(p.id) ||
    p.id < 1 ||
    !Number.isInteger(p.seller) ||
    typeof p.title !== "string" ||
    !p.title.trim() ||
    p.title.length > 100 ||
    typeof p.category !== "string" ||
    p.category.length > 50 ||
    !Number.isSafeInteger(p.price) ||
    p.price < 1 ||
    p.price > 1e9 ||
    !Number.isInteger(p.stock) ||
    p.stock < 0 ||
    p.stock > 1e5 ||
    typeof p.visible !== "boolean" ||
    typeof p.approved !== "boolean" ||
    typeof p.desc !== "string" ||
    p.desc.length > 5000
  )
    fail("Produit invalide");
  if (
    p.subcategory &&
    (typeof p.subcategory !== "string" ||
      !marketConfig.categorySections
        .filter((s) => s[0] === p.category)
        .flatMap((s) => s[3])
        .some((c) => c[0] === p.subcategory))
  )
    fail("Sous-catégorie invalide");
  const images = p.images || [];
  if (
    !Array.isArray(images) ||
    images.length > 8 ||
    new Set(images).size !== images.length ||
    images.some((src) => !validProductImage(src)) ||
    p.img !== (images[0] || null)
  )
    fail("Galerie invalide");
}
async function saveProduct(env, ctx, p) {
  validateProduct(p);
  const key = ctx.country + ":" + p.id,
    row = await env.DB.prepare("SELECT * FROM market_products WHERE key=?")
      .bind(key)
      .first();
  if (
    row
      ? row.owner_user_id !== ctx.user && !ctx.isAdmin
      : !ctx.sellerIds.includes(p.seller)
  )
    fail("Vous pouvez gérer uniquement vos produits", 403);
  if (row && row.seller_id !== p.seller)
    fail("La boutique du produit ne peut pas être modifiée");
  if (
    !ctx.isAdmin &&
    row &&
    p.approved !== JSON.parse(row.data).approved &&
    p.approved
  )
    fail("Validation admin requise", 403);
  if (!row && !ctx.isAdmin && p.approved) fail("Validation admin requise", 403);
  if (!(await validatePhotoReferences(env, row?.owner_user_id || ctx.user, p)))
    fail("Photo rattachée à un autre produit", 403);
  const data = {
    ...(row ? JSON.parse(row.data) : {}),
    ...Object.fromEntries(
      [
        "id",
        "seller",
        "category",
        "price",
        "stock",
        "visible",
        "img",
        "images",
        "desc",
      ].map((key) => [key, p[key]]),
    ),
    subcategory: p.subcategory || "",
    title: p.title.trim(),
    approved: ctx.isAdmin ? p.approved : false,
    family: typeof p.family === "string" ? p.family.slice(0, 100) : p.category,
  };
  if (row) {
    if (p.revision !== row.revision)
      fail("Le catalogue a changé. Rechargez avant de réessayer.", 409);
    const result = await env.DB.prepare(
      "UPDATE market_products SET data=?,stock=?,revision=revision+1,updated_at=? WHERE key=? AND revision=?",
    )
      .bind(JSON.stringify(data), p.stock, Date.now(), key, p.revision)
      .run();
    if (!result.meta.changes) fail("Le catalogue a changé.", 409);
  } else {
    const result = await env.DB.prepare(
      "INSERT INTO market_products (key,country,product_id,seller_id,owner_user_id,data,stock,revision,updated_at) VALUES (?,?,?,?,?,?,?,1,?) ON CONFLICT(key) DO NOTHING",
    )
      .bind(
        key,
        ctx.country,
        p.id,
        p.seller,
        ctx.user,
        JSON.stringify(data),
        p.stock,
        Date.now(),
      )
      .run();
    if (!result.meta.changes)
      fail("Identifiant produit déjà utilisé. Rechargez le catalogue.", 409);
  }
  return { ok: true };
}
function deliveryFee(country, mode, city, commune, count) {
  if (country === "CD" && !marketConfig.deliverableCities.includes(city))
    fail(
      "Les commandes sont ouvertes uniquement à Kinshasa et Lubumbashi. Cette ville sera disponible lors de l’extension.",
    );
  const cities = country === "CG" ? deliveryCommunesCG : deliveryCommunes;
  if (!cities[city] || !["home", "express", "hand", "relay"].includes(mode))
    fail("Livraison invalide");
  if (mode === "hand") return 0;
  if (!cities[city].includes(commune)) fail("Commune invalide");
  if (mode === "relay") return 3500 * count;
  const norm = (s) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  const tariff =
    country === "CD" && city === "Kinshasa"
      ? deliveryTariffs.find((r) => norm(r[2]) === norm(commune))
      : null;
  if (country === "CD" && city === "Kinshasa" && !tariff)
    fail("Commune non couverte");
  return (
    ((tariff?.[5] ||
      (country === "CD" ? marketConfig.deliveryRates[city]?.[commune] : null) ||
      7500) +
      (mode === "express" ? 7500 : 0)) *
    count
  );
}
async function createOrder(env, ctx, d) {
  if (!ctx.profile) fail("Créez votre compte avant de commander", 409);
  if (typeof d.requestKey !== "string" || !/^[a-f0-9-]{36}$/.test(d.requestKey))
    fail("Identifiant de commande invalide");
  const requestKey = ctx.user + ":" + d.requestKey,
    previous = await env.DB.prepare(
      "SELECT id FROM market_orders WHERE request_key=?",
    )
      .bind(requestKey)
      .first();
  if (previous)
    return {
      order: serializeOrder(
        await getMarketOrder(env, previous.id, ctx.country),
      ),
    };
  if (d.paymentId !== "cod")
    fail(
      "Paiements électroniques et escrow non activés : choisissez le paiement à réception.",
      503,
    );
  if (
    !Array.isArray(d.items) ||
    !d.items.length ||
    d.items.length > 100 ||
    new Set(d.items.map((i) => i.id)).size !== d.items.length ||
    d.items.some(
      (i) =>
        !Number.isInteger(i.id) ||
        !Number.isInteger(i.q) ||
        i.q < 1 ||
        i.q > 100,
    )
  )
    fail("Panier invalide");
  if (
    !d.recipient ||
    typeof d.recipient.name !== "string" ||
    !d.recipient.name.trim() ||
    d.recipient.name.length > 100 ||
    typeof d.recipient.phone !== "string" ||
    !d.recipient.phone.trim() ||
    d.recipient.phone.length > 30 ||
    typeof d.address !== "string" ||
    d.address.length > 150
  )
    fail("Destinataire invalide");
  const rows = [];
  for (const item of d.items) {
    const row = await env.DB.prepare(
      "SELECT * FROM market_products WHERE key=?",
    )
      .bind(ctx.country + ":" + item.id)
      .first();
    if (!row) fail("Produit indisponible", 409);
    const p = productData(row);
    if (!p.approved || !p.visible || row.stock < item.q)
      fail("Un article est indisponible. Vérifiez votre panier.", 409);
    rows.push({ row, p, q: item.q });
  }
  const sellerIds = [...new Set(rows.map((r) => r.p.seller))],
    mode = d.delivery?.mode,
    fee = deliveryFee(ctx.country, mode, d.city, d.commune, sellerIds.length);
  if (["home", "express"].includes(mode) && !d.address.trim())
    fail("Adresse requise");
  const id =
      "YV-" +
      crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase(),
    at = Date.now();
  const items = rows.map(({ p, q }) => ({
    id: p.id,
    q,
    price: p.price,
    seller: p.seller,
    title: p.title,
    img: p.img,
  }));
  const order = {
    id,
    createdAt: at,
    city: d.city,
    commune: d.commune,
    address: d.address.trim(),
    recipient: d.recipient,
    buyerUserId: ctx.user,
    assignedCourier: null,
    courierUserId: null,
    courierName: null,
    requestedCourier: ["home", "express"].includes(mode) ? "yaviya" : null,
    courierStatus: "unassigned",
    cancelled: false,
    buyerConfirmed: false,
    step: 0,
    paymentId: "cod",
    payment: "Espèces à réception",
    paymentStatus: "cash_due",
    cashBuyerConfirmed: false,
    cashCourierConfirmed: false,
    escrowStatus: "not_available",
    items,
    total: items.reduce((n, i) => n + i.price * i.q, 0) + fee,
    delivery: {
      mode,
      courier: ["home", "express"].includes(mode) ? "yaviya" : null,
      fee,
      relay: mode === "relay" ? "Relais à confirmer" : null,
    },
    sellerSteps: Object.fromEntries(sellerIds.map((id) => [id, 0])),
    sellerAccepted: Object.fromEntries(sellerIds.map((id) => [id, false])),
    sellerCashConfirmed: Object.fromEntries(sellerIds.map((id) => [id, false])),
    courierEarnings: fee,
    courierExpenses: 0,
    courierNet: fee,
    courierPayout: { status: "awaiting_delivery", reference: null },
    events: ["Commande créée · validation vendeur en attente"],
    shared: true,
  };
  const availableConditions = rows
      .map(
        () =>
          "(SELECT stock FROM market_products WHERE key=?)>=? AND (SELECT revision FROM market_products WHERE key=?)=?",
      )
      .join(" AND "),
    stockArgs = rows.flatMap((r) => [
      r.row.key,
      r.q,
      r.row.key,
      r.row.revision,
    ]);
  const statements = [
    env.DB.prepare(
      "INSERT INTO market_orders (id,country,buyer_user_id,request_key,snapshot,revision,created_at,updated_at) SELECT ?,?,?,?,?,1,?,? WHERE " +
        availableConditions +
        " ON CONFLICT DO NOTHING",
    ).bind(
      id,
      ctx.country,
      ctx.user,
      requestKey,
      JSON.stringify(order),
      at,
      at,
      ...stockArgs,
    ),
  ];
  for (const { row, q } of rows)
    statements.push(
      env.DB.prepare(
        "UPDATE market_products SET stock=stock-?,revision=revision+1 WHERE key=? AND EXISTS (SELECT 1 FROM market_orders WHERE id=?)",
      ).bind(q, row.key, id),
    );
  statements.push(
    env.DB.prepare(
      "INSERT INTO market_participants (id,order_id,user_id,role,seller_id) SELECT ?,?,?,?,0 WHERE EXISTS (SELECT 1 FROM market_orders WHERE id=?)",
    ).bind(id + ":buyer", id, ctx.user, "buyer", id),
  );
  for (const seller of sellerIds) {
    const owner = rows.find((r) => r.p.seller === seller).row.owner_user_id;
    statements.push(
      env.DB.prepare(
        "INSERT INTO market_participants (id,order_id,user_id,role,seller_id) SELECT ?,?,?,?,? WHERE EXISTS (SELECT 1 FROM market_orders WHERE id=?)",
      ).bind(id + ":seller:" + seller, id, owner, "seller", seller, id),
    );
  }
  await env.DB.batch(statements);
  const saved = await env.DB.prepare(
    "SELECT id FROM market_orders WHERE request_key=?",
  )
    .bind(requestKey)
    .first();
  if (!saved) fail("Stock modifié pendant la commande. Réessayez.", 409);
  return {
    order: serializeOrder(await getMarketOrder(env, saved.id, ctx.country)),
  };
}
function refreshSettlement(o) {
  if (!o.requestedCourier)
    o.cashCourierConfirmed = Object.values(o.sellerCashConfirmed || {}).every(
      Boolean,
    );
  if (o.cashBuyerConfirmed && o.cashCourierConfirmed)
    o.paymentStatus = "cash_confirmed";
  if (o.courierPayout.status !== "paid_manual")
    o.courierPayout.status =
      o.buyerConfirmed && o.paymentStatus === "cash_confirmed"
        ? "due"
        : o.step === 3
          ? "awaiting_receipt"
          : "awaiting_delivery";
  o.courierNet = o.courierEarnings - o.courierExpenses;
}
async function mutateOrder(env, ctx, d, photo) {
  const o = await getMarketOrder(env, d.orderId, ctx.country);
  if (!o) fail("Commande introuvable", 404);
  if (o.revision !== d.revision)
    fail("La commande a changé. Rechargez avant de réessayer.", 409);
  const seller = Number(d.sellerId),
    isSeller =
      ctx.sellerIds.includes(seller) &&
      !!(await env.DB.prepare(
        "SELECT id FROM market_participants WHERE order_id=? AND user_id=? AND role=? AND seller_id=?",
      )
        .bind(o.id, ctx.user, "seller", seller)
        .first());
  const isCourier = o.courierUserId === ctx.user && ctx.courier,
    allAccepted = Object.values(o.sellerAccepted).every(Boolean),
    allPrepared = Object.values(o.sellerSteps).every((n) => n >= 1);
  if (o.cancelled) fail("Commande annulée", 409);
  let label = "",
    restoreStock = false;
  if (
    [
      "seller_accept",
      "seller_decline",
      "seller_prepare",
      "seller_handover",
    ].includes(d.action)
  ) {
    if (!isSeller) fail("Cette commande ne concerne pas votre boutique", 403);
    if (d.action === "seller_accept") {
      if (o.sellerAccepted[seller]) fail("Commande déjà acceptée", 409);
      o.sellerAccepted[seller] = true;
      label = "Commande acceptée par le vendeur";
    }
    if (d.action === "seller_decline") {
      if (o.step >= 2) fail("Le colis est déjà en livraison", 409);
      o.cancelled = true;
      restoreStock = true;
      label = "Commande refusée par le vendeur";
    }
    if (d.action === "seller_prepare") {
      if (!allAccepted || o.sellerSteps[seller] !== 0)
        fail("Attendez la validation de chaque vendeur", 409);
      o.sellerSteps[seller] = 1;
      o.step = Math.min(...Object.values(o.sellerSteps));
      label = "Colis prêt chez le vendeur";
    }
    if (d.action === "seller_handover") {
      if (o.requestedCourier || !allPrepared)
        fail("Remise non disponible", 409);
      o.sellerSteps[seller] = 3;
      o.sellerCashConfirmed[seller] = d.cashCollected === true;
      o.step = Math.min(...Object.values(o.sellerSteps));
      label = "Remise confirmée par le vendeur";
    }
  } else if (d.action === "courier_claim") {
    const settings = await env.DB.prepare(
      "SELECT available,benefits_accepted FROM market_couriers WHERE user_id=?",
    )
      .bind(ctx.user)
      .first();
    if (!ctx.courier || !settings?.available || !settings.benefits_accepted)
      fail("Activez votre disponibilité après validation du compte", 403);
    if (o.courierUserId || !o.requestedCourier || !allAccepted)
      fail("Mission déjà affectée ou non disponible", 409);
    o.courierUserId = ctx.user;
    o.assignedCourier = ctx.user;
    o.courierName = ctx.profile.name;
    o.courierStatus = "accepted";
    label = "Mission acceptée par " + ctx.profile.name;
  } else if (d.action === "courier_collect") {
    if (!isCourier) fail("Vous n’êtes pas le livreur affecté", 403);
    if (o.courierStatus !== "accepted" || !allPrepared)
      fail("Attendez que tous les colis soient prêts", 409);
    o.courierStatus = "collected";
    o.step = 2;
    Object.keys(o.sellerSteps).forEach((id) => (o.sellerSteps[id] = 2));
    label = "Colis récupéré · en livraison";
  } else if (d.action === "courier_deliver") {
    if (!isCourier) fail("Vous n’êtes pas le livreur affecté", 403);
    if (o.courierStatus !== "collected" || !photo)
      fail("Récupérez le colis et ajoutez la photo de livraison", 409);
    o.deliveryProof = photo;
    o.courierStatus = "delivered";
    o.step = 3;
    o.cashCourierConfirmed = d.cashCollected === true;
    Object.keys(o.sellerSteps).forEach((id) => (o.sellerSteps[id] = 3));
    label = "Livraison confirmée avec preuve photo";
  } else if (d.action === "buyer_receipt") {
    if (o.buyerUserId !== ctx.user)
      fail("Seul l’acheteur confirme la réception", 403);
    if (o.step !== 3 || o.buyerConfirmed) fail("Réception non disponible", 409);
    o.buyerConfirmed = true;
    o.cashBuyerConfirmed = d.cashPaid === true;
    label = "Réception confirmée par l’acheteur";
  } else if (d.action === "cash_confirm") {
    if (o.step !== 3) fail("Attendez la livraison", 409);
    if (o.buyerUserId === ctx.user && d.side === "buyer")
      o.cashBuyerConfirmed = true;
    else if (isCourier && d.side === "courier") o.cashCourierConfirmed = true;
    else if (isSeller && !o.requestedCourier && d.side === "seller")
      o.sellerCashConfirmed[seller] = true;
    else fail("Confirmation de paiement non autorisée", 403);
    label = "Paiement en espèces déclaré";
  } else if (d.action === "courier_expenses") {
    if (!isCourier) fail("Livreur affecté uniquement", 403);
    if (o.courierPayout.status === "paid_manual")
      fail("Rémunération déjà réglée", 409);
    if (!Number.isSafeInteger(d.expenses) || d.expenses < 0 || d.expenses > 1e9)
      fail("Frais de mission invalides");
    o.courierExpenses = d.expenses;
    label = "Frais de mission enregistrés";
  } else if (d.action === "courier_payout") {
    if (!ctx.isAdmin) fail("Administration uniquement", 403);
    if (o.courierPayout.status !== "due" || !o.courierUserId)
      fail(
        "La livraison, la réception et le paiement doivent être confirmés",
        409,
      );
    if (
      typeof d.reference !== "string" ||
      !d.reference.trim() ||
      d.reference.length > 150 ||
      !["mobile_money", "bank", "cash"].includes(d.channel)
    )
      fail("Renseignez la référence du règlement effectué");
    o.courierPayout = {
      status: "paid_manual",
      reference: d.reference.trim(),
      channel: d.channel,
      at: Date.now(),
      recordedBy: ctx.user,
    };
    label = "Règlement du livreur déclaré par l’administration";
  } else fail("Action inconnue");
  refreshSettlement(o);
  o.events.push(label + " · " + new Date().toISOString());
  o.events = o.events.slice(-200);
  o.mutationToken = crypto.randomUUID();
  const token = o.mutationToken,
    revision = o.revision;
  delete o.revision;
  const statements = [
    env.DB.prepare(
      "UPDATE market_orders SET snapshot=?,courier_user_id=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?",
    ).bind(JSON.stringify(o), o.courierUserId, Date.now(), o.id, revision),
  ];
  if (d.action === "courier_claim")
    statements.push(
      env.DB.prepare(
        "INSERT INTO market_participants (id,order_id,user_id,role,seller_id) SELECT ?,?,?,?,0 WHERE EXISTS (SELECT 1 FROM market_orders WHERE id=? AND json_extract(snapshot,?)=?) ON CONFLICT(id) DO NOTHING",
      ).bind(
        o.id + ":courier",
        o.id,
        ctx.user,
        "courier",
        o.id,
        "$.mutationToken",
        token,
      ),
    );
  if (restoreStock)
    for (const i of o.items)
      statements.push(
        env.DB.prepare(
          "UPDATE market_products SET stock=stock+?,revision=revision+1 WHERE key=? AND EXISTS (SELECT 1 FROM market_orders WHERE id=? AND json_extract(snapshot,?)=?)",
        ).bind(i.q, ctx.country + ":" + i.id, o.id, "$.mutationToken", token),
      );
  const result = await env.DB.batch(statements);
  if (!result[0].meta.changes) fail("La commande a changé. Rechargez.", 409);
  return { order: serializeOrder({ ...o, revision: revision + 1 }) };
}
export async function handleMarketplace(request, env) {
  const user = request.headers.get("yaviya-user-id"),
    url = new URL(request.url);
  if (!user) return json({ error: "Connexion requise" }, 401);
  if (request.method !== "GET" && request.headers.get("origin") !== url.origin)
    return json({ error: "Origine refusée" }, 403);
  try {
    const ctx = await marketContext(env, user);
    await ensureSeeds(env, ctx);
    const path = url.pathname,
      view = url.searchParams.get("view") || "buyer";
    if (path === "/api/marketplace" && request.method === "GET")
      return json(await state(env, ctx, view));
    if (path === "/api/marketplace/payments")
      return request.method === "GET"
        ? json({
            electronicEnabled: false,
            escrowEnabled: false,
            reason: "Activation du prestataire nécessaire",
          })
        : json(
            {
              error:
                "Paiement électronique et escrow non activés. Aucun fonds ne sera débité.",
            },
            503,
          );
    if (path === "/api/marketplace/catalogue" && request.method === "POST")
      return json(await saveProduct(env, ctx, await request.json()));
    if (path === "/api/marketplace/orders" && request.method === "POST")
      return json(await createOrder(env, ctx, await request.json()), 201);
    if (path === "/api/marketplace/orders/action" && request.method === "POST")
      return json(await mutateOrder(env, ctx, await request.json()));
    if (path === "/api/marketplace/courier" && request.method === "POST") {
      if (!ctx.courier) fail("Identité livreur validée requise", 403);
      const d = await request.json();
      if (
        typeof d.available !== "boolean" ||
        !["mobile_money", "bank", "cash"].includes(d.payoutMethod) ||
        typeof d.payoutAccount !== "string" ||
        d.payoutAccount.length > 150 ||
        d.benefitsAccepted !== true ||
        (d.payoutMethod !== "cash" && !d.payoutAccount.trim())
      )
        fail("Complétez les conditions et vos coordonnées de règlement");
      await env.DB.prepare(
        "INSERT INTO market_couriers (user_id,country,available,payout_method,payout_account,benefits_accepted) VALUES (?,?,?,?,?,1) ON CONFLICT(user_id) DO UPDATE SET available=excluded.available,payout_method=excluded.payout_method,payout_account=excluded.payout_account,benefits_accepted=1",
      )
        .bind(
          user,
          ctx.country,
          d.available ? 1 : 0,
          d.payoutMethod,
          d.payoutAccount.trim(),
        )
        .run();
      return json({ ok: true });
    }
    if (path === "/api/marketplace/messages") {
      const id =
          request.method === "GET" ? url.searchParams.get("orderId") : null,
        d = request.method === "POST" ? await request.json() : null,
        orderId = id || d?.orderId;
      const o = await getMarketOrder(env, orderId, ctx.country);
      if (!o || !(await canReadMarketOrder(env, ctx, orderId)))
        fail("Discussion réservée aux participants", 403);
      if (request.method === "GET") {
        const messages = (
          await env.DB.prepare(
            "SELECT m.id,m.sender_role AS senderRole,m.message,m.created_at AS createdAt,c.name AS senderName FROM market_messages m LEFT JOIN customers c ON c.user_id=m.sender_user_id WHERE m.order_id=? ORDER BY m.created_at DESC,m.rowid DESC LIMIT 100",
          )
            .bind(orderId)
            .all()
        ).results.reverse();
        return json(messages);
      }
      if (request.method !== "POST") fail("Méthode non autorisée", 405);
      const role = d.view || "buyer",
        participant = await env.DB.prepare(
          "SELECT id FROM market_participants WHERE order_id=? AND user_id=? AND role=?",
        )
          .bind(orderId, user, role)
          .first();
      if (role === "admin" ? !ctx.isAdmin : !participant)
        fail("Rôle non autorisé dans cette discussion", 403);
      if (
        typeof d.message !== "string" ||
        !d.message.trim() ||
        d.message.length > 2000
      )
        fail("Message de 1 à 2000 caractères requis");
      await env.DB.prepare(
        "INSERT INTO market_messages (id,order_id,sender_user_id,sender_role,message,created_at) VALUES (?,?,?,?,?,?)",
      )
        .bind(
          crypto.randomUUID(),
          orderId,
          user,
          role,
          d.message.trim(),
          Date.now(),
        )
        .run();
      return json({ ok: true });
    }
    if (path === "/api/marketplace/proof") {
      if (request.method === "GET") {
        const o = await getMarketOrder(
          env,
          url.searchParams.get("orderId"),
          ctx.country,
        );
        if (
          !o ||
          !(await canReadMarketOrder(env, ctx, o.id)) ||
          !o.deliveryProof
        )
          fail("Preuve introuvable", 404);
        const object = await env.IDENTITY_FILES.get(o.deliveryProof.key);
        if (!object) fail("Preuve introuvable", 404);
        return new Response(object.body, {
          headers: {
            "Content-Type": o.deliveryProof.type,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
      if (request.method !== "POST") fail("Méthode non autorisée", 405);
      const form = await request.formData(),
        file = form.get("photo"),
        orderId = form.get("orderId");
      const o = await getMarketOrder(env, orderId, ctx.country);
      if (!ctx.courier || o?.courierUserId !== user)
        fail("Seul le livreur affecté peut joindre la preuve", 403);
      if (
        !file ||
        typeof file.arrayBuffer !== "function" ||
        !file.size ||
        file.size > 8 * 1024 * 1024 ||
        form.get("delivered") !== "true"
      )
        fail("Photo JPG ou PNG de 8 Mo maximum requise");
      const bytes = await file.arrayBuffer(),
        b = new Uint8Array(bytes),
        type =
          b[0] === 255 && b[1] === 216 && b[2] === 255
            ? "image/jpeg"
            : b.length >= 8 &&
                b[0] === 137 &&
                b[1] === 80 &&
                b[2] === 78 &&
                b[3] === 71 &&
                b[4] === 13 &&
                b[5] === 10 &&
                b[6] === 26 &&
                b[7] === 10
              ? "image/png"
              : null;
      if (!type || type !== file.type) fail("Photo invalide");
      const key = "shared-delivery/" + crypto.randomUUID();
      await env.IDENTITY_FILES.put(key, bytes, {
        httpMetadata: { contentType: type },
      });
      try {
        return json(
          await mutateOrder(
            env,
            ctx,
            {
              action: "courier_deliver",
              orderId,
              revision: Number(form.get("revision")),
              cashCollected: form.get("cashCollected") === "true",
            },
            { key, type, at: Date.now() },
          ),
        );
      } catch (e) {
        await env.IDENTITY_FILES.delete(key);
        throw e;
      }
    }
    return json({ error: "Introuvable" }, 404);
  } catch (e) {
    if (!e.status) console.error("Shared commerce unavailable", e);
    return json(
      { error: e.status ? e.message : "Service indisponible. Réessayez." },
      e.status || 503,
    );
  }
}
