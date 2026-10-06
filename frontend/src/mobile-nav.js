const mobileLabels = [
  ["home", "Accueil", "Home", '<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3z"/>'],
  [
    "profile",
    "Profil",
    "Profile",
    '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  ],
  [
    "categories",
    "Catégories",
    "Categories",
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  ],
  [
    "wishlist",
    "Favoris",
    "Favourites",
    '<path d="M20 4c-3-2-6 0-8 2-2-2-5-4-8-2-6 5 0 10 8 16 8-6 14-11 8-16z"/>',
  ],
  [
    "cart",
    "Panier",
    "Cart",
    '<path d="M3 3h2l3 13h11l2-9H6"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/>',
  ],
];
mobileLabels.sort(
  (a, b) =>
    ["home", "categories", "cart", "wishlist", "profile"].indexOf(a[0]) -
    ["home", "categories", "cart", "wishlist", "profile"].indexOf(b[0]),
);
let mobileActive = "home";
function mobileText(fr, en) {
  return typeof T === "function"
    ? T(fr, en)
    : new URLSearchParams(location.search).get("lang") === "en" ||
        document.documentElement.lang === "en"
      ? en
      : fr;
}
document.body.insertAdjacentHTML(
  "beforeend",
  '<nav class="mobile-footbar" aria-label="Navigation mobile / Mobile navigation"></nav>',
);
function renderMobileNav() {
  const main = typeof setRole === "function",
    market =
      window.YAVIYA_COUNTRY === "CG" ||
      new URLSearchParams(location.search).get("country") === "CG"
        ? "congo.html"
        : "index.html",
    qty =
      typeof cart !== "undefined"
        ? [...cart.values()].reduce((n, q) => n + q, 0)
        : 0;
  document.querySelector(".mobile-footbar").innerHTML = mobileLabels
    .map(([id, fr, en, icon]) => {
      const inner = `<span class="mobile-nav-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>${id === "cart" && qty ? `<b class="mobile-cart-count">${qty}</b>` : ""}</span><span>${mobileText(fr, en)}</span>`;
      return main
        ? `<button type="button" data-mobile-tab="${id}" ${mobileActive === id ? 'aria-current="page"' : ""}>${inner}</button>`
        : `<a href="${market}?mobileTab=${id}">${inner}</a>`;
    })
    .join("");
}
function activateMobileTab(id) {
  if (typeof setRole !== "function") return;
  if (typeof modal !== "undefined" && modal.open) modal.close();
  if (typeof drawer !== "undefined" && drawer.open) drawer.close();
  setRole("buyer");
  mobileActive = id;
  if (id === "home") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (id === "profile") {
    showRegister();
  } else if (id === "categories") {
    open(
      `<h2>${T("Catégories", "Categories")}</h2><div class="mobile-category-list">${Object.entries(
        categoryNames,
      )
        .map(
          ([cat, en]) =>
            `<button class="add" data-cat="${cat}">${T(cat, en)}</button>`,
        )
        .join("")}</div>`,
    );
  } else if (id === "wishlist") {
    showWishlist();
  } else if (id === "cart") {
    showCart();
  }
  renderMobileNav();
}
document.querySelector(".mobile-footbar").addEventListener("click", (e) => {
  const b = e.target.closest("[data-mobile-tab]");
  if (b) activateMobileTab(b.dataset.mobileTab);
});
if (typeof updateCount === "function") {
  const previousMobileCount = updateCount;
  updateCount = function () {
    previousMobileCount();
    renderMobileNav();
  };
}
if (typeof applyLanguage === "function") {
  const previousMobileLanguage = applyLanguage;
  applyLanguage = function () {
    previousMobileLanguage();
    renderMobileNav();
  };
}
renderMobileNav();
const initialMobileTab = new URLSearchParams(location.search).get("mobileTab");
if (
  mobileLabels.some((x) => x[0] === initialMobileTab) &&
  typeof setRole === "function"
)
  activateMobileTab(initialMobileTab);
