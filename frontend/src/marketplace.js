// All commerce records in this static prototype are held in memory for this visit.
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
shops.forEach((s, i) => (s.reviewed = i % 3 !== 2));
products.forEach((p, i) =>
  Object.assign(p, {
    seller: [1, 3, 2][i],
    stock: 15,
    visible: true,
    approved: true,
    family: ["Casques", "Baskets", "Sacs"][i],
  }),
);
const inventory = [
  [
    "Casque Bluetooth Studio",
    "High-tech",
    79000,
    1,
    "headphones.png",
    "Casques",
  ],
  [
    "Casque sans fil Essential",
    "High-tech",
    82000,
    9,
    "headphones.png",
    "Casques",
  ],
  [
    "Casque Bluetooth Studio",
    "High-tech",
    92000,
    7,
    "headphones.png",
    "Casques",
  ],
  ["Baskets Urban Orange", "Mode", 62000, 2, "sneakers.png", "Baskets"],
  ["Baskets City Walk", "Mode", 72000, 3, "sneakers.png", "Baskets"],
  ["Baskets City Walk", "Mode", 68000, 6, "sneakers.png", "Baskets"],
  ["Sac à main Daily", "Mode", 89000, 3, "handbag.png", "Sacs"],
  ["Sac à main Daily", "Mode", 98000, 2, "handbag.png", "Sacs"],
  ["Sac week-end", "Mode", 115000, 2, "handbag.png", "Sacs"],
  ["Service de table 12 pièces", "Maison", 75000, 4, null, "Table"],
  ["Assiettes 6 pièces", "Maison", 35000, 4, null, "Table"],
  ["Ventilateur sur pied", "Maison", 145000, 7, null, "Ventilation"],
  ["Ventilateur compact", "Maison", 95000, 4, null, "Ventilation"],
  ["Savon doux 3 pièces", "Beauté", 18000, 5, null, "Soin"],
  ["Lait de beauté 400 ml", "Beauté", 28000, 5, null, "Soin"],
  ["Coffret de jouets", "Enfants", 42000, 6, null, "Jouets"],
  ["Jeu éducatif", "Enfants", 32000, 6, null, "Jouets"],
  ["Riz 5 kg", "Épicerie", 25000, 8, null, "Épicerie"],
  ["Café 250 g", "Épicerie", 15000, 8, null, "Épicerie"],
  ["Ring light 26 cm", "Création", 65000, 9, null, "Éclairage"],
  ["Photo personnalisée encadrée", "Création", 45000, 9, null, "Photo"],
  ["Guitare acoustique", "Musique", 210000, 10, null, "Instruments"],
  ["Clavier musical", "Musique", 350000, 10, null, "Instruments"],
  ["Rallonge 5 prises", "Maison", 22000, 7, null, "Électricité"],
  ["Montre classique", "Mode", 55000, 2, null, "Accessoires"],
  ["Cravate élégante", "Mode", 20000, 2, null, "Accessoires"],
  ["Câble USB-C", "High-tech", 12000, 1, null, "Câbles"],
];
inventory.forEach((r, i) =>
  products.push({
    id: i + 4,
    title: r[0],
    category: r[1],
    price: r[2],
    seller: r[3],
    img: r[4],
    family: r[5],
    stock: 10 + (i % 8),
    visible: true,
    approved: true,
    tag: "Sélection locale",
    desc: "Article et prix illustratifs. Caractéristiques à confirmer auprès du vendeur avant le lancement.",
  }),
);
if (window.YAVIYA_COUNTRY === "CG") products.forEach((p) => (p.seller += 100));
const provinces = [
  "Kinshasa",
  "Kongo-Central",
  "Kwango",
  "Kwilu",
  "Mai-Ndombe",
  "Kasaï",
  "Kasaï-Central",
  "Kasaï-Oriental",
  "Lomami",
  "Sankuru",
  "Maniema",
  "Sud-Kivu",
  "Nord-Kivu",
  "Ituri",
  "Haut-Uele",
  "Bas-Uele",
  "Tshopo",
  "Mongala",
  "Nord-Ubangi",
  "Sud-Ubangi",
  "Équateur",
  "Tshuapa",
  "Tanganyika",
  "Haut-Lomami",
  "Lualaba",
  "Haut-Katanga",
];
if (window.YAVIYA_COUNTRY === "CG")
  provinces.splice(0, provinces.length, "Brazzaville", "Pointe-Noire");
let sellerFilter = "",
  cityFilter = "",
  communeFilter = "",
  provinceFilter = "",
  commission = 5,
  selectedSeller = shops[0].id;
const orders = [],
  withdrawals = [],
  transactions = [];
const stages = [
  "En attente du vendeur",
  "En préparation",
  "Expédiée",
  "Livrée",
];
const demo =
  '<p class="demo-note">Espace de démonstration : données temporaires pendant cette visite. Aucun compte réel, paiement, transfert ou notification externe. Les boutiques sont fictives.</p>';
const shopOf = (p) => shops.find((s) => s.id === p.seller);
function card(p) {
  const s = shopOf(p);
  return `<article class="product"><button class="product-image" data-detail="${p.id}" aria-label="Voir ${esc(p.title)}">${p.img ? `<img src="${p.img}" alt="${esc(p.title)}" loading="lazy">` : `<span class="no-photo">${esc(p.category)}<small>Photo à fournir par le vendeur</small></span>`}</button><div class="product-info"><small>${esc(p.category)} · ${esc(s.commune)}</small><button class="product-title" data-detail="${p.id}">${esc(p.title)}</button><button class="product-seller" data-shop="${s.id}"><span class="seller-label">${esc(s.name)}</span> ${sellerVerificationBadge(s)}</button><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add" data-add="${p.id}" ${p.stock < 1 ? "disabled" : ""}>+ Ajouter</button></div><button class="buy-now" data-buy-now="${p.id}" ${p.stock < 1 ? "disabled" : ""}>Acheter maintenant</button></div></article>`;
}
render = function () {
  let list = products.filter(
    (p) =>
      p.visible &&
      p.approved &&
      sellerInCurrentMarket(shopOf(p)) &&
      (category === "Tout" || p.category === category) &&
      (!sellerFilter || p.seller === +sellerFilter) &&
      (!cityFilter || shopOf(p).city === cityFilter) &&
      (!communeFilter || shopOf(p).commune === communeFilter) &&
      (!provinceFilter ||
        (window.YAVIYA_COUNTRY === "CG"
          ? shopOf(p).city === provinceFilter
          : provinceFilter === "Kinshasa"
            ? shopOf(p).city === "Kinshasa"
            : provinceFilter === "Haut-Katanga" &&
              shopOf(p).city === "Lubumbashi")) &&
      `${p.title} ${p.category} ${shopOf(p).name} ${shopOf(p).commune}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  if (sort !== "default")
    list.sort((a, b) =>
      sort === "rating"
        ? reviewStats(b).rating - reviewStats(a).rating ||
          reviewStats(b).count - reviewStats(a).count
        : sort === "asc"
          ? a.price - b.price
          : b.price - a.price,
    );
  $("#products").innerHTML = list.map(card).join("");
  $("#empty").hidden = !!list.length;
  $("#result-count").textContent = `${list.length} produits`;
  document
    .querySelectorAll("#chips button")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === category));
};
$("#chips").innerHTML = ["Tout", ...new Set(products.map((p) => p.category))]
  .map((c) => `<button data-cat="${c}">${c}</button>`)
  .join("");
$("#chips").insertAdjacentHTML(
  "afterend",
  `<div class="filters"><label>Vendeur<select id="vendor-filter"><option value="">Toutes les boutiques</option>${shops
    .filter(sellerInCurrentMarket)
    .map((s) => `<option value="${s.id}">${s.name}</option>`)
    .join(
      "",
    )}</select></label><label>Province<select id="province-filter"><option value="">Toutes les provinces</option>${provinces.map((s) => `<option>${s}</option>`).join("")}</select></label><label>Ville<select id="city-filter"><option value="">Toutes les villes</option>${countryCityOptions()}</select></label><label>Commune<select id="commune-filter"><option value="">Toutes les communes</option></select></label><button class="add" id="reset-filters">Réinitialiser</button><span id="result-count" aria-live="polite"></span></div>`,
);
$("#vendor-filter").onchange = (e) => {
  sellerFilter = e.target.value;
  render();
};
$("#province-filter").onchange = (e) => {
  provinceFilter = e.target.value;
  render();
};
$("#city-filter").onchange = (e) => {
  cityFilter = e.target.value;
  communeFilter = "";
  $("#commune-filter").innerHTML =
    '<option value="">Toutes les communes</option>' +
    (communes[cityFilter] || []).map((c) => `<option>${c}</option>`).join("");
  render();
};
$("#commune-filter").onchange = (e) => {
  communeFilter = e.target.value;
  render();
};
$("#reset-filters").onclick = () => {
  sellerFilter = cityFilter = communeFilter = provinceFilter = query = "";
  category = "Tout";
  $("#query").value = "";
  document.querySelectorAll(".filters select").forEach((s) => (s.value = ""));
  render();
};
function related(p) {
  const similar = products
    .filter(
      (x) =>
        sellerInCurrentMarket(shopOf(x)) &&
        x.id !== p.id &&
        x.family === p.family &&
        x.seller !== p.seller &&
        x.visible &&
        x.approved &&
        sellerInCurrentMarket(shopOf(x)),
    )
    .sort((a, b) => a.price - b.price);
  return `<h3>Comparer chez d’autres vendeurs</h3>${similar.length ? `<div class="table-wrap"><table><thead><tr><th>Produit</th><th>Boutique</th><th>Prix</th><th>Disponibilité</th><th></th></tr></thead><tbody>${similar.map((x) => `<tr><td>${esc(x.title)}</td><td>${esc(shopOf(x).name)}<small>${esc(shopOf(x).city)}</small></td><td>${money(x.price)}</td><td>${x.stock > 0 ? T("Disponible", "Available") : T("Indisponible", "Unavailable")}</td><td><button class="add" data-detail="${x.id}">Voir</button></td></tr>`).join("")}</tbody></table></div>` : "<p>Aucune offre similaire chez un autre vendeur pour le moment.</p>"}<h3>Autres produits de ${esc(shopOf(p).name)}</h3><div class="related-grid">${products
    .filter(
      (x) =>
        x.seller === p.seller &&
        sellerInCurrentMarket(shopOf(x)) &&
        x.id !== p.id &&
        x.visible &&
        x.approved &&
        sellerInCurrentMarket(shopOf(x)),
    )
    .slice(0, 6)
    .map(card)
    .join("")}</div>`;
}
// Intercept detail to support products for which no photo has been supplied.
document.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest("[data-detail]");
    if (!b) return;
    e.stopImmediatePropagation();
    const p = products.find((x) => x.id === +b.dataset.detail);
    open(
      `${p.img ? `<img class="detail-image" src="${p.img}" alt="${esc(p.title)}">` : ""}<span class="eyebrow">${esc(p.category)}</span><h2>${esc(p.title)}</h2><button class="product-seller" data-shop="${p.seller}"><span class="seller-label">${esc(shopOf(p).name)}</span> ${sellerVerificationBadge(shopOf(p))}</button><div class="price">${money(p.price)}</div><p>${esc(p.desc)}</p><p>${p.stock > 0 ? T("Disponible", "Available") : T("Indisponible", "Unavailable")}</p><div class="purchase-actions"><button class="primary" data-buy-now="${p.id}" ${!p.stock ? "disabled" : ""}>Acheter maintenant</button><button class="add" data-add="${p.id}" ${!p.stock ? "disabled" : ""}>Ajouter au panier</button></div>${related(p)}${demo}`,
    );
  },
  true,
);
const oldAdd = add;
add = function (id) {
  const p = products.find((x) => x.id === id);
  if (!p || !p.visible || !p.approved || p.stock <= (cart.get(id) || 0)) {
    toast("Stock disponible insuffisant");
    return;
  }
  oldAdd(id);
};
paymentMethods.push({
  id: "cod",
  name: "Paiement à la livraison",
  type: "À réception",
  mark: "FC",
  color: "#225e49",
});
function totals(selection = cart) {
  const subtotal = [...selection].reduce(
    (s, [id, q]) => s + products.find((p) => p.id === id).price * q,
    0,
  );
  const sellers = new Set(
    [...selection.keys()].map((id) => products.find((p) => p.id === id).seller),
  );
  return { subtotal, sellers, delivery: sellers.size * 7500 };
}
showCart = function () {
  const t = totals();
  open(
    `<h2>Mon panier multi-vendeurs</h2>${
      [...t.sellers]
        .map(
          (s) =>
            `<h3>${shops.find((x) => x.id === s).name}</h3>${[...cart]
              .filter(([id]) => products.find((p) => p.id === id).seller === s)
              .map(([id, q]) => {
                const p = products.find((x) => x.id === id);
                return `<div class="cart-item"><div><b>${esc(p.title)}</b><small>${money(p.price)} × ${q}</small></div><div class="qty"><button data-qty="${id}" data-delta="-1">−</button><span>${q}</span><button data-qty="${id}" data-delta="1" ${q >= p.stock ? "disabled" : ""}>+</button></div></div>`;
              })
              .join("")}`,
        )
        .join("") || "<p>Votre panier est vide.</p>"
    }${cart.size ? `<div class="cart-total">Produits <b>${money(t.subtotal)}</b></div><p>Livraison indicative : ${money(t.delivery)} (${t.sellers.size} colis vendeur à 7 500 FC). Frais de paiement : 0 FC dans la démo.</p><div class="cart-total">Total indicatif <b>${money(t.subtotal + t.delivery)}</b></div><button class="primary" data-action="checkout">Passer la commande de démonstration</button>` : ""}${demo}`,
  );
};
showCheckout = function () {
  if (!cart.size) return showCart();
  const t = totals();
  open(
    `<h2>Livraison et paiement</h2><form id="checkout-form"><label>Ville<select id="city" required><option value="">Choisir</option>${countryCityOptions()}</select></label><label>Commune<select id="commune" required disabled></select></label><label>Adresse fictive<input id="address" required maxlength="150" placeholder="Avenue et numéro fictifs"></label><fieldset class="payment-fieldset"><legend>Mode de paiement</legend>${paymentMethods.map((m) => `<label class="payment-choice"><input type="radio" name="payment" value="${m.id}" required>${m.name}</label>`).join("")}</fieldset><p>Produits : ${money(t.subtotal)}<br>Livraison indicative : ${money(t.delivery)}<br>Frais de paiement : 0 FC<br><b>Total : ${money(t.subtotal + t.delivery)}</b></p><p>Tarif illustratif par vendeur, identique dans les deux villes. Le montant réel devra être configuré avant lancement.</p>${demo}<button class="primary">Valider la commande de démonstration</button></form>`,
  );
  $("#city").onchange = (e) => {
    $("#commune").disabled = false;
    $("#commune").innerHTML =
      '<option value="">Choisir</option>' +
      communes[e.target.value].map((c) => `<option>${c}</option>`).join("");
  };
  $("#checkout-form").onsubmit = (e) => {
    e.preventDefault();
    if (
      [...cart].some(([id, q]) => products.find((p) => p.id === id).stock < q)
    ) {
      toast("Le stock a changé. Vérifiez votre panier.");
      return;
    }
    const o = {
      id: "YV-" + String(orders.length + 1).padStart(4, "0"),
      city: $("#city").value,
      commune: $("#commune").value,
      payment: paymentMethods.find(
        (m) => m.id === $('input[name="payment"]:checked').value,
      ).name,
      items: [...cart].map(([id, q]) => {
        const p = products.find((x) => x.id === id);
        p.stock -= q;
        return { id, q, price: p.price, seller: p.seller, title: p.title };
      }),
      step: 0,
      total: t.subtotal + t.delivery,
      rate: commission,
      sellerSteps: Object.fromEntries([...t.sellers].map((s) => [s, 0])),
      events: [
        "Commande de démonstration validée — " +
          new Date().toLocaleTimeString("fr"),
      ],
    };
    orders.unshift(o);
    cart.clear();
    updateCount();
    render();
    showTracking();
    toast("Commande de démonstration validée");
  };
};
function showTracking() {
  open(
    `<h2>Mes commandes</h2><p role="status">${orders.length} commande(s) pendant cette visite</p>${orders.map((o) => `<section class="order-box"><h3>${o.id} · ${money(o.total)}</h3><p>${o.city} · ${o.commune} · ${o.payment}</p><div class="steps">${stages.map((s, i) => `<span class="${i <= o.step ? "done" : ""}">${s}</span>`).join("")}</div><ul>${o.events.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></section>`).join("") || "<p>Aucune commande. Ajoutez des produits au panier pour tester le parcours.</p>"}${demo}`,
  );
}
function sellerOrders(id) {
  return orders.filter((o) => o.items.some((i) => i.seller === id));
}
function orderSellerCommission(o, id) {
  return o.items
    .filter((i) => id === undefined || i.seller === id)
    .reduce(
      (n, i) =>
        n +
        (i.price * i.q * (o.sellerRates?.[i.seller] ?? o.rate ?? commission)) /
          100,
      0,
    );
}
function sellerStats(id) {
  let gross = 0,
    fees = 0;
  orders
    .filter((o) => o.sellerSteps[id] === 3 && o.buyerConfirmed)
    .forEach((o) => {
      const g = o.items
        .filter((i) => i.seller === id)
        .reduce((s, i) => s + i.price * i.q, 0);
      gross += g;
      fees += orderSellerCommission(o, id);
    });
  const reserved = withdrawals
    .filter((w) => w.seller === id && w.status !== "Refusé")
    .reduce((s, w) => s + w.amount, 0);
  return { gross, fees, balance: gross - fees - reserved };
}
function showSeller() {
  const id = selectedSeller,
    s = shops.find((x) => x.id === id),
    stats = sellerStats(id);
  open(
    `<h2>Tableau de bord boutique</h2><label>Boutique de démonstration<select id="seller-switch">${shops
      .filter((s) => ownedSellerIds().includes(s.id))
      .map(
        (x) =>
          `<option value="${x.id}" ${x.id === id ? "selected" : ""}>${x.name}</option>`,
      )
      .join(
        "",
      )}</select></label>${demo}<div class="metrics"><div>Ventes livrées<b>${money(stats.gross)}</b></div><div>Commissions<b>${money(stats.fees)}</b></div><div>Solde disponible<b>${money(stats.balance)}</b></div></div><h3>Catalogue de ${s.name}</h3><button class="primary" id="new-product">Ajouter un produit</button><div class="table-wrap"><table><thead><tr><th>Produit</th><th>Prix</th><th>Disponibilité</th><th>Visibilité</th><th></th></tr></thead><tbody>${products
      .filter((p) => p.seller === id)
      .map(
        (p) =>
          `<tr><td>${esc(p.title)}</td><td>${money(p.price)}</td><td>${p.stock > 0 ? T("Disponible", "Available") : T("Indisponible", "Unavailable")}</td><td>${p.visible ? "Visible" : "Masqué"} · ${p.approved ? "Validé" : "À modérer"}</td><td><button class="add" data-edit="${p.id}">Modifier</button></td></tr>`,
      )
      .join("")}</tbody></table></div><h3>Commandes et alertes de vente</h3>${
      sellerOrders(id)
        .map(
          (o) =>
            `<div class="order-box"><b>${o.id} · ${stages[o.sellerSteps[id]]}</b><p>${o.items
              .filter((i) => i.seller === id)
              .map((i) => `${esc(i.title)} × ${i.q}`)
              .join(
                ", ",
              )}</p>${o.sellerSteps[id] < 3 ? `<button class="add" data-advance="${o.id}">${["Confirmer la préparation", "Confirmer l’expédition", "Confirmer la livraison"][o.sellerSteps[id]]}</button>` : ""}</div>`,
        )
        .join("") || "<p>Aucune vente pendant cette visite.</p>"
    }<h3>Portefeuille et demandes de retrait</h3><form id="withdraw-form"><label>Montant en FC<input type="number" name="amount" min="1" max="${Math.max(0, stats.balance)}" required></label><button class="add" ${stats.balance < 1 ? "disabled" : ""}>Demander un retrait de démonstration</button></form><ul>${withdrawals
      .filter((w) => w.seller === id)
      .map((w) => `<li>${money(w.amount)} · ${w.status}</li>`)
      .join("")}</ul><h3>Historique des transactions</h3><ul>${
      transactions
        .filter((t) => t.seller === id)
        .map((t) => `<li>${esc(t.label)} · ${money(t.amount)}</li>`)
        .join("") || "<li>Aucune transaction.</li>"
    }</ul>`,
  );
  $("#seller-switch").onchange = (e) => {
    selectedSeller = +e.target.value;
    showSeller();
  };
  $("#new-product").onclick = () => editProduct();
  $("#withdraw-form").onsubmit = (e) => {
    e.preventDefault();
    const amount = Number(new FormData(e.target).get("amount"));
    if (amount > 0 && amount <= sellerStats(id).balance) {
      withdrawals.push({
        id: withdrawals.length + 1,
        seller: id,
        amount,
        status: "En attente",
      });
      showSeller();
    }
  };
}
function editProduct(id) {
  const p = products.find((x) => x.id === id);
  open(
    `<h2>${p ? "Modifier" : "Ajouter"} un produit</h2><form id="product-form" class="editor"><label>Nom<input name="title" maxlength="100" required value="${esc(p?.title || "")}"></label><label>Catégorie<select name="category">${[...new Set(products.map((x) => x.category))].map((c) => `<option ${c === p?.category ? "selected" : ""}>${c}</option>`).join("")}</select></label><label>Prix (FC)<input name="price" type="number" min="1" max="1000000000" required value="${p?.price || ""}"></label><label>Stock<input name="stock" type="number" min="0" max="100000" required value="${p?.stock ?? 0}"></label><label><input name="visible" type="checkbox" ${!p || p.visible ? "checked" : ""}>Afficher dans le catalogue après validation</label><button class="primary">Enregistrer</button></form>${demo}`,
  );
  $("#product-form").onsubmit = (e) => {
    e.preventDefault();
    const f = new FormData(e.target),
      data = {
        title: f.get("title").trim(),
        category: f.get("category"),
        price: +f.get("price"),
        stock: +f.get("stock"),
        visible: f.has("visible"),
        approved: false,
      };
    if (!data.title) return;
    if (p) Object.assign(p, data);
    else
      products.push({
        ...data,
        id: Math.max(...products.map((x) => x.id)) + 1,
        seller: selectedSeller,
        family: data.category,
        img: null,
        desc: "Produit ajouté pendant la visite de démonstration.",
      });
    render();
    showSeller();
    toast("Produit enregistré, en attente de modération");
  };
}
function showAdmin() {
  const revenue = orders
      .filter((o) => o.step === 3 && o.buyerConfirmed)
      .reduce((s, o) => s + o.items.reduce((a, i) => a + i.price * i.q, 0), 0),
    fees = orders
      .filter((o) => o.step === 3 && o.buyerConfirmed)
      .reduce((s, o) => s + orderSellerCommission(o), 0);
  const ranking = products
    .map((p) => ({
      p,
      q: orders.reduce(
        (s, o) =>
          s + o.items.filter((i) => i.id === p.id).reduce((a, i) => a + i.q, 0),
        0,
      ),
    }))
    .filter((x) => x.q)
    .sort((a, b) => b.q - a.q);
  open(
    `<h2>Administration YAVIYA</h2>${demo}<div class="metrics"><div>Commandes<b>${orders.length}</b></div><div>Ventes livrées<b>${money(revenue)}</b></div><div>Commissions<b>${money(fees)}</b></div></div><h3>Commission de la plateforme</h3><form id="commission-form"><label>Taux (%)<input name="rate" type="number" min="0" max="100" step="0.1" value="${commission}" required></label><button class="add">Enregistrer</button></form><p>Le taux s’applique aux nouvelles commandes. La livraison est exclue de la commission.</p><h3>Validation des vendeurs</h3>${shops.map((s) => `<div class="delivery-row"><span>${s.name} · ${s.reviewed ? "Validé en démo" : "À contrôler"}</span><button class="add" data-verify="${s.id}" ${s.reviewed ? "disabled" : ""}>Valider en démo</button></div>`).join("")}<h3>Modération du catalogue</h3>${
      products
        .filter((p) => !p.approved)
        .map(
          (p) =>
            `<div class="delivery-row"><span>${esc(p.title)} · ${shopOf(p).name}</span><button class="add" data-approve="${p.id}">Approuver</button><button class="add" data-reject="${p.id}">Masquer</button></div>`,
        )
        .join("") || "<p>Aucun produit en attente.</p>"
    }<h3>Reversements aux vendeurs</h3>${withdrawals.map((w) => `<div class="delivery-row"><span>${shops.find((s) => s.id === w.seller).name} · ${money(w.amount)} · ${w.status}</span>${w.status === "En attente" ? `<button class="add" data-payout="${w.id}">Valider en démo</button><button class="add" data-deny="${w.id}">Refuser</button>` : ""}</div>`).join("") || "<p>Aucune demande de retrait.</p>"}<h3>Produits phares · commandes de cette visite</h3>${ranking.map((x) => `<div class="delivery-row"><span>${esc(x.p.title)}</span><b>${x.q} article(s)</b></div>`).join("") || "<p>Pas encore de vente.</p>"}<h3>Rétention des utilisateurs</h3><p>Non mesurable dans cette version sans comptes et historique durable. Aucun taux de rétention réel n’est affiché.</p>`,
  );
  $("#commission-form").onsubmit = (e) => {
    e.preventDefault();
    commission = +new FormData(e.target).get("rate");
    toast("Taux de commission mis à jour");
  };
}
document.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const a = b.dataset.action;
    if (["seller", "tracking", "admin"].includes(a)) {
      e.stopImmediatePropagation();
      if (a === "seller") showSeller();
      else if (a === "admin") showAdmin();
      else showTracking();
    }
    if (b.dataset.edit) editProduct(+b.dataset.edit);
    if (b.dataset.advance) {
      const o = orders.find((x) => x.id === b.dataset.advance);
      if (o.sellerSteps[selectedSeller] < 3) {
        o.sellerSteps[selectedSeller]++;
        o.step = Math.min(...Object.values(o.sellerSteps));
        o.events.push(
          shops.find((s) => s.id === selectedSeller).name +
            " : " +
            stages[o.sellerSteps[selectedSeller]] +
            " — " +
            new Date().toLocaleTimeString("fr"),
        );
        showSeller();
        toast("Notification : " + o.id + " mise à jour");
      }
    }
    if (b.dataset.verify) {
      shops.find((s) => s.id === +b.dataset.verify).reviewed = true;
      render();
      renderOffers();
      showAdmin();
    }
    if (b.dataset.approve) {
      products.find((p) => p.id === +b.dataset.approve).approved = true;
      render();
      showAdmin();
    }
    if (b.dataset.reject) {
      const p = products.find((p) => p.id === +b.dataset.reject);
      p.visible = false;
      p.approved = true;
      render();
      showAdmin();
    }
    if (b.dataset.payout || b.dataset.deny) {
      const w = withdrawals.find(
        (w) => w.id === +(b.dataset.payout || b.dataset.deny),
      );
      if (w.status === "En attente") {
        w.status = b.dataset.payout ? "Validé en démo" : "Refusé";
        if (b.dataset.payout)
          transactions.push({
            seller: w.seller,
            label: "Retrait simulé",
            amount: -w.amount,
          });
        showAdmin();
      }
    }
  },
  true,
);
render();
