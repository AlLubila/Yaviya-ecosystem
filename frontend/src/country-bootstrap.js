window.YAVIYA_COUNTRY =
  new URLSearchParams(location.search).get("country") === "CG" ||
  location.pathname.endsWith("/congo.html")
    ? "CG"
    : "CD";
window.countryCopy = (s) =>
  window.YAVIYA_COUNTRY !== "CG" || typeof s !== "string"
    ? s
    : s
        .replace(/francs congolais/g, "francs CFA")
        .replace(/\bFC\b/g, "FCFA")
        .replace(/Toutes les provinces/g, "Tous les départements")
        .replace(/All provinces/g, "All departments")
        .replace(/Province/g, "Département")
        .replace(/\+243 000 000 000/g, "+242 000 000 000")
        .replace(/contact@yaviya\.cd/g, "contact Congo à confirmer")
        .replace(
          /M-Pesa|M-PESA|Airtel Money|Orange Money|Afrimoney|VODACOM/g,
          "Mobile Money local",
        );
window.countryCityOptions = () =>
  Object.keys(communes)
    .map((c) => `<option>${c}</option>`)
    .join("");
if (window.YAVIYA_COUNTRY === "CG") {
  const regionalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    if (typeof input === "string" && input.startsWith("/api/")) {
      const u = new URL(input, location.origin);
      u.searchParams.set("country", "CG");
      input = u.pathname + u.search;
    }
    return regionalFetch(input, init);
  };
}

window.readSellerMarkets = () => {
  try {
    return JSON.parse(
      sessionStorage.getItem("yaviya-seller-markets-demo") || "{}",
    );
  } catch {
    return {};
  }
};
window.sellerInCurrentMarket = (s) =>
  !!s &&
  (
    s.marketCountries ||
    readSellerMarkets()[s.id]?.countries || [
      s.homeCountry || window.YAVIYA_COUNTRY,
    ]
  ).includes(window.YAVIYA_COUNTRY);

window.regionalContentCopy = (s) =>
  window.YAVIYA_COUNTRY === "CG" && typeof s === "string"
    ? countryCopy(s)
        .replace(/Kinshasa/g, "Brazzaville")
        .replace(/Lubumbashi/g, "Pointe-Noire")
        .replace(/République démocratique du Congo/g, "République du Congo")
    : s;

window.isDeliveryCityEnabled = (city) =>
  window.YAVIYA_COUNTRY === "CG"
    ? Object.hasOwn(communes, city)
    : window.YAVIYA_MARKET_CONFIG.deliverableCities.includes(city);
window.checkoutCityOptions = () => {
  if (window.YAVIYA_COUNTRY === "CG") return countryCityOptions();
  const active = window.YAVIYA_MARKET_CONFIG.deliverableCities;
  const future = window.YAVIYA_MARKET_CONFIG.cities.filter(
    (c) => !active.includes(c),
  );
  return `<optgroup label="${T("Commandes ouvertes", "Orders open")}">${active.map((c) => `<option value="${c}">${c}</option>`).join("")}</optgroup><optgroup label="${T("Extension à venir — commandes fermées", "Upcoming expansion — orders closed")}">${future.map((c) => `<option value="${c}" disabled>${c} · ${T("bientôt disponible", "coming soon")}</option>`).join("")}</optgroup>`;
};

window.yaviyaCategory = (p) => {
  if (/^Sacs à dos/.test(p.subcategory || "")) return "Voyage & bagages";
  if (
    p.subcategory === "Photos personnalisées" ||
    (p.category === "Création" && /photo personnalisée/i.test(p.title || ""))
  )
    return "Maison & cuisine";
  return window.YAVIYA_MARKET_CONFIG.categoryAliases[p.category] || p.category;
};
