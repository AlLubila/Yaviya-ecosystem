// Finish the private MVP using the existing persisted scenario and role views.
const additionalCatalogue = [
  ["Chemise homme classique", "Mode", 45000, 2, "Chemises"],
  ["Robe femme quotidienne", "Mode", 68000, 2, "Robes"],
  ["Veste homme habillée", "Mode", 120000, 2, "Vestes"],
  ["Chaussures femme élégantes", "Mode", 72000, 3, "Chaussures"],
  ["Accessoire femme foulard", "Mode", 18000, 2, "Accessoires"],
  ["Habit enfant ensemble", "Enfants", 38000, 6, "Habits"],
  ["Téléphone smartphone Essential", "High-tech", 320000, 1, "Téléphones"],
  ["Ordinateur portable Bureau", "High-tech", 950000, 1, "Informatique"],
  ["Cosmétique soin quotidien", "Beauté", 24000, 5, "Soin"],
];
additionalCatalogue.forEach((r, index) =>
  products.push({
    id: 500 + index,
    title: r[0],
    category: r[1],
    price: r[2],
    seller: r[3] + (window.YAVIYA_COUNTRY === "CG" ? 100 : 0),
    family: r[4],
    stock: 12,
    visible: true,
    approved: true,
    img: null,
    tag: T("Sélection locale", "Local selection"),
    desc: T(
      "Article de démonstration. La photo et les caractéristiques seront fournies par le vendeur avant mise en vente.",
      "Demo item. The seller will provide its photo and specifications before sale.",
    ),
  }),
);
Object.assign(productEN, {
  "Chemise homme classique": "Classic men’s shirt",
  "Robe femme quotidienne": "Everyday women’s dress",
  "Veste homme habillée": "Men’s formal jacket",
  "Chaussures femme élégantes": "Elegant women’s shoes",
  "Accessoire femme foulard": "Women’s scarf",
  "Habit enfant ensemble": "Kids’ outfit",
  "Téléphone smartphone Essential": "Essential smartphone",
  "Ordinateur portable Bureau": "Office laptop",
  "Cosmétique soin quotidien": "Everyday cosmetic care",
});
Object.assign(textTranslations, productEN);

const catalogueSnapshot = scenarioSnapshot;
scenarioSnapshot = function () {
  return {
    ...catalogueSnapshot(),
    catalogue: products.filter((p) => !p.crossMarket).map((p) => ({ ...p })),
    shopChecks: shops
      .filter((s) => s.id < 10000)
      .map((s) => ({ id: s.id, reviewed: !!s.reviewed })),
  };
};
const catalogueApply = applyDelivery;
applyDelivery = function (data, redraw = true) {
  if (Array.isArray(data.snapshot.catalogue)) {
    const localIds = new Set(data.snapshot.catalogue.map((p) => p.id));
    const seeds = products.filter(
      (p) => p.id >= 500 && p.id < 509 && !localIds.has(p.id),
    );
    const imported = products.filter((p) => p.crossMarket);
    products.splice(
      0,
      products.length,
      ...data.snapshot.catalogue,
      ...seeds,
      ...imported,
    );
  }
  for (const saved of data.snapshot.shopChecks || []) {
    const shop = shops.find((s) => s.id === saved.id);
    if (shop) shop.reviewed = saved.reviewed;
  }
  catalogueApply(data, redraw);
  render();
  renderOffers();
};
const persistedEditor = editProduct;
editProduct = function (id) {
  if (!deliveryReady || deliverySaving) {
    toast(
      T(
        "Attendez la synchronisation du catalogue.",
        "Wait for catalogue synchronization.",
      ),
    );
    return;
  }
  persistedEditor(id);
  const form = $("#product-form");
  if (!form) return;
  const submit = form.onsubmit;
  form.onsubmit = async (e) => {
    if (!form.reportValidity()) {
      e.preventDefault();
      return;
    }
    const values = Object.fromEntries(new FormData(form));
    submit(e);
    const saved = await saveDelivery();
    if (!saved) {
      persistedEditor(id);
      const retry = $("#product-form");
      for (const [key, value] of Object.entries(values)) {
        const field = retry?.elements[key];
        if (field && field.type !== "checkbox") field.value = value;
      }
      if (retry?.elements.visible)
        retry.elements.visible.checked = values.visible === "on";
      retry?.insertAdjacentHTML(
        "beforeend",
        `<p role="alert">${T("Le produit n’a pas été enregistré. Vos informations ont été conservées ; réessayez.", "The product was not saved. Your input has been retained; please retry.")}</p>`,
      );
      const original = retry?.onsubmit;
      if (retry)
        retry.onsubmit = async (ev) => {
          original(ev);
          await saveDelivery();
        };
    }
  };
};
window.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest("[data-approve],[data-reject],[data-verify]");
    if (!b) return;
    if (activeRole !== "admin" || !deliveryReady || deliverySaving) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    setTimeout(() => saveDelivery(), 0);
  },
  true,
);

function showCourierOnboarding() {
  openCustomerPage(() => {
    showRegister();
    const form = $("#register-form"),
      radio = form?.querySelector("[name=accountType][value=courier]");
    if (!radio) return;
    radio.checked = true;
    radio.dispatchEvent(new Event("change"));
    $("#modal-content h2").textContent = T(
      "Devenir livreur",
      "Become a courier",
    );
  });
}
const finalProfile = showMyYaviya;
showMyYaviya = function () {
  finalProfile();
  const link = $("#modal-content [data-profile=courierArea]");
  link?.insertAdjacentHTML(
    "beforebegin",
    profileLink(
      "courier",
      "Devenir livreur",
      "Become a courier",
      T("Compte, identité, puis abonnement", "Account, identity, then plan"),
    ),
  );
};
const finalProfileAction = profileAction;
profileAction = function (action) {
  if (action === "courier") showCourierOnboarding();
  else finalProfileAction(action);
};
const finalSupport = showSupport;
showSupport = function () {
  finalSupport();
  const host =
    activeRole === "buyer" ? $("#modal-content") : $("#role-content");
  host.insertAdjacentHTML(
    "beforeend",
    `<button class="add" id="help-open-assistant">${T("Discuter avec l’assistant YAVIYA", "Talk to YAVIYA Assistant")}</button>`,
  );
  $("#help-open-assistant").onclick = () => {
    if (modal.open) modal.close();
    setRole("buyer");
    setChat(true);
  };
};

// Ensure English cash-on-delivery orders use the same payment state as French.
const finalCheckout = showCheckout;
showCheckout = function (selection = cart) {
  finalCheckout(selection);
  const form = $("#checkout-form");
  if (!form) return;
  form.insertAdjacentHTML(
    "afterbegin",
    `<div class="recipient-fields"><label>${T("Destinataire *", "Recipient *")}<input name="recipientName" required maxlength="100" autocomplete="name" value="${esc(customerProfile?.name || "")}"></label><label>${T("Téléphone du destinataire *", "Recipient phone *")}<input name="recipientPhone" type="tel" required maxlength="30" autocomplete="tel" value="${esc(customerProfile?.phone || "")}"></label></div>`,
  );
  const submit = form.onsubmit;
  form.onsubmit = async (e) => {
    if (!form.reportValidity()) {
      e.preventDefault();
      return;
    }
    const restore = [...selection],
      beforeIds = new Set(orders.map((o) => o.id));
    await submit(e);
    const created = orders.find((o) => !beforeIds.has(o.id));
    if (!created && restore.length && selection.size === 0) {
      restore.forEach(([id, q]) => {
        selection.set(id, q);
        if (selection !== cart) cart.set(id, Math.max(cart.get(id) || 0, q));
      });
      updateCount();
      showCart();
      toast(
        T(
          "Commande non enregistrée. Votre sélection a été conservée.",
          "Order was not saved. Your selection has been retained.",
        ),
      );
    }
  };
};

const trackingFAQ = popularQuestions.find((q) => q.id === "tracking");
trackingFAQ.fr[1] =
  "Ouvrez « Mes commandes » dans Mon Yaviya, ou utilisez « Suivre ma commande » avec votre numéro. Le statut et l’historique sont enregistrés dans votre scénario privé et restent disponibles après rechargement.";
trackingFAQ.en[1] =
  "Open “My orders” in My Yaviya, or use “Track my order” with your order number. Status and history are saved in your private scenario and remain available after reloading.";
const sellerFAQ = popularQuestions.find((q) => q.id === "seller");
sellerFAQ.fr[1] =
  "Ouvrez Mon Yaviya puis « Devenir vendeur ». Complétez vos coordonnées, votre activité et votre identité, puis choisissez l’abonnement à la dernière étape. L’admin contrôle le dossier avant d’activer la boutique. Aucun abonnement n’est facturé dans le MVP.";
sellerFAQ.en[1] =
  "Open My Yaviya and choose “Become a seller”. Complete your details, business and identity, then choose a plan at the final step. Administration reviews your request before enabling the shop. No subscription is billed in the MVP.";
popularQuestions.push(
  {
    id: "courier",
    fr: [
      "Comment devenir livreur ?",
      "Dans Mon Yaviya, choisissez « Devenir livreur ». Renseignez vos coordonnées, soumettez votre identité et sélectionnez le forfait Standard gratuit à la dernière étape. Après validation, indiquez votre disponibilité pour recevoir des missions.",
    ],
    en: [
      "How do I become a courier?",
      "Choose “Become a courier” in My Yaviya. Enter your details, submit identity verification and select the free Standard plan at the last step. Once approved, set your availability to receive assignments.",
    ],
  },
  {
    id: "reviews",
    fr: [
      "Comment noter mon vendeur et mon livreur ?",
      "Après la livraison, confirmez la réception dans Mes commandes. Le formulaire vous demande une note de 1 à 5 pour chaque vendeur et pour le livreur affecté. Vous pouvez aussi laisser un commentaire. Une seule évaluation est enregistrée par commande.",
    ],
    en: [
      "How do I rate my seller and courier?",
      "After delivery, confirm receipt in My orders. Rate each seller and the assigned courier from 1 to 5, with an optional comment. Each order can be rated once.",
    ],
  },
);
const baseFinalAnswer = answerQuestion;
answerQuestion = function (q) {
  const text = q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const id = /noter|evaluation|rating|review|etoile/.test(text)
    ? "reviews"
    : /devenir livreur|inscription livreur|courier account|become a courier/.test(
          text,
        )
      ? "courier"
      : null;
  return id
    ? popularQuestions.find((x) => x.id === id)[pLang()][1]
    : baseFinalAnswer(q);
};
openOrderTracker = function () {
  openCustomerPage(() =>
    open(
      `<h2>${T("Suivre ma commande", "Track my order")}</h2><form id="track-order-form" class="editor"><label>${T("Numéro de commande", "Order number")}<input id="track-order-id" required placeholder="YV-XXXXXXXX" maxlength="90"></label><button class="primary">${T("Rechercher", "Search")}</button></form><div id="track-order-result" role="status"></div>`,
    ),
  );
  $("#track-order-form").onsubmit = (e) => {
    e.preventDefault();
    const id = $("#track-order-id").value.trim().toUpperCase(),
      order = orders.find((o) => o.id === id);
    $("#track-order-result").innerHTML = order
      ? sharedOrderMarkup(order) +
        `<button class="add" data-action="tracking">${T("Ouvrir Mes commandes", "Open My orders")}</button>`
      : `<p>${T("Aucune commande enregistrée avec ce numéro dans votre scénario.", "No saved order with this number in your scenario.")}</p>`;
  };
};
const finalLabel = sharedDeliveryLabel;
sharedDeliveryLabel = function (o) {
  if (o.cancelled) return finalLabel(o);
  if (o.step === 3 && !o.delivery?.courier && !o.buyerConfirmed)
    return T(
      "Remis au client · réception à confirmer",
      "Handed to customer · awaiting receipt confirmation",
    );
  if (allSellersAccepted(o) && !o.requestedCourier && o.step < 3)
    return T(
      "Commande acceptée · préparation ou retrait chez le vendeur",
      "Order accepted · preparation or seller collection",
    );
  return finalLabel(o);
};
$("#home-faq").dataset.language = "";
applyLanguage();
render();
renderOffers();
if (activeRole === "seller") showSeller();
if (activeRole === "admin") showAdmin();
if (activeRole === "courier") showCourier();
