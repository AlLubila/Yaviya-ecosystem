// Demo references are available before sign-in, using the same data as the API seeds.
for (const seed of window.YAVIYA_MARKET_CONFIG.demoCatalogue || []) {
  const cg = window.YAVIYA_COUNTRY === "CG";
  const product = {
    ...seed,
    id: seed.id + (cg ? 100 : 0),
    seller: seed.seller + (cg ? 100 : 0),
    price: cg ? Math.round(seed.price / 4) : seed.price,
    images: [...seed.images],
  };
  if (!products.some((p) => p.id === product.id)) products.push(product);
}
render();
