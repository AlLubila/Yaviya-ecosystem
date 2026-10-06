// Country publication settings are explicitly scoped to this browser demo session.
const sellerCountryLabels = {
  CD: ["République démocratique du Congo", "Democratic Republic of the Congo"],
  CG: ["République du Congo", "Republic of the Congo"],
};
function sellerMarketsMarkup(shop) {
  const saved = readSellerMarkets()[shop.id],
    countries = saved?.countries || [shop.homeCountry],
    other = shop.homeCountry === "CD" ? "CG" : "CD",
    unit = other === "CD" ? "FC" : "FCFA",
    items = products.filter((p) => p.seller === shop.id && !p.crossMarket);
  return `<section class="seller-markets"><h2>${T("Pays de vente", "Selling countries")}</h2><p>${T("Pays de votre boutique : ", "Shop country: ")}<b>${T(...sellerCountryLabels[shop.homeCountry])}</b></p><form id="seller-markets-form"><fieldset><legend>${T("Où souhaitez-vous vendre ?", "Where do you want to sell?")}</legend>${Object.entries(
    sellerCountryLabels,
  )
    .map(
      ([id, label]) =>
        `<label><input type="checkbox" name="selling-country" value="${id}" ${countries.includes(id) ? "checked" : ""}>${T(...label)}</label>`,
    )
    .join(
      "",
    )}</fieldset><h3>${T("Prix pour le second pays", "Prices for the second country")} · ${unit}</h3><p>${T("Définissez les prix dans la monnaie du marché de destination. Aucun taux de change automatique n’est appliqué.", "Set prices in the destination market currency. No automatic exchange rate is applied.")}</p><div class="table-wrap"><table><thead><tr><th>${T("Produit", "Product")}</th><th>${T("Prix", "Price")} (${unit})</th></tr></thead><tbody>${items.map((p) => `<tr><td>${esc(p.title)}</td><td><input aria-label="${esc(p.title)} · ${unit}" type="number" min="1" max="1000000000" step="1" name="market-price-${p.id}" placeholder="${T("À renseigner", "Enter a price")}" value="${saved?.prices?.[p.id] || ""}"></td></tr>`).join("")}</tbody></table></div><p class="demo-note">${T("Choix conservé pendant cette session de démonstration, y compris lorsque vous changez de pays. Seuls les produits validés, visibles et dotés d’un prix pour le second pays y sont proposés. La vente transfrontalière réelle nécessite des modalités de transport et de paiement adaptées.", "Selection saved for this demo session, including country switches. Only approved, visible products with a destination price are offered in the second country. Real cross-border sales require appropriate delivery and payment arrangements.")}</p><button class="primary">${T("Enregistrer mes pays de vente", "Save selling countries")}</button><p id="seller-markets-message" role="status"></p></form></section>`;
}
function importCrossMarketSellers() {
  const records = readSellerMarkets();
  for (const record of Object.values(records)) {
    if (
      record.shop.homeCountry === window.YAVIYA_COUNTRY ||
      !record.countries.includes(window.YAVIYA_COUNTRY)
    )
      continue;
    const shop = {
      ...record.shop,
      marketCountries: record.countries,
      crossMarket: true,
    };
    shops.push(shop);
    record.products.forEach((p) =>
      products.push({
        ...p,
        id: 1000 + shop.id * 50 + p.id,
        price: record.prices[p.id],
        regularPrice: undefined,
        offer: undefined,
        crossMarket: true,
        originProduct: p.id,
      }),
    );
  }
}
importCrossMarketSellers();
function refreshSellerMarketFilter() {
  const select = $("#vendor-filter");
  select.innerHTML = `<option value="">${T("Toutes les boutiques", "All shops")}</option>${shops
    .filter(sellerInCurrentMarket)
    .map((s) => `<option value="${s.id}">${esc(s.name)}</option>`)
    .join("")}`;
  if (shops.some((s) => s.id === +sellerFilter && sellerInCurrentMarket(s)))
    select.value = sellerFilter;
  else sellerFilter = "";
}
const marketsSeller = showSeller;
showSeller = function () {
  marketsSeller();
  if (activeRole !== "seller") return;
  const shop = shops.find((s) => s.id === selectedSeller);
  const panel = $('#role-content [data-dashboard-panel="catalog"]');
  panel.insertAdjacentHTML("afterbegin", sellerMarketsMarkup(shop));
  $("#seller-markets-form").onsubmit = (e) => {
    e.preventDefault();
    const countries = [
        ...e.target.querySelectorAll('[name="selling-country"]:checked'),
      ].map((x) => x.value),
      other = shop.homeCountry === "CD" ? "CG" : "CD",
      prices = {};
    e.target.querySelectorAll('[name^="market-price-"]').forEach((input) => {
      const n = Number(input.value);
      if (Number.isInteger(n) && n > 0 && n <= 1000000000)
        prices[input.name.replace("market-price-", "")] = n;
    });
    const msg = $("#seller-markets-message");
    if (!countries.length) {
      msg.textContent = T(
        "Choisissez au moins un pays.",
        "Choose at least one country.",
      );
      return;
    }
    if (countries.includes(other) && !Object.keys(prices).length) {
      msg.textContent = T(
        "Renseignez le prix d’au moins un produit pour le second pays.",
        "Enter a price for at least one product in the second country.",
      );
      return;
    }
    const records = readSellerMarkets();
    records[shop.id] = {
      shop: { ...shop },
      countries,
      prices,
      products: products
        .filter(
          (p) =>
            p.seller === shop.id &&
            !p.crossMarket &&
            p.visible &&
            p.approved &&
            prices[p.id],
        )
        .map((p) => ({ ...p })),
    };
    try {
      sessionStorage.setItem(
        "yaviya-seller-markets-demo",
        JSON.stringify(records),
      );
    } catch {
      msg.textContent = T(
        "Impossible de conserver le choix dans ce navigateur. Réessayez.",
        "Unable to save the selection in this browser. Please retry.",
      );
      return;
    }
    shop.marketCountries = countries;
    refreshSellerMarketFilter();
    render();
    renderOffers();
    showSeller();
    toast(
      T(
        "Pays de vente enregistrés en démonstration",
        "Selling countries saved in demo",
      ),
    );
  };
};
const marketCard = card;
card = function (p) {
  let html = marketCard(p);
  const s = shopOf(p);
  if (s.crossMarket)
    html = html.replace(
      '<div class="product-info">',
      `<div class="product-info"><small class="seller-origin">${T("Vendeur basé en ", "Seller based in ")}${T(...sellerCountryLabels[s.homeCountry])}</small>`,
    );
  return html;
};
const marketAdd = add;
add = function (id) {
  const p = products.find((x) => x.id === id);
  if (!p || !sellerInCurrentMarket(shopOf(p))) {
    toast(
      T(
        "Ce produit n’est pas proposé dans ce pays.",
        "This product is not offered in this country.",
      ),
    );
    return;
  }
  marketAdd(id);
};
refreshSellerMarketFilter();
render();
renderOffers();
if (activeRole === "seller") showSeller();
