// Server-backed product metrics. An unavailable service is never displayed as zero.
const productBuyerCounts = new Map();
let insightCountPending = false,
  insightCountQueued = false;
function insightUrl(path, country = window.YAVIYA_COUNTRY || "CD") {
  const url = new URL("/api/product-insights" + path, location.origin);
  url.searchParams.set("country", country);
  return url;
}
function buyerCountMarkup(id) {
  const count = productBuyerCounts.get(id);
  return `<p class="product-buyers" data-product-buyers="${id}" ${Number.isSafeInteger(count) ? 'title="' + T("Comptes distincts ayant confirmé la réception · parcours de démonstration", "Distinct accounts with confirmed receipt · demonstration flow") + '"' : ""}>${Number.isSafeInteger(count) ? count + " " + T("acheteur(s) · réception confirmée", "buyer(s) · confirmed receipt") : T("Achats : données indisponibles", "Purchases: data unavailable")}</p>`;
}
function updateBuyerCounts() {
  document.querySelectorAll("[data-product-buyers]").forEach((node) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = buyerCountMarkup(Number(node.dataset.productBuyers));
    node.replaceWith(wrapper.firstChild);
  });
}
async function refreshBuyerCounts() {
  if (insightCountPending) {
    insightCountQueued = true;
    return;
  }
  const ids = [
    ...new Set(
      products
        .filter((p) => p.visible && p.approved && shopOf(p))
        .map((p) => p.id),
    ),
  ];
  if (!ids.length) return;
  insightCountPending = true;
  try {
    for (let i = 0; i < ids.length; i += 100) {
      const url = insightUrl("");
      url.searchParams.set("ids", ids.slice(i, i + 100).join(","));
      const r = await fetch(url.pathname + url.search);
      if (!r.ok) throw Error();
      const data = await r.json();
      for (const id of ids.slice(i, i + 100)) productBuyerCounts.delete(id);
      for (const row of data.products)
        if (Number.isSafeInteger(row.buyerCount))
          productBuyerCounts.set(row.productId, row.buyerCount);
    }
  } catch {
    productBuyerCounts.clear();
  } finally {
    insightCountPending = false;
    updateBuyerCounts();
    if (insightCountQueued) {
      insightCountQueued = false;
      refreshBuyerCounts();
    }
  }
}
const insightCard = card;
card = function (product) {
  return insightCard(product).replace(
    '<div class="product-info">',
    '<div class="product-info">' + buyerCountMarkup(product.id),
  );
};
const insightProductDetails = showProductDetails;
showProductDetails = function (id) {
  insightProductDetails(id);
  const info = $(".product-detail-info");
  if (!info) return;
  info.insertAdjacentHTML(
    "beforeend",
    `${buyerCountMarkup(id)}<button type="button" class="add product-help" data-open-chat>${T("Besoin d’aide pour ce produit ?", "Need help with this product?")}</button>`,
  );
  const url = insightUrl("/view");
  // Only opening a product details page counts as a view, not rendering a card.
  fetch(url.pathname + url.search, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: id }),
  }).catch(() => {});
  refreshBuyerCounts();
};
showSupport = function () {
  setChat(true);
};
const insightRender = render;
render = function () {
  insightRender();
  refreshBuyerCounts();
};
const insightLoadMarket = loadMarket;
loadMarket = async function (...args) {
  const result = await insightLoadMarket(...args);
  if (result) refreshBuyerCounts();
  return result;
};
const insightPeriods = {
  7: ["7 jours", "7 days"],
  30: ["30 jours", "30 days"],
  quarter: ["90 jours", "90 days"],
  semester: ["180 jours", "180 days"],
  year: ["365 jours", "365 days"],
  all: ["Tout l’historique", "All history"],
};
let productInsightPeriod = "30",
  productInsightCountry = "ALL",
  productInsightSeller = "";
function insightStatisticsFrame(role) {
  return `<section class="product-insights"><div class="overview-toolbar"><h2>${T(role === "admin" ? "Statistiques produits centralisées" : "Statistiques de mes produits", role === "admin" ? "Central product statistics" : "My product statistics")}</h2><label>${T("Période", "Period")}<select data-insight-period>${Object.entries(
    insightPeriods,
  )
    .map(
      ([id, labels]) =>
        `<option value="${id}" ${productInsightPeriod === id ? "selected" : ""}>${T(...labels)}</option>`,
    )
    .join(
      "",
    )}</select></label>${role === "admin" ? `<label>${T("Marché", "Market")}<select data-insight-country><option value="ALL">${T("Tous les marchés", "All markets")}</option><option value="CD">RDC</option><option value="CG">${T("République du Congo", "Republic of Congo")}</option></select></label><label>${T("Boutique", "Store")}<select data-insight-seller><option value="">${T("Toutes les boutiques", "All stores")}</option></select></label>` : ""}<button class="add" type="button" data-insight-refresh>${T("Actualiser", "Refresh")}</button></div><p class="demo-note">${T("Données enregistrées sur le serveur, communes au vendeur et à l’admin. Visiteurs distincts par compte connecté ou navigateur ; les consultations du propriétaire et de l’admin sont exclues. Achats : commandes créées dans la période avec réception confirmée, hors commandes annulées. Les parcours restent en démonstration.", "Server records shared by the seller and administrator. Distinct visitors by signed-in account or browser; owner and administrator previews are excluded. Purchases: orders placed during the period with confirmed receipt, excluding cancellations. Shopping flows remain a demonstration.")}</p><div data-insight-result role="status">${T("Chargement des statistiques…", "Loading statistics…")}</div></section>`;
}
function insightTable(data) {
  return `<div class="dashboard-kpis">${[
    ["Visiteurs distincts", "Distinct visitors", "uniqueViewers"],
    ["Consultations", "Views", "views"],
    ["Acheteurs distincts", "Distinct buyers", "buyerCount"],
    ["Commandes reçues", "Received orders", "confirmedOrders"],
  ]
    .map(
      ([fr, en, key]) =>
        `<div><span>${T(fr, en)}</span><b>${data.totals[key]}</b></div>`,
    )
    .join("")}</div><div class="table-wrap"><table><thead><tr>${[
    ["Produit", "Product"],
    ["Boutique / marché", "Store / market"],
    ["Visiteurs distincts", "Distinct visitors"],
    ["Consultations", "Views"],
    ["Acheteurs", "Buyers"],
    ["Commandes reçues", "Received orders"],
    ["Articles reçus", "Items received"],
  ]
    .map((labels) => `<th scope="col">${T(...labels)}</th>`)
    .join(
      "",
    )}</tr></thead><tbody>${data.rows.map((row) => `<tr><td>${esc(row.title)} <small>#${row.productId}</small></td><td>${esc(row.sellerName)} · ${esc(row.country)}</td><td>${row.uniqueViewers}</td><td>${row.views}</td><td>${row.buyerCount}</td><td>${row.confirmedOrders}</td><td>${row.unitsSold}</td></tr>`).join("") || `<tr><td colspan="7">${T("Aucun produit pour ce filtre.", "No products for this filter.")}</td></tr>`}</tbody></table></div><p class="demo-note">${T("Les totaux distincts sont dédupliqués sur tous les produits : ils ne sont pas la somme des lignes.", "Distinct totals are deduplicated across all products; they are not sums of the rows.")}</p>`;
}
async function loadProductStatistics(host, role) {
  const result = host.querySelector("[data-insight-result]");
  const country =
    role === "admin" ? productInsightCountry : window.YAVIYA_COUNTRY || "CD";
  const url = insightUrl("/report", country);
  url.searchParams.set("period", productInsightPeriod);
  if (role === "seller") url.searchParams.set("sellerId", selectedSeller);
  else if (productInsightSeller) {
    const [storeCountry, id] = productInsightSeller.split(":");
    url.searchParams.set("country", storeCountry);
    url.searchParams.set("sellerId", id);
  }
  const requestKey = url.pathname + url.search;
  if (host.insightPending) {
    if (host.insightRequestKey !== requestKey) {
      host.dataset.insightRevision = String(
        Number(host.dataset.insightRevision || 0) + 1,
      );
      host.insightQueued = true;
    }
    return;
  }
  host.insightPending = true;
  host.insightRequestKey = requestKey;
  const revision = String(Number(host.dataset.insightRevision || 0) + 1);
  host.dataset.insightRevision = revision;
  result.textContent = T("Chargement des statistiques…", "Loading statistics…");
  try {
    const response = await fetch(requestKey);
    if (!response.ok) throw Error();
    const data = await response.json();
    if (!host.isConnected || host.dataset.insightRevision !== revision) return;
    result.innerHTML = insightTable(data);
    const selector = host.querySelector("[data-insight-seller]");
    if (selector && !productInsightSeller) {
      const stores = new Map(
        data.rows.map((row) => [
          row.country + ":" + row.sellerId,
          row.sellerName + " · " + row.country,
        ]),
      );
      selector.innerHTML =
        `<option value="">${T("Toutes les boutiques", "All stores")}</option>` +
        [...stores]
          .map(([id, name]) => `<option value="${id}">${esc(name)}</option>`)
          .join("");
    }
  } catch {
    if (host.isConnected && host.dataset.insightRevision === revision)
      result.innerHTML = `<p>${T("Statistiques indisponibles. Vérifiez votre connexion et l’accès au serveur, puis actualisez.", "Statistics unavailable. Check your connection and server access, then refresh.")}</p>`;
  } finally {
    host.insightPending = false;
    if (host.insightQueued && host.isConnected) {
      host.insightQueued = false;
      loadProductStatistics(host, role);
    }
  }
}
for (const role of ["seller", "admin"])
  dashboardTabs[role].push([
    "productStats",
    "Statistiques produits",
    "Product statistics",
  ]);
function installProductStatistics(role) {
  const host = $("[data-dashboard-panel=productStats]");
  if (!host) return;
  host.innerHTML = insightStatisticsFrame(role);
  if (role === "admin") {
    host.querySelector("[data-insight-country]").value = productInsightCountry;
    const selector = host.querySelector("[data-insight-seller]");
    if (productInsightSeller)
      selector.insertAdjacentHTML(
        "beforeend",
        `<option value="${productInsightSeller}" selected>${T("Boutique", "Store")} ${productInsightSeller}</option>`,
      );
  }
  host.onchange = (event) => {
    if (event.target.matches("[data-insight-period]"))
      productInsightPeriod = event.target.value;
    if (event.target.matches("[data-insight-country]")) {
      productInsightCountry = event.target.value;
      productInsightSeller = "";
      host.querySelector("[data-insight-seller]").value = "";
    }
    if (event.target.matches("[data-insight-seller]"))
      productInsightSeller = event.target.value;
    loadProductStatistics(host, role);
  };
  host.querySelector("[data-insight-refresh]").onclick = () =>
    loadProductStatistics(host, role);
  $("[data-dashboard-panel=overview]")?.insertAdjacentHTML(
    "afterbegin",
    `<button class="add" data-dashboard-tab="productStats">${T("Voir les vues et les achats de mes produits", "View product views and purchases")}</button>`,
  );
  loadProductStatistics(host, role);
}
const insightSeller = showSeller;
showSeller = function () {
  insightSeller();
  if (marketState?.roles.seller) installProductStatistics("seller");
};
const insightAdmin = showAdmin;
showAdmin = function () {
  insightAdmin();
  if (marketState?.roles.admin) installProductStatistics("admin");
};
const insightRedrawMarket = redrawMarket;
redrawMarket = function () {
  const host = $("[data-dashboard-panel=productStats]");
  if (["seller", "admin"].includes(activeRole) && host && !host.hidden) {
    loadProductStatistics(host, activeRole);
    return;
  }
  insightRedrawMarket();
};
render();
if (activeRole === "seller") showSeller();
if (activeRole === "admin") showAdmin();
