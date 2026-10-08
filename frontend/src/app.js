const products = [
  {
    id: 1,
    title: "Casque sans fil Essential",
    category: "High-tech",
    price: 85000,
    img: "headphones.png",
    tag: "Le son, en liberté",
    desc: "Un casque au design épuré pour accompagner votre quotidien. Modèle illustratif : les caractéristiques et la disponibilité seront confirmées par le vendeur.",
  },
  {
    id: 2,
    title: "Baskets Urban Orange",
    category: "Mode",
    price: 65000,
    img: "sneakers.png",
    tag: "Votre touche de couleur",
    desc: "Des baskets au style urbain pour vos sorties en ville. Pointures, matière et disponibilité seront précisés lors de l’ouverture du catalogue réel.",
  },
  {
    id: 3,
    title: "Sac à main Daily",
    category: "Mode",
    price: 95000,
    img: "handbag.png",
    tag: "L’essentiel avec vous",
    desc: "Un sac au style intemporel pour garder vos essentiels à portée de main. Photo illustrative ; dimensions et matériaux à confirmer.",
  },
];
let category = "Tout",
  query = "",
  sort = "default";
const cart = new Map();
const $ = (s) => document.querySelector(s);
const money = (n) =>
  new Intl.NumberFormat("fr-CD").format(n) +
  (window.YAVIYA_COUNTRY === "CG" ? " FCFA" : " FC");
const modal = $("#modal");
function open(html) {
  $("#modal-content").innerHTML = html;
  modal.showModal();
}
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(
    () => $("#toast").classList.remove("show"),
    2400,
  );
}
function render() {
  let list = products.filter(
    (p) =>
      (category === "Tout" || p.category === category) &&
      `${p.title} ${p.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  if (sort !== "default")
    list.sort((a, b) =>
      sort === "asc" ? a.price - b.price : b.price - a.price,
    );
  $("#products").innerHTML = list
    .map(
      (p) =>
        `<article class="product"><button class="product-image" data-detail="${p.id}" aria-label="Voir ${p.title}"><img src="${p.img}" alt="${p.title}" loading="lazy"><span class="product-badge">${p.tag}</span></button><div class="product-info"><small>${p.category} · Sélection illustrative</small><button class="product-title" data-detail="${p.id}">${p.title}</button><button class="product-seller" data-shop="${p.id === 1 ? 1 : p.id === 2 ? 3 : 2}">${p.id === 1 ? "Kin Tech" : p.id === 2 ? "Pas Urbain" : "Élégance Congo"} ${verifiedBadge()}</button><div class="product-bottom"><span class="price">${money(p.price)}</span><button class="add" data-add="${p.id}">+ Ajouter</button></div></div></article>`,
    )
    .join("");
  $("#empty").hidden = list.length !== 0;
  document
    .querySelectorAll("#chips button")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === category));
}
function setCategory(cat) {
  category = cat;
  render();
  $("#catalog").scrollIntoView({ behavior: "smooth" });
}
function add(id) {
  if (!products.some((p) => p.id === id)) throw Error("Produit inconnu");
  cart.set(id, (cart.get(id) || 0) + 1);
  updateCount();
  toast("Produit ajouté au panier de démonstration");
}
function updateCount() {
  $("#count").textContent = [...cart.values()].reduce((a, b) => a + b, 0);
}
function showCart() {
  let rows = [...cart]
    .map(([id, q]) => {
      const p = products.find((p) => p.id === id);
      return `<div class="cart-item"><div><b>${p.title}</b><small>${money(p.price)} / article</small></div><div class="qty"><button data-qty="${id}" data-delta="-1" aria-label="Retirer un ${p.title}">−</button><span>${q}</span><button data-qty="${id}" data-delta="1" aria-label="Ajouter un ${p.title}">+</button></div></div>`;
    })
    .join("");
  const sum = [...cart].reduce(
    (s, [id, q]) => s + products.find((p) => p.id === id).price * q,
    0,
  );
  open(
    `<span class="eyebrow">VOTRE SÉLECTION</span><h2>Mon panier</h2>${rows || "<p>Votre panier est vide. Découvrez notre sélection et ajoutez votre premier produit.</p>"}${rows ? `<div class="cart-total"><span>Sous-total</span><span>${money(sum)}</span></div><p>Frais de livraison à confirmer selon votre adresse.</p><button class="primary" data-action="checkout">Voir la prochaine étape</button>` : '<button class="primary" data-action="browse">Explorer le catalogue</button>'}<p class="demo-note">Ce panier est temporaire et se vide au rechargement. Aucun achat ni paiement n’est effectué.</p>`,
  );
}
const content = {
  seller: `<span class="eyebrow">GRANDISSONS ENSEMBLE</span><h2>Votre boutique sur YAVIYA</h2><p>Nous préparons une marketplace pour les commerçants, artisans et entreprises établis en RDC. Voici les offres envisagées pour le lancement.</p><div class="plans"><div class="plan"><div><b>Gratuit</b><small>Jusqu’à 5 produits</small></div><span class="plan-price">0 FC / mois</span></div><div class="plan"><div><b>Plus</b><small>Jusqu’à 20 produits</small></div><span class="plan-price">25 000 FC / mois</span></div><div class="plan"><div><b>Premium</b><small>Catalogue illimité</small></div><span class="plan-price">50 000 FC / mois</span></div></div><p>Les offres et conditions définitives seront annoncées avant l’ouverture. L’inscription et le tableau de bord vendeur ne sont pas encore activés.</p>`,
  account: `<span class="eyebrow">BIENVENUE SUR YAVIYA</span><h2>Votre futur espace personnel</h2><p>Les comptes acheteurs et vendeurs permettront de suivre les commandes et de gérer les boutiques au lancement.</p><p>Cette première version vous permet de découvrir le catalogue et de tester le panier, sans créer de compte ni transmettre de données personnelles.</p><button class="primary" data-action="browse">Découvrir les produits</button>`,
  about: `<span class="eyebrow">LE COMMERCE, PLUS PROCHE</span><h2>Bienvenue chez YAVIYA</h2><p>YAVIYA est un projet de marketplace congolaise qui veut réunir acheteurs, commerçants, artisans et entreprises au même endroit.</p><p>Le lancement est prévu à Kinshasa, avec l’ambition de s’étendre progressivement à d’autres villes de la RDC. Notre priorité : une expérience accessible, des vendeurs locaux et un service client attentif.</p><p>Ce site est une première démonstration du parcours d’achat. Les produits, prix et images ne constituent pas des offres commerciales.</p>`,
  delivery: `<span class="eyebrow">À KINSHASA</span><h2>Une livraison près de vous</h2><p>YAVIYA prévoit une livraison organisée avec ses équipes et des partenaires locaux. Les tarifs ci-dessous sont indicatifs pour le projet.</p><div class="delivery-row"><span>Lukunga</span><b>7 500 FC</b></div><div class="delivery-row"><span>Funa</span><b>9 000 FC</b></div><div class="delivery-row"><span>Mont-Amba</span><b>10 000 FC</b></div><div class="delivery-row"><span>Tshangu</span><b>12 500 FC</b></div><p>Le prix définitif dépendra de l’adresse, du produit et du mode de livraison. La livraison et le suivi ne sont pas actifs dans cette démonstration.</p>`,
  help: `<h2>Vos questions</h2><p><b>Peut-on acheter aujourd’hui ?</b><br>Cette version est une démonstration. Aucune commande réelle n’est enregistrée.</p><p><b>Quels paiements sont prévus ?</b><br>Le projet prévoit le Mobile Money et la carte bancaire. Leur disponibilité dépendra des accords avec les prestataires.</p><p><b>Où YAVIYA sera-t-il disponible ?</b><br>Le lancement est prévu à Kinshasa avant une extension progressive.</p><p><b>Comment devenir vendeur ?</b><br>Les inscriptions seront ouvertes une fois les conditions et les opérations de lancement finalisées.</p>`,
  privacy: `<h2>Confidentialité</h2><p>Votre profil (nom, téléphone et/ou e-mail, adresse), vos favoris, votre solde coupons et son historique sont enregistrés et associés à votre identité de compte YAVIYA. Ces données servent à votre espace client. Le panier et les commandes de démonstration restent temporaires pendant la visite. Le choix de langue est enregistré sur cet appareil.</p><p>Aucun paiement réel n’est effectué. Aucun outil publicitaire n’a été ajouté. L’hébergeur traite les informations techniques nécessaires au fonctionnement.</p>`,
  checkout: `<h2>Votre sélection est prête</h2><p>Le paiement et la commande réelle ne sont pas encore disponibles. Cette démonstration permet de tester la sélection des produits et le panier.</p><p>Au lancement, l’étape suivante sera de renseigner une adresse de livraison et de choisir parmi les moyens de paiement activés.</p><button class="primary" data-action="cart">Revenir au panier</button>`,
};
const paymentMethods = [
  {
    id: "mpesa",
    name: "M-Pesa",
    type: "Mobile Money",
    mark: "M",
    color: "#bd1925",
  },
  {
    id: "airtel",
    name: "Airtel Money",
    type: "Mobile Money",
    mark: "A",
    color: "#c81922",
  },
  {
    id: "orange",
    name: "Orange Money",
    type: "Mobile Money",
    mark: "O",
    color: "#aa4700",
  },
  {
    id: "afri",
    name: "Afrimoney",
    type: "Mobile Money",
    mark: "AF",
    color: "#386422",
  },
  {
    id: "card",
    name: "Carte bancaire",
    type: "Carte",
    mark: "CB",
    color: "#f26a21",
  },
];
const communes = {
  Kinshasa: [
    "Bandalungwa",
    "Barumbu",
    "Bumbu",
    "Gombe",
    "Kalamu",
    "Kasa-Vubu",
    "Kimbanseke",
    "Kinshasa",
    "Kintambo",
    "Kisenso",
    "Lemba",
    "Limete",
    "Lingwala",
    "Makala",
    "Maluku",
    "Masina",
    "Matete",
    "Mont-Ngafula",
    "Ndjili",
    "Ngaba",
    "Ngaliema",
    "Ngiri-Ngiri",
    "Nsele",
    "Selembao",
  ],
  Lubumbashi: [
    "Annexe",
    "Kamalondo",
    "Kampemba",
    "Katuba",
    "Kenya",
    "Lubumbashi",
    "Ruashi",
  ],
  Kolwezi: ["Dilala", "Manika"],
  Matadi: ["Matadi", "Mvuzi", "Nzanza"],
  Boma: ["Kabondo", "Kalamu", "Nzadi"],
};
const shops = [
  {
    id: 1,
    name: "Kin Tech",
    domain: "Téléphones & informatique",
    city: "Kinshasa",
    commune: "Gombe",
    initials: "KT",
  },
  {
    id: 2,
    name: "Élégance Congo",
    domain: "Vêtements & accessoires",
    city: "Kinshasa",
    commune: "Bandalungwa",
    initials: "EC",
  },
  {
    id: 3,
    name: "Pas Urbain",
    domain: "Chaussures",
    city: "Kinshasa",
    commune: "Kalamu",
    initials: "PU",
  },
  {
    id: 4,
    name: "Maison Lushi",
    domain: "Maison & arts de la table",
    city: "Lubumbashi",
    commune: "Lubumbashi",
    initials: "ML",
  },
  {
    id: 5,
    name: "Belle au Naturel",
    domain: "Beauté & cosmétiques",
    city: "Kinshasa",
    commune: "Lemba",
    initials: "BN",
  },
  {
    id: 6,
    name: "Petit Monde",
    domain: "Bébé & jouets",
    city: "Lubumbashi",
    commune: "Kenya",
    initials: "PM",
  },
  {
    id: 7,
    name: "Électro Plus",
    domain: "Électroménager & ventilation",
    city: "Lubumbashi",
    commune: "Kampemba",
    initials: "EP",
  },
  {
    id: 8,
    name: "Saveurs du Congo",
    domain: "Épicerie non périssable",
    city: "Kinshasa",
    commune: "Limete",
    initials: "SC",
  },
  {
    id: 9,
    name: "Studio Créatif",
    domain: "Photo personnalisée & éclairage",
    city: "Kinshasa",
    commune: "Kintambo",
    initials: "ST",
  },
  {
    id: 10,
    name: "Lushi Musique",
    domain: "Instruments de musique",
    city: "Lubumbashi",
    commune: "Katuba",
    initials: "LM",
  },
];
function sellerVerificationBadge(s) {
  return s.reviewed ? verifiedBadge(s.id >= 10000) : "";
}
function verifiedBadge(real = false) {
  return (
    '<span class="verified" title="' +
    (real
      ? "Identité validée manuellement"
      : "Vérification illustrative dans la démo") +
    '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 20 5v6c0 5-4 9-8 11-4-2-8-6-8-11V5Z"/><path d="m8 12 3 3 5-6"/></svg>' +
    (real ? "Vérifié" : "Vérifié · démo") +
    "</span>"
  );
}
function showShop(id) {
  const s = shops.find((x) => x.id === id);
  const ps = products.filter((p) => p.seller === id && p.visible);
  open(
    `<span class="eyebrow">BOUTIQUE DE DÉMONSTRATION</span><h2>${s.name}</h2>${verifiedBadge()}<p>${s.domain}</p><p>${s.city} · ${s.commune}</p><p>Ce profil est illustratif. Son identité, son adresse et ses produits ne représentent pas un commerçant réel. Lors du lancement, le badge sera attribué après contrôle des informations du vendeur.</p>${ps.map((p) => `<div class="delivery-row"><span>${p.title}</span><button class="add" data-detail="${p.id}">Voir le produit</button></div>`).join("") || "<p>Le catalogue de cette boutique sera ajouté lors du lancement.</p>"}`,
  );
}
if ($("#shops"))
  $("#shops").innerHTML = shops
    .map(
      (s) =>
        `<article class="shop"><div class="shop-mark">${s.initials}</div>${verifiedBadge()}<h3>${s.name}</h3><p>${s.domain}</p><small>${s.city} · ${s.commune}</small><button class="add" data-shop="${s.id}">Voir la boutique</button></article>`,
    )
    .join("");
function showCheckout() {
  if (!cart.size) {
    showCart();
    return;
  }
  open(
    `<span class="eyebrow">LIVRAISON · DÉMONSTRATION</span><h2>Où livrer votre sélection ?</h2><form id="checkout-form"><label>Ville<select id="city" required><option value="">Choisir une ville</option><option>Kinshasa</option><option>Lubumbashi</option></select></label><label>Commune<select id="commune" required disabled><option value="">Choisissez d’abord une ville</option></select></label><label>Quartier, avenue et numéro<input id="address" required maxlength="200" placeholder="Exemple fictif : avenue du Marché, 12"></label><fieldset class="payment-fieldset"><legend>Choisissez votre mode de paiement</legend><div class="payment-options">${paymentMethods.map((m) => `<label class="payment-choice"><input type="radio" name="payment" value="${m.id}" required><span class="payment-mark" style="--payment-color:${m.color}">${m.mark}</span><span><b>${m.name}</b><small>${m.type}</small></span></label>`).join("")}</div><p class="demo-note">Choix de démonstration : aucun débit ni transfert. Ne saisissez pas de code PIN ou de données de carte.</p></fieldset><p class="demo-note">Utilisez une adresse fictive. Ces informations restent dans cette fenêtre et ne sont pas envoyées. Aucun paiement ni commande réelle.</p><button class="primary" type="submit">Vérifier ma sélection</button></form>`,
  );
  $("#city").onchange = (e) => {
    const options = communes[e.target.value] || [];
    $("#commune").disabled = !options.length;
    $("#commune").innerHTML =
      '<option value="">Choisir une commune</option>' +
      options.map((c) => `<option>${c}</option>`).join("");
  };
  $("#checkout-form").onsubmit = (e) => {
    e.preventDefault();
    const city = $("#city").value,
      commune = $("#commune").value;
    const method = paymentMethods.find(
      (m) => m.id === $('input[name="payment"]:checked')?.value,
    );
    if (!communes[city]?.includes(commune) || !method) return;
    const total = [...cart].reduce(
      (s, [id, q]) => s + products.find((p) => p.id === id).price * q,
      0,
    );
    open(
      `<span class="eyebrow">RÉCAPITULATIF DE DÉMONSTRATION</span><h2>Votre sélection est prête</h2><p>Destination : <b>${city} · ${commune}</b></p><p>Mode de paiement choisi : <b>${method.name}</b> · démonstration</p><div class="cart-total"><span>Sous-total produits</span><span>${money(total)}</span></div><p>La disponibilité de la livraison et les frais restent à confirmer. Aucune commande n’est enregistrée et aucun paiement n’est demandé.</p><button class="primary" data-action="cart">Retour au panier</button>`,
    );
  };
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.cat) {
    if (modal.open) modal.close();
    setCategory(b.dataset.cat);
  }
  if (b.dataset.shop) showShop(Number(b.dataset.shop));
  if (b.dataset.add) add(Number(b.dataset.add));
  if (b.dataset.detail) {
    const p = products.find((x) => x.id === Number(b.dataset.detail));
    open(
      `<img class="detail-image" src="${p.img}" alt="${p.title}"><span class="eyebrow">${p.category}</span><h2>${p.title}</h2><div class="price">${money(p.price)}</div><p>${p.desc}</p><button class="primary" data-add="${p.id}">Ajouter au panier</button>${related(p)}<p class="demo-note">Produit de démonstration · aucun achat réel</p>`,
    );
  }
  if (b.dataset.qty) {
    let id = Number(b.dataset.qty),
      q = (cart.get(id) || 0) + Number(b.dataset.delta);
    q > 0 ? cart.set(id, q) : cart.delete(id);
    updateCount();
    modal.close();
    showCart();
  }
  if (b.dataset.action) {
    let a = b.dataset.action;
    if (modal.open) modal.close();
    if (a === "checkout") showCheckout();
    else if (a === "help") location.href = "aide.html";
    else if (a === "cart") showCart();
    else if (a === "browse")
      $("#catalog").scrollIntoView({ behavior: "smooth" });
    else if (a === "privacy")
      open(
        `<h2>Confidentialité / Privacy</h2><p><a href="confidentialite.html?country=${window.YAVIYA_COUNTRY}&lang=${typeof language === "undefined" ? "fr" : language}" target="_blank" rel="noopener">Lire la politique de confidentialité / Read the privacy policy</a></p>`,
      );
    else if (content[a]) open(content[a]);
  }
});
$(".close").onclick = () => modal.close();
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    const r = modal.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      modal.close();
  }
});
$("#search").onsubmit = (e) => {
  e.preventDefault();
  query = $("#query").value.trim();
  category = "Tout";
  render();
  $("#catalog").scrollIntoView({ behavior: "smooth" });
};
$("#query").addEventListener("input", () => {
  query = $("#query").value.trim();
  render();
});
$("#sort").onchange = (e) => {
  sort = e.target.value;
  render();
};
$("#discover").onclick = () =>
  $("#catalog").scrollIntoView({ behavior: "smooth" });
render();
if (document.modelContext?.registerTool) {
  try {
    document.modelContext.registerTool({
      name: "search_yaviya_demo_products",
      description:
        "Filtrer le catalogue de démonstration YAVIYA et retourner les produits visibles.",
      inputSchema: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute(input) {
        if (!input || typeof input.query !== "string")
          throw Error("query doit être une chaîne");
        query = input.query;
        category = "Tout";
        $("#query").value = query;
        render();
        return products
          .filter((p) =>
            (p.title + " " + p.category)
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map(({ id, title, price }) => ({
            id,
            title,
            price,
            currency: "CDF",
            demo: true,
          }));
      },
    });
  } catch (e) {
    console.warn("Catalogue agent indisponible", e);
  }
}

function ownedSellerIds() {
  return [shops[0]?.id, shops[3]?.id].filter(Boolean);
}
