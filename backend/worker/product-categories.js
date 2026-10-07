import marketConfig from "../data/market-config.json" with { type: "json" };
export function normalizeCategory(p) {
  if (/^Sacs à dos/.test(p.subcategory || "")) p.category = "Voyage & bagages";
  else if (
    p.subcategory === "Photos personnalisées" ||
    (p.category === "Création" && /photo personnalisée/i.test(p.title || ""))
  )
    p.category = "Maison & cuisine";
  else p.category = marketConfig.categoryAliases[p.category] || p.category;
  return p;
}
