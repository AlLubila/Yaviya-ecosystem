let language = "fr";
try {
  language = localStorage.getItem("yaviya-language") || "fr";
} catch {}
const wishes = new Set();
let customerProfile = null;
const T = (fr, en) => window.countryCopy(language === "en" ? en : fr);
const faqItems = [
  [
    "Comment commander ?",
    "How do I order?",
    "Choisissez vos articles, ouvrez le panier, renseignez une adresse fictive et sélectionnez un paiement. Seules des commandes de démonstration sont créées.",
    "Choose items, open the cart, enter a fictional address and select a payment method. Only demonstration orders are created.",
  ],
  [
    "Quels moyens de paiement sont proposés ?",
    "Which payment methods are offered?",
    "M-Pesa, Orange Money, Airtel Money, Afrimoney, carte bancaire et paiement à la livraison sont présentés. Aucun paiement réel n’est actif.",
    "M-Pesa, Orange Money, Airtel Money, Afrimoney, bank card and cash on delivery are shown. Real payments are not active.",
  ],
  [
    "Comment sont calculés les frais de livraison ?",
    "How are delivery fees calculated?",
    "Dans la démo : 7 500 FC par boutique dans le panier. Les tarifs et zones réels seront confirmés avant lancement.",
    "In the demo: FC 7,500 per shop in the cart. Actual rates and coverage will be confirmed before launch.",
  ],
  [
    "Où peut-on être livré ?",
    "Where is delivery available?",
    "Le formulaire présente les 24 communes de Kinshasa et les 7 communes de Lubumbashi. Livraison estimée sous 24 à 48 heures après validation. Les zones opérationnelles restent à confirmer.",
    "The form lists all 24 Kinshasa communes and 7 Lubumbashi communes. Estimated delivery within 24–48 hours after confirmation. Operational coverage remains to be confirmed.",
  ],
  [
    "Comment suivre ma commande ?",
    "How do I track my order?",
    "Ouvrez Mes commandes dans le menu. Les étapes des commandes de démonstration évoluent lorsque la boutique confirme leur préparation, expédition et livraison.",
    "Open My orders in the menu. Demo order stages update when a shop confirms preparation, shipping and delivery.",
  ],
  [
    "Comment enregistrer un favori ?",
    "How do I save a favourite?",
    "Cliquez sur le cœur d’un produit. Retrouvez votre sélection dans Mes favoris. Créez votre compte pour conserver vos favoris.",
    "Click the heart on a product. Find your selection in My wishlist. Create your account to keep your favourites.",
  ],
  [
    "Quels abonnements de livraison sont prévus ?",
    "Which delivery subscriptions are planned?",
    "Des formules mensuelle et annuelle pour les clients sont prévues. Tarifs provisoires : 25 000 FC/mois et 250 000 FC/an. Limites, zones et avantages à confirmer.",
    "Monthly and annual customer plans are planned. Provisional prices: FC 25,000/month and FC 250,000/year. Limits, coverage and benefits to be confirmed.",
  ],
  [
    "Puis-je retourner un article ?",
    "Can I return an item?",
    "Aucun achat réel n’est effectué dans cette version. La politique de retour et de remboursement sera publiée avant l’ouverture commerciale.",
    "No real purchase is made in this version. Return and refund policies will be published before commercial launch.",
  ],
];
const categoryNames = { Tout: "All products" };
for (const [cat, fr, en] of window.YAVIYA_MARKET_CONFIG.categorySections) {
  if (!categoryNames[cat]) categoryNames[cat] = en;
}
function faqMarkup() {
  return faqItems
    .map(
      (f) =>
        `<details><summary>${T(f[0], f[1])}</summary><p>${T(f[2], f[3])}</p></details>`,
    )
    .join("");
}
document
  .querySelector("main")
  .insertAdjacentHTML(
    "beforeend",
    `<section class="catalog customer-faq"><h2 id="faq-title">Questions fréquentes</h2><div id="home-faq"></div><button class="add" data-client="support" id="faq-contact">Contactez le support</button></section>`,
  );
document.body.insertAdjacentHTML(
  "beforeend",
  '<dialog id="customer-menu"><button id="menu-close" class="close" aria-label="Fermer">×</button><div id="menu-content"></div></dialog>',
);
const drawer = $("#customer-menu");
$("#all").onclick = () => {
  renderMenu();
  drawer.showModal();
  $("#all").setAttribute("aria-expanded", "true");
};
$("#menu-close").onclick = () => drawer.close();
drawer.addEventListener("close", () =>
  $("#all").setAttribute("aria-expanded", "false"),
);
function renderMenu() {
  $("#menu-content").innerHTML =
    `<h2>${T("Mon Yaviya", "My Yaviya")}</h2><h3>${T("Catégories de produits", "Product categories")}</h3><div class="menu-links">${Object.entries(
      categoryNames,
    )
      .map(
        ([c, en]) =>
          `<button data-cat="${c}">${T(c === "Mode" ? "Habits & accessoires" : c === "Maison" ? "Maison & quotidien" : c, en)}</button>`,
      )
      .join(
        "",
      )}</div><h3>${T("Mon espace client", "My customer area")}</h3><div class="menu-links"><button data-client="register">${T(customerProfile ? "Mon profil" : "Créer un compte", customerProfile ? "My profile" : "Create an account")}</button><button data-action="tracking">${T("Mes commandes", "My orders")}</button><button data-client="wishlist">${T("Mes favoris · liste des souhaits", "My favourites · wishlist")} (${wishes.size})</button><button data-coins="wallet">${T("Mes coupons", "My coupons")}</button><button data-client="subscriptions">${T("Abonnements de livraison", "Delivery subscriptions")}</button><button data-client="faq">${T("Questions fréquentes", "Frequently asked questions")}</button><button data-client="support">${T("Contactez le support", "Contact support")}</button><button data-client="about">${T("À propos de YAVIYA", "About YAVIYA")}</button></div>`;
}
function accountIdentifiersMarkup(profile = customerProfile) {
  if (!profile) return "";
  const ids = profile.accountIds || {
    buyer: profile.customerNumber,
    seller: profile.sellerNumber,
    courier: profile.courierNumber,
  };
  const labels = {
    buyer: ["ID client", "Customer ID"],
    seller: ["ID vendeur", "Seller ID"],
    courier: ["ID livreur", "Courier ID"],
  };
  return `<section class="account-identifiers" aria-label="${T("Mes identifiants YAVIYA", "My YAVIYA IDs")}">${Object.entries(
    labels,
  )
    .filter(([role]) => ids[role] && /^(?:YVC|YVYS|YVYC)-/.test(ids[role]))
    .map(
      ([role, label]) =>
        `<div class="customer-number"><span>${T(...label)}</span><strong>${esc(ids[role])}</strong></div>`,
    )
    .join(
      "",
    )}<small>${T("Identifiants personnels et permanents.", "Personal, permanent identifiers.")}</small></section>`;
}
function showRegister() {
  open(
    `<h2>${T(customerProfile ? "Mon profil" : "Créer un compte", customerProfile ? "My profile" : "Create an account")}</h2><p>${T("Votre profil est associé à votre compte YAVIYA. Renseignez votre nom, votre téléphone * et votre adresse. L’e-mail est facultatif.", "Your profile is linked to your YAVIYA sign-in. Enter your name, phone number * and address. Email is optional.")}</p>${accountIdentifiersMarkup()}<form id="register-form" class="editor"><fieldset class="account-type-options"><legend>${T("Choisissez votre type de compte *", "Choose your account type *")}</legend><label><input type="radio" name="accountType" value="buyer" required ${customerProfile?.accountType === "buyer" ? "checked" : ""}><span><b>${T("Compte acheteur", "Buyer account")}</b><small>${T("Acheter, suivre mes commandes et enregistrer mes favoris", "Shop, track orders and save favourites")}</small></span></label><label><input type="radio" name="accountType" value="seller" required ${customerProfile?.accountType === "seller" ? "checked" : ""}><span><b>${T("Compte vendeur", "Seller account")}</b><small>${T("Préparer ma boutique et découvrir la gestion des ventes", "Prepare my shop and explore sales management")}</small></span></label><label><input type="radio" name="accountType" value="courier" required ${customerProfile?.accountType === "courier" ? "checked" : ""}><span><b>${T("Compte livreur", "Courier account")}</b><small>${T("Recevoir et suivre mes missions de livraison", "Receive and track delivery assignments")}</small></span></label></fieldset><p class="demo-note">${T("Le vendeur et le livreur doivent soumettre leur identité. Le vendeur doit aussi fournir son numéro RCM/RCCM. L’accès est débloqué après contrôle manuel de l’admin ; les ventes et livraisons restent des démonstrations.", "Sellers and couriers must submit identity documents. Sellers must also provide their RCM/RCCM number. Access is unlocked after manual administrator review; sales and deliveries remain demonstrations.")}</p><label>${T("Nom complet *", "Full name *")}<input name="name" autocomplete="off" maxlength="100" required value="${esc(customerProfile?.name || "")}"></label><label>${T("Numéro de téléphone *", "Phone number *")}<input name="phone" type="tel" required maxlength="30" autocomplete="tel" value="${esc(customerProfile?.phone || "")}"></label><label>${T("Adresse e-mail", "Email address")}<input name="email" type="email" maxlength="150" autocomplete="off" value="${esc(customerProfile?.email || "")}"></label><p>${T("Téléphone * pour votre compte et le suivi des livraisons. L’e-mail est facultatif.", "Phone * for your account and delivery tracking. Email is optional.")}</p><label>${T("Adresse *", "Address *")}<textarea name="address" required maxlength="250">${esc(customerProfile?.address || "")}</textarea></label><label class="privacy-consent"><input type="checkbox" name="privacyConsent" required ${customerProfile?.privacyVersion === "2026-10-02" ? "checked" : ""}><span>${T("J’ai lu la politique de confidentialité et j’accepte le traitement des informations nécessaires à mon compte. *", "I have read the privacy policy and agree to the processing of information needed for my account. *")} <a href="confidentialite.html?country=${window.YAVIYA_COUNTRY}&lang=${language}" target="_blank" rel="noopener">${T("Lire la politique de confidentialité", "Read the privacy policy")}</a></span></label><p id="registration-error" role="alert"></p><button class="primary">${T("Créer / enregistrer mon compte", "Create / save my account")}</button></form>${customerProfile ? `<button class="add" id="account-space">${T(customerProfile.accountType === "seller" ? "Ouvrir mon espace vendeur · démo" : customerProfile.accountType === "courier" ? "Ouvrir mon espace livreur · démo" : "Ouvrir mon espace acheteur", customerProfile.accountType === "seller" ? "Open my seller area · demo" : customerProfile.accountType === "courier" ? "Open my courier area · demo" : "Open my buyer area")}</button>` : ""}`,
  );
  if ($("#account-space"))
    $("#account-space").onclick = () => {
      if (modal.open) modal.close();
      setRole(
        customerProfile.accountType === "seller"
          ? "seller"
          : customerProfile.accountType === "courier"
            ? "courier"
            : "buyer",
      );
    };
  $("#register-form").onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    d.privacyConsent = e.target.elements.privacyConsent.checked;
    d.privacyVersion = "2026-10-02";
    if (
      !["buyer", "seller", "courier"].includes(d.accountType) ||
      !d.privacyConsent
    ) {
      $("#registration-error").textContent = T(
        "Choisissez votre type de compte * et acceptez la politique de confidentialité.",
        "Choose your account type * and accept the privacy policy.",
      );
      return;
    }
    if (!d.phone.trim()) {
      $("#registration-error").textContent = T(
        "Votre numéro de téléphone est obligatoire.",
        "Your phone number is required.",
      );
      return;
    }
    try {
      const saved = await customerAPI(d);
      customerProfile = {
        ...d,
        accountIds: saved.accountIds,
        accountId: saved.accountId,
        customerNumber: saved.customerNumber,
        sellerNumber: saved.sellerNumber,
        courierNumber: saved.courierNumber,
      };
      toast(T("Compte enregistré", "Account saved"));
      showRegister();
    } catch (err) {
      $("#registration-error").textContent = err.message;
    }
  };
}
function showWishlist() {
  open(
    `<h2>${T("Mes favoris", "My wishlist")}</h2><p>${T("Retrouvez vos produits préférés.", "Find your favourite products.")}</p><div class="related-grid">${products
      .filter((p) => wishes.has(p.id))
      .map(card)
      .join(
        "",
      )}</div>${!wishes.size ? `<p>${T("Votre liste est vide. Cliquez sur le cœur d’un produit.", "Your list is empty. Click the heart on a product.")}</p>` : ""}`,
  );
  decorateHearts();
}
function showSubscriptions() {
  open(
    `<h2>${T("Abonnements de livraison", "Delivery subscriptions")}</h2><p>${T("Choisissez la formule qui correspond à votre rythme d’achat. Tarifs provisoires pour préparer le lancement.", "Choose the plan that matches your shopping habits. Provisional rates ahead of launch.")}</p><div class="subscription-grid">${[
      ["Mensuel", "Monthly", "1 mois", "1 month"],
      ["Annuel", "Annual", "12 mois", "12 months"],
    ]
      .map(
        (p) =>
          `<article class="plan-box"><h3>${T(p[0], p[1])}</h3><p>${T("Période : ", "Period: ")}${T(p[2], p[3])}</p><b>${p[0] === "Mensuel" ? "25 000 FC / " + T("mois", "month") : "250 000 FC / " + T("an", "year")}</b><p>${T("Tarif provisoire. Nombre de livraisons incluses, zones et conditions à confirmer avant activation.", "Provisional price. Included deliveries, coverage and conditions to be confirmed before activation.")}</p><button class="add" disabled>${T("Bientôt disponible", "Coming soon")}</button></article>`,
      )
      .join("")}</div>`,
  );
}
function showSupport() {
  open(
    `<h2>${T("Contactez le support", "Contact support")}</h2><p>${T("L’assistant peut répondre aux questions courantes. Le canal de contact avec un conseiller n’est pas encore configuré.", "The assistant can answer common questions. The channel for contacting a human adviser has not yet been configured.")}</p><button class="primary" id="open-assistant">${T("Discuter avec l’assistant", "Chat with the assistant")}</button><button class="add" data-client="faq">${T("Questions fréquentes", "Frequently asked questions")}</button>`,
  );
  $("#open-assistant").onclick = () => {
    modal.close();
    setChat(true);
  };
}
function showAbout() {
  open(
    `<h2>${T("À propos de YAVIYA", "About YAVIYA")}</h2><p>${T("YAVIYA est un projet de marketplace congolaise qui réunit acheteurs, commerçants et artisans autour d’un catalogue varié : habits, maison, high-tech, beauté et bien plus.", "YAVIYA is a Congolese marketplace project bringing buyers, merchants and artisans together through a varied catalogue: clothing, home, electronics, beauty and more.")}</p><p>${T("Notre ambition : faciliter les achats et valoriser les commerces locaux, en commençant par Kinshasa, Lubumbashi, Kolwezi, Matadi et Boma.", "Our ambition is to make shopping easier and support local businesses, starting with Kinshasa, Lubumbashi, Kolwezi, Matadi and Boma.")}</p><p>${T("Cette version est une démonstration. Les produits, boutiques et prix sont illustratifs.", "This version is a demonstration. Products, shops and prices are illustrative.")}</p>`,
  );
}
document.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (drawer.open && (b.dataset.cat || b.dataset.action || b.dataset.client))
      drawer.close();
    if (b.dataset.action === "account" || b.dataset.action === "about") {
      e.stopImmediatePropagation();
      b.dataset.action === "account" ? showRegister() : showAbout();
    }
    if (b.dataset.client) {
      e.stopImmediatePropagation();
      ({
        register: showRegister,
        wishlist: showWishlist,
        subscriptions: showSubscriptions,
        support: showSupport,
        about: showAbout,
        faq: () =>
          open(
            `<h2>${T("Questions fréquentes", "Frequently asked questions")}</h2><div class="customer-faq">${faqMarkup()}</div>`,
          ),
      })[b.dataset.client]?.();
    }
    if (b.dataset.wish) {
      e.stopImmediatePropagation();
      saveWish(+b.dataset.wish);
    }
  },
  true,
);
const originalCard = card;
card = function (p) {
  return originalCard(p).replace(
    '<div class="product-info">',
    `<div class="product-info"><button class="wish" data-wish="${p.id}" aria-pressed="${wishes.has(p.id)}" aria-label="${T("Favori", "Favourite")} ${esc(p.title)}">${wishes.has(p.id) ? "♥" : "♡"}</button>`,
  );
};
function decorateHearts() {
  document.querySelectorAll("[data-wish]").forEach((b) => {
    const on = wishes.has(+b.dataset.wish);
    b.textContent = on ? "♥" : "♡";
    b.setAttribute("aria-pressed", String(on));
  });
}
const textTranslations = {
  "Votre marché à Kinshasa, Lubumbashi, Kolwezi, Matadi et Boma.":
    "Your marketplace in Kinshasa, Lubumbashi, Kolwezi, Matadi and Boma.",
  "Découvrir YAVIYA": "About YAVIYA",
  Rechercher: "Search",
  "Mon compte": "My account",
  Menu: "Menu",
  "High-tech": "Electronics",
  "Mode & accessoires": "Clothing & accessories",
  "Maison & quotidien": "Home & household",
  Livraison: "Delivery",
  Aide: "Help",
  "Mes commandes": "My orders",
  "Administration · démo": "Administration · demo",
  "Vendre sur YAVIYA": "Sell on YAVIYA",
  "LE QUOTIDIEN, EN MIEUX": "EVERYDAY SHOPPING, MADE EASIER",
  "Vos envies.": "Your wishes.",
  "Votre ville.": "Your city.",
  "Votre YAVIYA.": "Your YAVIYA.",
  "Du coup de cœur à l’essentiel, découvrez votre prochain achat au même endroit.":
    "From everyday essentials to special finds, discover your next purchase in one place.",
  "Explorer le catalogue": "Browse products",
  "Kinshasa, RDC": "Kinshasa, DRC",
  "Prix en francs congolais": "Prices in Congolese francs",
  "Des trouvailles pour tous les jours.": "Finds for every day.",
  "Pensé pour Kinshasa": "Designed for Kinshasa",
  "Le commerce près de vous": "Shops near you",
  "Une sélection variée": "A varied selection",
  "Mode, high-tech et maison": "Clothing, electronics and home",
  "Des vendeurs locaux": "Local sellers",
  "Au cœur de notre projet": "At the heart of our project",
  "Une expérience simple": "An easy experience",
  "Sur mobile comme sur ordinateur": "On mobile and desktop",
  "LE BON ENDROIT POUR TROUVER": "FIND WHAT YOU NEED",
  "À découvrir sur YAVIYA": "Shop on YAVIYA",
  "Notre sélection": "Our selection",
  "Prix croissant": "Price: low to high",
  "Prix décroissant": "Price: high to low",
  "Catalogue de démonstration · produits et prix illustratifs · aucune commande réelle":
    "Demo catalogue · illustrative products and prices · no real orders",
  "Toutes les boutiques": "All shops",
  "Toutes les provinces": "All provinces",
  "Toutes les villes": "All cities",
  "Toutes les communes": "All communes",
  Réinitialiser: "Reset",
  "Choisissez votre mode de paiement": "Choose your payment method",
  "À L’ÉTAPE DE COMMANDE": "AT CHECKOUT",
  "POUR LES COMMERÇANTS": "FOR MERCHANTS",
  "Votre boutique mérite": "Your shop deserves",
  "une nouvelle vitrine.": "a new showcase.",
  "Faites découvrir vos produits et préparez votre présence sur YAVIYA.":
    "Showcase your products and prepare your presence on YAVIYA.",
  "Découvrir les offres vendeurs": "Explore seller plans",
  "Le commerce avance": "Commerce moves forward",
  "avec vous.": "with you.",
  Explorer: "Explore",
  "À propos": "About",
  "Devenir vendeur": "Become a seller",
  Informations: "Information",
  "Centre d’aide": "Help centre",
  Confidentialité: "Privacy",
  "Version de démonstration": "Demo version",
  "Le début d’une nouvelle expérience.": "A new experience begins.",
  Tout: "All",
  Mode: "Clothing",
  Maison: "Home",
  Beauté: "Beauty",
  Enfants: "Kids",
  Épicerie: "Groceries",
  Création: "Photo & lighting",
  Musique: "Music",
};
const originals = new WeakMap();
function translateSurface() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (
      ["SCRIPT", "STYLE"].includes(n.parentElement.tagName) ||
      n.parentElement.closest("#customer-menu,#home-faq")
    )
      continue;
    if (!originals.has(n)) originals.set(n, n.nodeValue);
    const original = originals.get(n),
      key = original.trim();
    n.nodeValue = countryCopy(
      language === "en" && textTranslations[key]
        ? original.replace(key, textTranslations[key])
        : original,
    );
  }
  $("#query").placeholder = T(
    "Qu’est-ce qui vous ferait plaisir ?",
    "What are you looking for?",
  );
  document.documentElement.lang = language;
  $("#faq-title").textContent = T("Questions populaires", "Popular questions");
  if ($("#home-faq").dataset.language !== language) {
    const expanded = [...$("#home-faq").querySelectorAll("details")].map(
      (d) => d.open,
    );
    $("#home-faq").innerHTML = faqMarkup();
    $("#home-faq")
      .querySelectorAll("details")
      .forEach((d, i) => (d.open = !!expanded[i]));
    $("#home-faq").dataset.language = language;
  }
  $("#faq-contact").textContent = T("Contactez le support", "Contact support");
}
function applyLanguage() {
  translateSurface();
  $("#chat-toggle").textContent = T("◌ Besoin d’aide ?", "◌ Need help?");
}
const originalRender = render;
render = function () {
  originalRender();
  translateSurface();
};
render();
applyLanguage();
Object.assign(textTranslations, {
  "Votre marché, à portée de main.": "Your marketplace, at your fingertips.",
  "Le début d’une nouvelle expérience.": "A new experience begins.",
  "Le début d’une nouvelle expérience.": "A new experience begins.",
  "Le début d’une nouvelle aventure.": "A new journey begins.",
  "Le début d’une nouvelle expérience.": "A new experience begins.",
  "Le début d’une nouvelle expérience.": "A new experience begins.",
  "Aucun produit trouvé. Essayez un autre mot ou une autre catégorie.":
    "No products found. Try another search or category.",
  "Comparer chez d’autres vendeurs": "Compare offers from other sellers",
  Produit: "Product",
  Boutique: "Shop",
  Prix: "Price",
  Voir: "View",
  "+ Ajouter": "+ Add",
  "Ajouter au panier": "Add to cart",
  "Vérifié · démo": "Verified · demo",
  "Photo à fournir par le vendeur": "Photo to be supplied by the seller",
  "Mon panier multi-vendeurs": "My multi-seller cart",
  "Votre panier est vide.": "Your cart is empty.",
  Produits: "Products",
  "Total indicatif": "Estimated total",
  "Passer la commande de démonstration": "Place demo order",
  "Livraison et paiement": "Delivery and payment",
  Ville: "City",
  Commune: "Commune",
  "Adresse fictive": "Fictional address",
  "Mode de paiement": "Payment method",
  Choisir: "Select",
  "Valider la commande de démonstration": "Confirm demo order",
  "Paiement à la livraison": "Cash on delivery",
  "Carte bancaire": "Bank card",
  "Mes commandes": "My orders",
  "Aucune commande. Ajoutez des produits au panier pour tester le parcours.":
    "No orders yet. Add products to your cart to test the flow.",
  Validée: "Confirmed",
  "En préparation": "Preparing",
  Expédiée: "Shipped",
  Livrée: "Delivered",
  Vendeur: "Seller",
  Province: "Province",
  "BOUTIQUE DE DÉMONSTRATION": "DEMO SHOP",
  "Article et prix illustratifs. Caractéristiques à confirmer auprès du vendeur avant le lancement.":
    "Illustrative item and price. Specifications to be confirmed by the seller before launch.",
  "Espace de démonstration : données temporaires pendant cette visite. Aucun compte réel, paiement, transfert ou notification externe. Les boutiques sont fictives.":
    "Demo area: temporary data during this visit. No real account, payment, transfer or external notification. Shops are fictional.",
  "Tarif illustratif par vendeur, identique dans les deux villes. Le montant réel devra être configuré avant lancement.":
    "Illustrative rate per seller, identical in both cities. Actual rates must be set before launch.",
  "Produit de démonstration · aucun achat réel":
    "Demo product · no real purchase",
  "Aucune offre similaire chez un autre vendeur pour le moment.":
    "No similar offers from another seller yet.",
  "Questions fréquentes": "Frequently asked questions",
  Envoyer: "Send",
  "Réponses automatiques · FAQ": "Automatic answers · FAQ",
  "Consulter le centre d’aide": "Visit the help centre",
  "Assistant YAVIYA": "YAVIYA Assistant",
  Acheter: "Shopping",
  "Vendeurs vérifiés": "Verified sellers",
  "Bonjour ! Comment puis-je vous aider ? Cette version est une démonstration ; ne saisissez pas de données personnelles.":
    "Hello! How can I help you? This is a demo; do not enter personal information.",
  "Modes proposés dans la démonstration. Les paiements réels seront disponibles après activation des prestataires.":
    "Methods offered in this demonstration. Real payments will be available after providers are activated.",
});
const productEN = {
  "Casque sans fil Essential": "Essential wireless headphones",
  "Casque Bluetooth Studio": "Studio Bluetooth headphones",
  "Baskets Urban Orange": "Urban Orange sneakers",
  "Baskets City Walk": "City Walk sneakers",
  "Sac à main Daily": "Daily handbag",
  "Sac week-end": "Weekend bag",
  "Service de table 12 pièces": "12-piece dinner set",
  "Assiettes 6 pièces": "6-piece plate set",
  "Ventilateur sur pied": "Standing fan",
  "Ventilateur compact": "Compact fan",
  "Savon doux 3 pièces": "3-piece gentle soap set",
  "Lait de beauté 400 ml": "Body lotion 400 ml",
  "Coffret de jouets": "Toy set",
  "Jeu éducatif": "Educational game",
  "Riz 5 kg": "Rice 5 kg",
  "Café 250 g": "Coffee 250 g",
  "Ring light 26 cm": "Ring light 26 cm",
  "Photo personnalisée encadrée": "Framed custom photo",
  "Guitare acoustique": "Acoustic guitar",
  "Clavier musical": "Musical keyboard",
  "Rallonge 5 prises": "5-socket extension lead",
  "Montre classique": "Classic watch",
  "Cravate élégante": "Elegant tie",
  "Câble USB-C": "USB-C cable",
};
Object.assign(textTranslations, productEN);
const baseTranslate = translateSurface;
translateSurface = function () {
  baseTranslate();
  if (language === "en") {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (["SCRIPT", "STYLE"].includes(n.parentElement.tagName)) continue;
      const patterns = [
        [/^Autres produits de /, "More products from "],
        [/^Stock disponible : /, "Available stock: "],
        [/^Stock : /, "Stock: "],
        [/^(\d+) produits$/, "$1 products"],
        [
          /^(\d+) commande\(s\) pendant cette visite$/,
          "$1 order(s) during this visit",
        ],
        [/^Livraison indicative : /, "Estimated delivery: "],
        [/colis vendeur à /g, "seller parcels at "],
        [
          /Frais de paiement : 0 FC dans la démo\./g,
          "Payment fees: FC 0 in the demo.",
        ],
        [/^Produits : /, "Products: "],
        [/^Frais de paiement : /, "Payment fees: "],
      ];
      for (const [p, r] of patterns) n.nodeValue = n.nodeValue.replace(p, r);
    }
  }
};
let translating = false;
const observer = new MutationObserver(() => {
  if (translating) return;
  translating = true;
  observer.disconnect();
  translateSurface();
  observer.observe(document.body, { childList: true, subtree: true });
  translating = false;
});
observer.observe(document.body, { childList: true, subtree: true });
applyLanguage();
const oldAnswer = answerQuestion;
answerQuestion = function (q) {
  if (language === "fr") return oldAnswer(q);
  const t = q.toLowerCase();
  const i = /payment|money|card|cash/.test(t)
    ? 1
    : /fee|cost/.test(t)
      ? 2
      : /delivery|commune|city/.test(t)
        ? 3
        : /track|order status/.test(t)
          ? 4
          : /favourite|favorite|wish/.test(t)
            ? 5
            : /subscription|monthly|annual/.test(t)
              ? 6
              : /return|refund/.test(t)
                ? 7
                : 0;
  return faqItems[i][3];
};

async function customerAPI(body) {
  const r = await fetch("/api/customer", {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401)
    throw Error(
      T(
        "Connectez-vous à YAVIYA pour enregistrer votre compte.",
        "Sign in to YAVIYA to save your account.",
      ),
    );
  if (!r.ok)
    throw Error(
      T(
        "Enregistrement indisponible. Réessayez.",
        "Saving unavailable. Please try again.",
      ),
    );
  return r.json();
}
let wishSaving = false;
async function saveWish(id) {
  if (!customerProfile) {
    showRegister();
    toast(
      T(
        "Créez votre compte pour conserver vos favoris",
        "Create your account to save favourites",
      ),
    );
    return;
  }
  if (wishSaving) return;
  wishSaving = true;
  const next = new Set(wishes);
  next.has(id) ? next.delete(id) : next.add(id);
  try {
    await customerAPI({ wishlistOnly: true, wishlist: [...next] });
    wishes.clear();
    next.forEach((x) => wishes.add(x));
    decorateHearts();
    toast(T("Favoris enregistrés", "Wishlist saved"));
  } catch (e) {
    toast(e.message);
  } finally {
    wishSaving = false;
  }
}
customerAPI()
  .then((p) => {
    if (p) {
      customerProfile = p;
      p.wishlist.forEach((x) => wishes.add(x));
      decorateHearts();
    }
  })
  .catch(() => {});
