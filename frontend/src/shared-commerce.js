// Authoritative shared marketplace: orders are read and changed through participant APIs.
let marketState = null,
  marketReady = false,
  marketLoading = false,
  marketPolling = false,
  marketError = "",
  marketCatalogue = [];
const comparableProduct = (p) =>
  JSON.stringify(
    Object.fromEntries(
      [
        "id",
        "seller",
        "title",
        "category",
        "subcategory",
        "price",
        "stock",
        "visible",
        "approved",
        "img",
        "images",
        "desc",
      ].map((k) => [k, p[k]]),
    ),
  );
async function marketAPI(path = "", body, method = "POST") {
  const endpoint = new URL("/api/marketplace" + path, location.origin);
  if (!endpoint.searchParams.has("view"))
    endpoint.searchParams.set("view", activeRole);
  const r = await fetch(endpoint.pathname + endpoint.search, {
      method: body ? method : "GET",
      headers:
        body && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {},
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    }),
    data = await r.json();
  if (!r.ok) {
    const e = Error(
      data.error ||
        T("Service indisponible. Réessayez.", "Service unavailable. Retry."),
    );
    e.status = r.status;
    throw e;
  }
  return data;
}
function applyMarket(data, redraw = true) {
  marketState = data;
  marketReady = deliveryReady = true;
  marketError = "";
  marketCatalogue = JSON.parse(JSON.stringify(data.catalogue));
  if (data.profile) customerProfile = { ...customerProfile, ...data.profile };
  for (const s of data.stores) {
    const local = shops.find((shop) => shop.id === s.id);
    const fields = {
      ...s,
      homeCountry: s.country,
      city: Object.keys(communes)[0],
      commune: communes[Object.keys(communes)[0]][0],
      domain: T("Boutique enregistrée", "Registered shop"),
      initials: s.name.slice(0, 2),
      reviewed: true,
    };
    if (local) Object.assign(local, fields);
    else shops.push(fields);
  }
  products.splice(0, products.length, ...data.catalogue);
  hydrateProductPhotos();
  orders.splice(0, orders.length, ...data.orders);
  courierAvailable = !!data.courierSettings?.available;
  document.querySelectorAll(".demo-role-bar [data-role]").forEach((b) => {
    b.disabled = b.dataset.role === "admin" && !data.roles.admin;
    b.title = !data.roles[b.dataset.role]
      ? T(
          "Ouvrir le dossier et les étapes de validation",
          "Open registration and verification steps",
        )
      : "";
  });
  setSyncStatus(
    T("Commandes partagées à jour · ", "Shared orders up to date · ") +
      new Date().toLocaleTimeString(),
  );
  render();
  renderOffers();
  if (redraw) redrawMarket();
}
let courierSettingsDirty = false,
  courierSettingsSaving = false;
function preserveCourierWorkspace() {
  return (
    courierSettingsDirty ||
    courierSettingsSaving ||
    !!$("#courier-chat-form") ||
    !!$("[data-review-panel=courier]")
  );
}
function redrawMarket() {
  if (preserveCourierWorkspace()) return;
  if (
    $("#product-form") ||
    $("#delivery-proof-form") ||
    $("#market-chat-form") ||
    $("#market-action-form") ||
    $("#delivery-rating-form") ||
    $("#register-form") ||
    $("#checkout-form")
  )
    return;
  if (activeRole === "seller") showSeller();
  else if (activeRole === "admin") showAdmin();
  else if (activeRole === "courier") showCourier();
  else if ($("#modal-content [data-shared-order]")) showTracking();
}
function marketReadView() {
  return activeRole === "courier" && !marketState?.roles.courier
    ? "buyer"
    : activeRole;
}
let marketLoadPromise = null,
  marketLoadingRole = null;
async function loadMarket(redraw = true) {
  if (marketLoadPromise) {
    const pendingRole = marketLoadingRole;
    const loaded = await marketLoadPromise;
    return pendingRole === activeRole ? loaded : loadMarket(redraw);
  }
  marketLoading = true;
  const role = activeRole;
  marketLoadingRole = role;
  marketLoadPromise = (async () => {
    try {
      let data;
      try {
        data = await marketAPI("?view=" + marketReadView());
      } catch (e) {
        if (e.status !== 403 || role !== "courier") throw e;
        data = await marketAPI("?view=buyer");
      }
      if (role !== activeRole) return false;
      applyMarket(data, redraw);
      return true;
    } catch (e) {
      marketError = e.message;
      setSyncStatus(e.message, true);
      return false;
    } finally {
      marketLoading = false;
    }
  })();
  try {
    return await marketLoadPromise;
  } finally {
    marketLoadPromise = null;
    marketLoadingRole = null;
  }
}
const sharedRole = setRole;
setRole = function (role, updateURL = true) {
  if (
    marketReady &&
    role !== "buyer" &&
    role !== "courier" &&
    !marketState.roles[role]
  ) {
    toast(
      T(
        "Créez et faites valider le compte correspondant.",
        "Create and verify the required account.",
      ),
    );
    if (role === "courier") showCourierOnboarding();
    else if (role === "seller") showSellerOnboarding();
    return;
  }
  courierSettingsDirty = false;
  sharedRole(role, updateURL);
  loadMarket();
};
ownedSellerIds = function () {
  return marketState?.sellerIds || [];
};
courierCanWork = function () {
  return !!marketState?.roles.courier;
};
const marketVerification = refreshVerification;
refreshVerification = async function () {
  await marketVerification();
  await loadMarket(!$("#register-form"));
};
// Existing product forms use this save entry point. Order actions never submit a client snapshot.
saveDelivery = async function () {
  if (!marketReady || deliverySaving) return false;
  deliverySaving = true;
  try {
    const changed = products.filter(
      (p) =>
        !p.crossMarket &&
        comparableProduct(p) !==
          comparableProduct(marketCatalogue.find((x) => x.id === p.id) || {}),
    );
    for (const p of changed)
      await marketAPI("/catalogue", {
        ...p,
        images: p.images || [p.img].filter(Boolean),
        img: p.images?.[0] || p.img || null,
      });
    await loadMarket(false);
    return true;
  } catch (e) {
    setSyncStatus(e.message, true);
    await loadMarket(false);
    return false;
  } finally {
    deliverySaving = false;
  }
};
pollDelivery = () => loadMarket();
assignAvailableCourier = () => {};
function marketProofUrl(o) {
  return (
    "/api/marketplace/proof?orderId=" +
    encodeURIComponent(o.id) +
    "&country=" +
    window.YAVIYA_COUNTRY
  );
}
proofMarkup = function (o) {
  return o.deliveryProof
    ? `<div class="delivery-proof"><b>${T("Preuve de livraison", "Delivery proof")}</b><a href="${marketProofUrl(o)}" target="_blank" rel="noopener"><img src="${marketProofUrl(o)}" alt="${T("Photo de livraison", "Delivery photo")}" loading="lazy"></a></div>`
    : "";
};
const payoutLabels = {
  awaiting_delivery: ["Après livraison", "After delivery"],
  awaiting_receipt: [
    "Confirmation et encaissement attendus",
    "Awaiting receipt and cash confirmation",
  ],
  due: ["À régler", "Due"],
  paid_manual: [
    "Règlement déclaré manuellement",
    "Manually recorded settlement",
  ],
};
function earningsMarkup(o, editable = false) {
  return `<section class="mission-earnings"><h4>${T("Rémunération de cette livraison", "Delivery earnings")}</h4><dl><div><dt>${T("Rémunération prévue", "Expected earnings")}</dt><dd>${money(o.courierEarnings || 0)}</dd></div><div><dt>${T("Frais de mission", "Assignment expenses")}</dt><dd>${money(o.courierExpenses || 0)}</dd></div><div><dt>${T("Bénéfice net estimé", "Estimated net earnings")}</dt><dd>${money(o.courierNet || 0)}</dd></div><div><dt>${T("Règlement", "Settlement")}</dt><dd>${T(...(payoutLabels[o.courierPayout?.status] || payoutLabels.awaiting_delivery))}</dd></div></dl>${o.courierPayout?.reference ? `<p>${T("Référence", "Reference")} : ${esc(o.courierPayout.reference)}</p>` : ""}${editable && o.courierPayout?.status !== "paid_manual" ? `<button class="add" data-commerce-action="expenses" data-order-id="${o.id}">${T("Renseigner mes frais", "Enter expenses")}</button>` : ""}<p class="demo-note">${T("Barème pilote : frais de livraison affectés au livreur. Aucun transfert automatique ; les règlements manuels sont déclaratifs.", "Pilot terms: delivery fees allocated to the courier. No automatic transfer; manual settlements are declarations.")}</p></section>`;
}
sharedOrderMarkup = function (o) {
  return `<article class="shared-order" data-shared-order="${esc(o.id)}"><h3>${esc(o.id)}</h3><p class="verification-status">${sharedDeliveryLabel(o)}</p><p>${esc(o.city)} · ${esc(o.commune || "")} · ${money(o.total)}</p><p>${esc(o.recipient?.name || "")} · ${esc(o.recipient?.phone || "")}${o.address ? " · " + esc(o.address) : ""}</p><p>${deliverySummary(o)}</p><p>${o.items.map((i) => esc(i.title) + " × " + i.q).join(", ")}</p><p>${T("Livreur affecté", "Assigned courier")} : <b>${esc(o.courierName || T("En attente", "Pending"))}</b></p><div class="seller-acceptance">${Object.entries(
    o.sellerAccepted,
  )
    .map(
      ([id, accepted]) =>
        `<span>${esc(shops.find((s) => s.id === +id)?.name || "Boutique " + id)} : ${accepted ? T("Acceptée", "Accepted") : T("À valider", "Pending")}${o.sellerSteps[id] >= 1 ? " · " + T("Colis prêt", "Ready") : ""}</span>`,
    )
    .join(
      "",
    )}</div><p><b>${esc(o.paymentState)}</b></p><p class="demo-note">${T("Escrow non activé : aucun fonds électronique n’est retenu ou libéré.", "Escrow is not enabled: no electronic funds are held or released.")}</p>${proofMarkup(o)}${["courier", "admin"].includes(activeRole) && o.requestedCourier ? earningsMarkup(o, activeRole === "courier") : ""}<button class="add" data-order-chat="${o.id}">${T("Discussion de la commande", "Order conversation")}</button><details><summary>${T("Historique", "History")}</summary><ul>${o.events.map((e) => `<li>${esc(e)}</li>`).join("")}</ul></details></article>`;
};
showTracking = function () {
  openCustomerPage(() =>
    open(
      `<h2>${T("Mes commandes", "My orders")}</h2><p>${T("Le suivi et la discussion sont partagés avec les vendeurs concernés, le livreur affecté et YAVIYA.", "Tracking and conversations are shared with the involved sellers, assigned courier and YAVIYA.")}</p>${orders.map((o) => sharedOrderMarkup(o) + (!o.cancelled && o.step === 3 && !o.buyerConfirmed ? `<button class="primary" data-receipt="${o.id}">${T("Confirmer la réception et évaluer", "Confirm receipt and rate")}</button>` : o.buyerConfirmed ? `<p>${T("Réception confirmée", "Receipt confirmed")}</p>${!o.cashBuyerConfirmed ? `<button class="add" data-commerce-action="cash_buyer" data-order-id="${o.id}">${T("Confirmer mon paiement en espèces", "Confirm cash payment")}</button>` : ""}` : "")).join("") || `<p>${marketError ? esc(marketError) : T("Aucune commande pour votre compte.", "No orders for your account.")}</p>`}`,
    ),
  );
  renderBuyerReviewButtons();
  refreshReviews("buyer");
};
const marketCheckout = showCheckout;
showCheckout = function (selection = cart) {
  if (!customerProfile) {
    showRegister();
    toast(
      T("Créez votre compte pour commander.", "Create your account to order."),
    );
    return;
  }
  marketCheckout(selection);
  const form = $("#checkout-form");
  if (!form) return;
  form.querySelectorAll("[name=payment]").forEach((input) => {
    input.disabled = input.value !== "cod";
    input.checked = input.value === "cod";
    if (input.disabled)
      input
        .closest("label")
        .insertAdjacentHTML(
          "beforeend",
          `<small>${T("À activer", "Pending activation")}</small>`,
        );
  });
  const note = $(".escrow-note");
  if (note)
    note.textContent = T(
      "Paiement en espèces à réception. Les paiements électroniques et l’escrow nécessitent l’activation du prestataire. Aucun débit électronique sur ce site.",
      "Cash on receipt. Electronic payments and escrow require provider activation. This site does not debit electronic funds.",
    );
  const addressLabel = form.querySelector("#address")?.closest("label");
  if (addressLabel) {
    addressLabel.childNodes[0].textContent = T(
      "Adresse de livraison *",
      "Delivery address *",
    );
    form.querySelector("#address").placeholder = T(
      "Avenue et numéro",
      "Street and number",
    );
  }
  form.querySelector("button.primary").textContent = T(
    "Enregistrer ma commande",
    "Save my order",
  );
  form.insertAdjacentHTML(
    "beforeend",
    '<p id="market-checkout-error" role="alert"></p>',
  );
  let requestKey = crypto.randomUUID();
  form.onsubmit = async (event) => {
    event.preventDefault();
    if (deliverySaving || !form.reportValidity()) return;
    if (!isDeliveryCityEnabled(form.querySelector("#city").value)) {
      $("#market-checkout-error").textContent = T(
        "Cette ville n’est pas encore ouverte aux commandes.",
        "Orders are not yet open in this city.",
      );
      return;
    }
    const button = form.querySelector("button.primary");
    button.disabled = true;
    const mode = form.querySelector("[name=deliveryMode]:checked").value,
      relay = (relayPoints[form.querySelector("#city").value] || []).find(
        (p) => p.id === form.querySelector("#relay").value,
      );
    try {
      const data = await marketAPI("/orders", {
        requestKey,
        items: [...selection].map(([id, q]) => ({ id, q })),
        city: form.querySelector("#city").value,
        commune: isHomeDelivery(mode)
          ? form.querySelector("#commune").value
          : mode === "relay"
            ? relay?.commune
            : "",
        address: isHomeDelivery(mode)
          ? form.querySelector("#address").value
          : "",
        recipient: {
          name: form.elements.recipientName.value.trim(),
          phone: form.elements.recipientPhone.value.trim(),
        },
        paymentId: form.querySelector("[name=payment]:checked").value,
        delivery: { mode },
      });
      selection.clear();
      updateCount();
      await loadMarket(false);
      showTracking();
      toast(T("Commande partagée enregistrée", "Shared order saved"));
    } catch (e) {
      const error = $("#market-checkout-error");
      if (error) error.textContent = e.message;
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  };
};
const marketSeller = showSeller;
showSeller = function () {
  if (!marketState?.roles.seller) {
    open(
      `<h2>${T("Mon espace vendeur", "Seller area")}</h2><p>${T("Créez votre compte vendeur et faites valider votre dossier.", "Create your seller account and get verified.")}</p><button class="primary" data-profile="seller">${T("Devenir vendeur", "Become a seller")}</button>`,
    );
    return;
  }
  marketSeller();
  const orderPanel = $("[data-dashboard-panel=orders]");
  for (const o of orders.filter(
    (o) =>
      o.step === 3 &&
      !o.requestedCourier &&
      !o.sellerCashConfirmed?.[selectedSeller],
  ))
    orderPanel?.insertAdjacentHTML(
      "beforeend",
      `<button class="add" data-commerce-action="cash_seller" data-order-id="${o.id}">${o.id} · ${T("Confirmer l’encaissement en espèces", "Confirm cash collection")}</button>`,
    );
  const wallet = $("[data-dashboard-panel=wallet]");
  if (wallet)
    wallet.innerHTML = `<h2>${T("Encaissements et règlements", "Collections and settlements")}</h2><p>${T("Paiement en espèces confirmé par les deux parties : ", "Cash payment confirmed by both parties: ")}${money(
      orders
        .filter((o) => o.paymentStatus === "cash_confirmed")
        .flatMap((o) => o.items.filter((i) => i.seller === selectedSeller))
        .reduce((sum, i) => sum + i.q * i.price, 0),
    )}</p><p>${T("Les reversements automatiques et l’escrow ne sont pas activés. Les recettes en espèces ne constituent pas un solde détenu par YAVIYA.", "Automatic payouts and escrow are not enabled. Cash receipts are not a balance held by YAVIYA.")}</p>`;
  $("#role-description").textContent = T(
    "Votre catalogue et les commandes partagées avec vos clients.",
    "Your catalogue and orders shared with your customers.",
  );
};
function courierSettlementForm() {
  const c = marketState?.courierSettings;
  return `<form id="courier-settlement-form" class="editor"><h3>${T("Disponibilité et règlements", "Availability and settlements")}</h3><label class="privacy-consent"><input type="checkbox" name="available" ${c?.available ? "checked" : ""}>${T("Je suis disponible pour accepter des missions", "I am available to accept assignments")}</label><label>${T("Mode de règlement", "Settlement method")}<select name="payoutMethod">${[
    ["mobile_money", "Mobile Money"],
    ["bank", T("Virement bancaire", "Bank transfer")],
    ["cash", T("Espèces", "Cash")],
  ]
    .map(
      ([id, label]) =>
        `<option value="${id}" ${c?.payout_method === id ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></label><label>${T("Numéro Mobile Money ou référence de compte", "Mobile Money number or account reference")}<input name="payoutAccount" maxlength="150" value="${esc(c?.payout_account || customerProfile?.phone || "")}"></label><label class="privacy-consent"><input name="benefitsAccepted" type="checkbox" required ${c?.benefits_accepted ? "checked" : ""}>${T("J’ai lu le barème pilote et les modalités de règlement par livraison.", "I have read the pilot terms and per-delivery settlement conditions.")}</label><button class="primary">${T("Enregistrer ma disponibilité", "Save availability")}</button><p id="courier-settings-error" role="alert"></p></form>`;
}
showCourier = function () {
  if (!marketState?.roles.courier) {
    const registered = customerProfile?.accountType === "courier";
    open(
      `<h2>${T("Mon espace livreur", "Courier area")}</h2><p class="verification-status">${esc(verificationStatus())}</p><p>${registered ? T("Votre dossier doit être validé par YAVIYA avant de recevoir des missions. Vous pouvez consulter votre dossier et contacter l’administration.", "YAVIYA must approve your identity before you receive assignments. You can review your request and contact administration.") : T("Inscrivez-vous en quatre étapes : coordonnées, identité, avantages et rémunération, puis abonnement et règlements.", "Register in four steps: contact details, identity, benefits and earnings, then plan and settlements.")}</p><button class="primary" id="start-courier-onboarding">${T(registered ? "Consulter / compléter mon dossier" : "Devenir livreur", registered ? "Review / complete my request" : "Become a courier")}</button>${registered ? `<button class="add" data-courier-tab="discussion">${T("Contacter YAVIYA", "Contact YAVIYA")}</button>${courierWorkspaceTab === "discussion" ? courierDiscussionMarkup("courier") : ""}` : ""}`,
    );
    $("#start-courier-onboarding").onclick = showCourierOnboarding;
    if (registered && courierWorkspaceTab === "discussion")
      loadCourierDiscussion("courier");
    $("#role-description").textContent = T(
      "Inscription, vérification et assistance livreur.",
      "Courier registration, verification and support.",
    );
    return;
  }
  const nav = courierNavigation().replace(
    "</nav>",
    `<button class="add" data-courier-tab="payments" aria-pressed="${courierWorkspaceTab === "payments"}">${T("Rémunération et règlements", "Earnings and settlements")}</button></nav>`,
  );
  if (courierWorkspaceTab === "discussion") {
    open(
      nav +
        "<h2>" +
        T("Discussion avec YAVIYA", "Talk to YAVIYA") +
        "</h2>" +
        courierDiscussionMarkup("courier"),
    );
    loadCourierDiscussion("courier");
    return;
  }
  if (courierWorkspaceTab === "reviews") {
    open(
      nav +
        "<h2>" +
        T("Mes évaluations", "My ratings") +
        '</h2><div data-review-panel="courier"></div>',
    );
    loadReviewPanel("courier");
    return;
  }
  const mine = orders.filter((o) => o.courierUserId === marketState.userId),
    pending = marketState.opportunities || [];
  open(
    nav +
      `<h2>${T("Mon espace livreur", "Courier workspace")}</h2><div class="dashboard-kpis"><div><span>${T("Missions en cours", "Active assignments")}</span><b>${mine.filter((o) => !o.cancelled && o.step < 3).length}</b></div><div><span>${T("À régler", "Due")}</span><b>${money(mine.filter((o) => o.courierPayout.status === "due").reduce((sum, o) => sum + o.courierEarnings, 0))}</b></div><div><span>${T("Règlements déclarés", "Recorded settlements")}</span><b>${money(mine.filter((o) => o.courierPayout.status === "paid_manual").reduce((sum, o) => sum + o.courierEarnings, 0))}</b></div></div>${courierWorkspaceTab === "payments" ? `<p>${esc(marketState.remuneration.label)}</p>${mine.map((o) => `<article class="shared-order"><h3>${o.id}</h3>${earningsMarkup(o, true)}</article>`).join("") || "<p>" + T("Aucune livraison.", "No deliveries.") + "</p>"}` : courierSettlementForm() + `<h3>${T("Missions proposées", "Available assignments")}</h3><div class="courier-opportunities">${pending.map((o) => `<article class="shared-order"><h4>${o.id}</h4><p>${esc(o.city)} · ${esc(o.commune)} · ${o.parcels} ${T("colis", "parcels")}</p><p>${T("Rémunération prévue", "Expected earnings")} : <b>${money(o.earnings)}</b></p><button class="primary" data-commerce-action="claim" data-order-id="${o.id}" data-revision="${o.revision}">${T("Accepter cette mission", "Accept assignment")}</button></article>`).join("") || "<p>" + (courierAvailable ? T("Aucune mission disponible. Les commandes apparaissent après validation de chaque vendeur.", "No available assignments. Orders appear once all sellers approve them.") : T("Vous êtes indisponible. Activez et enregistrez votre disponibilité pour voir les missions proposées.", "You are unavailable. Enable and save your availability to see offered assignments.")) + "</p>"}</div><h3>${T("Mes missions et livraisons", "My assignments and deliveries")}</h3><div class="courier-missions">${mine.map((o) => sharedOrderMarkup(o) + (!o.cancelled && o.courierStatus === "accepted" ? `<button class="primary" data-courier-collect="${o.id}" ${Object.values(o.sellerSteps).every((n) => n >= 1) ? "" : "disabled"}>${T("Confirmer la récupération", "Confirm collection")}</button>${Object.values(o.sellerSteps).every((n) => n >= 1) ? "" : `<p>${T("Attendez la préparation du colis par chaque vendeur.", "Wait for each seller to prepare their parcel.")}</p>`}` : o.courierStatus === "collected" ? `<button class="primary" data-proof-order="${o.id}">${T("Joindre la photo et confirmer la livraison", "Add photo and confirm delivery")}</button>` : o.step === 3 && !o.cashCourierConfirmed ? `<button class="add" data-commerce-action="cash_courier" data-order-id="${o.id}">${T("Déclarer l’encaissement des espèces", "Record cash collection")}</button>` : "")).join("") || "<p>" + T("Aucune mission affectée à votre compte.", "No assignments for your account.") + "</p>"}</div>`}`,
  );
  const form = $("#courier-settlement-form");
  if (form) {
    const account = form.elements.payoutAccount;
    function settlementRequirements() {
      account.required = form.elements.payoutMethod.value !== "cash";
    }
    settlementRequirements();
    form.elements.payoutMethod.onchange = settlementRequirements;
    form.addEventListener("input", () => (courierSettingsDirty = true));
    form.addEventListener("change", () => (courierSettingsDirty = true));
    form.onsubmit = async (e) => {
      e.preventDefault();
      if (courierSettingsSaving || !form.reportValidity()) return;
      const button = form.querySelector("button.primary"),
        error = form.querySelector("[role=alert]");
      courierSettingsSaving = true;
      button.disabled = true;
      error.textContent = "";
      try {
        await marketAPI("/courier", {
          available: form.elements.available.checked,
          payoutMethod: form.elements.payoutMethod.value,
          payoutAccount: account.value,
          benefitsAccepted: form.elements.benefitsAccepted.checked,
        });
        courierSettingsDirty = false;
        await loadMarket(false);
        courierSettingsSaving = false;
        showCourier();
        toast(
          T(
            "Disponibilité et coordonnées enregistrées.",
            "Availability and settlement details saved.",
          ),
        );
      } catch (e) {
        if (error.isConnected) error.textContent = e.message;
      } finally {
        courierSettingsSaving = false;
        if (button.isConnected) button.disabled = false;
      }
    };
  }
  $("#role-description").textContent = T(
    "Missions à votre nom, avantages, rémunération par livraison et assistance.",
    "Assignments in your name, benefits, delivery earnings and support.",
  );
};
const marketAdmin = showAdmin;
showAdmin = function () {
  if (!marketState?.roles.admin) {
    open(
      "<p>" +
        T(
          "Administration réservée au propriétaire.",
          "Administration is restricted to the owner.",
        ) +
        "</p>",
    );
    return;
  }
  marketAdmin();
  const finance = $("[data-dashboard-panel=finance]");
  if (finance)
    finance.innerHTML = `<h2>${T("Règlements des livreurs", "Courier settlements")}</h2><p>${T("Paiements électroniques et escrow non activés. Enregistrez ici uniquement un règlement effectué hors plateforme.", "Electronic payments and escrow are not enabled. Record only a settlement already made outside the platform.")}</p>${
      orders
        .filter((o) => o.courierUserId)
        .map(
          (o) =>
            `<article class="shared-order"><h3>${o.id} · ${esc(o.courierName)}</h3>${earningsMarkup(o)}${o.courierPayout.status === "due" ? `<button class="primary" data-commerce-action="payout" data-order-id="${o.id}">${T("Déclarer le règlement effectué", "Record completed settlement")}</button>` : ""}</article>`,
        )
        .join("") ||
      "<p>" + T("Aucune rémunération livreur.", "No courier earnings.") + "</p>"
    }`;
  const transfers = $("[data-dashboard-panel=transfers]");
  if (transfers)
    transfers.innerHTML =
      "<h2>" +
      T("Reversements vendeurs", "Seller payouts") +
      "</h2><p>" +
      T(
        "Aucun transfert automatique ni fonds escrow détenu. Activation du prestataire requise.",
        "No automatic transfers or escrow funds held. Provider activation is required.",
      ) +
      "</p>";
};
async function marketAction(o, action, extra = {}) {
  const result = await marketAPI("/orders/action", {
    orderId: o.id,
    revision: o.revision,
    action,
    ...extra,
  });
  await loadMarket(false);
  return result.order;
}
function actionForm(title, content, callback) {
  open(
    `<h2>${title}</h2><form id="market-action-form" class="editor">${content}<button class="primary">${T("Confirmer", "Confirm")}</button><p id="market-action-error" role="alert"></p></form>`,
  );
  const form = $("#market-action-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector("button.primary");
    button.disabled = true;
    try {
      await callback(form);
      redrawMarket();
    } catch (e) {
      $("#market-action-error").textContent = e.message;
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  };
}
showProofForm = function (o) {
  open(
    `<h2>${T("Livraison et encaissement", "Delivery and cash collection")} · ${o.id}</h2><form id="delivery-proof-form" class="editor"><label>${T("Photo de livraison *", "Delivery photo *")}<input type="file" name="photo" accept="image/jpeg,image/png" required capture="environment"></label><label class="privacy-consent"><input type="checkbox" name="delivered" required>${T("Je confirme avoir remis le colis au destinataire.", "I confirm handing the parcel to the recipient.")}</label><label class="privacy-consent"><input name="cashCollected" type="checkbox">${T("J’ai encaissé les espèces : ", "I collected the cash: ")}${money(o.total)}</label><p>${T("Cette case enregistre votre déclaration. Le client doit aussi confirmer le paiement.", "This records your declaration. The customer must also confirm payment.")}</p><button class="primary">${T("Confirmer la livraison", "Confirm delivery")}</button><p id="proof-error" role="alert"></p></form>`,
  );
  const form = $("#delivery-proof-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      const fd = new FormData();
      fd.set("photo", form.elements.photo.files[0]);
      fd.set("delivered", "true");
      fd.set("cashCollected", String(form.elements.cashCollected.checked));
      fd.set("orderId", o.id);
      fd.set("revision", o.revision);
      await marketAPI("/proof", fd);
      await loadMarket(false);
      showCourier();
    } catch (e) {
      $("#proof-error").textContent = e.message;
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  };
};
window.handleCommerceClick = async function (b) {
  if (!marketReady) return;
  const id =
      b.dataset.sellerAccept ||
      b.dataset.sellerDecline ||
      b.dataset.sellerPrepare ||
      b.dataset.sellerHandover ||
      b.dataset.courierCollect ||
      b.dataset.proofOrder ||
      b.dataset.receipt ||
      b.dataset.orderId ||
      b.dataset.orderChat,
    o =
      orders.find((o) => o.id === id) ||
      (marketState.opportunities || []).find((o) => o.id === id);
  if (!o) return;
  try {
    if (b.dataset.orderChat) {
      await showOrderChat(o);
      return;
    }
    if (b.dataset.proofOrder) {
      showProofForm(o);
      return;
    }
    if (b.dataset.sellerHandover) {
      actionForm(
        T(
          "Confirmer la remise et l’encaissement",
          "Confirm handover and collection",
        ),
        `<p>${o.id}</p><label class="privacy-consent"><input name="cashCollected" type="checkbox">${T("J’ai encaissé les espèces pour ma boutique.", "I collected the cash for my shop.")}</label>`,
        async (form) => {
          await marketAction(o, "seller_handover", {
            sellerId: selectedSeller,
            cashCollected: form.elements.cashCollected.checked,
          });
          showSeller();
        },
      );
      return;
    }
    if (b.dataset.receipt) {
      actionForm(
        T("Confirmer ma réception", "Confirm receipt"),
        `<p>${o.id}</p><label class="privacy-consent"><input name="receipt" type="checkbox" required>${T("J’ai reçu les articles de cette commande.", "I received the ordered items.")}</label><label class="privacy-consent"><input name="cashPaid" type="checkbox">${T("J’ai payé les espèces : ", "I paid in cash: ")}${money(o.total)}</label>`,
        async (form) => {
          await marketAction(o, "buyer_receipt", {
            cashPaid: form.elements.cashPaid.checked,
          });
          await refreshReviews("buyer");
          showDeliveryRating(o.id);
        },
      );
      return;
    }
    if (b.dataset.commerceAction === "expenses") {
      actionForm(
        T("Frais de mission", "Assignment expenses"),
        `<label>${T("Frais engagés", "Expenses")}<input type="number" name="expenses" min="0" max="1000000000" step="1" required value="${o.courierExpenses}"></label>`,
        async (form) => {
          await marketAction(o, "courier_expenses", {
            expenses: Number(form.elements.expenses.value),
          });
          showCourier();
        },
      );
      return;
    }
    if (b.dataset.commerceAction === "payout") {
      actionForm(
        T("Déclarer un règlement effectué", "Record completed settlement"),
        `<p>${esc(o.courierName)} · ${money(o.courierEarnings)}</p><label>${T("Mode de règlement", "Method")}<select name="channel"><option value="mobile_money">Mobile Money</option><option value="bank">${T("Virement bancaire", "Bank transfer")}</option><option value="cash">${T("Espèces", "Cash")}</option></select></label><label>${T("Référence du règlement effectué *", "Completed settlement reference *")}<input name="reference" required maxlength="150"></label><p>${T("Cette déclaration ne déclenche aucun transfert.", "This declaration does not initiate a transfer.")}</p>`,
        async (form) => {
          await marketAction(o, "courier_payout", {
            reference: form.elements.reference.value,
            channel: form.elements.channel.value,
          });
          showAdmin();
        },
      );
      return;
    }
    const action = b.dataset.sellerAccept
      ? "seller_accept"
      : b.dataset.sellerDecline
        ? "seller_decline"
        : b.dataset.sellerPrepare
          ? "seller_prepare"
          : b.dataset.sellerHandover
            ? "seller_handover"
            : b.dataset.courierCollect
              ? "courier_collect"
              : b.dataset.commerceAction === "claim"
                ? "courier_claim"
                : b.dataset.commerceAction === "cash_buyer"
                  ? "cash_confirm"
                  : b.dataset.commerceAction === "cash_courier" ||
                      b.dataset.commerceAction === "cash_seller"
                    ? "cash_confirm"
                    : null;
    if (!action) return;
    b.disabled = true;
    await marketAction(o, action, {
      sellerId: selectedSeller,
      side:
        b.dataset.commerceAction === "cash_buyer"
          ? "buyer"
          : b.dataset.commerceAction === "cash_seller"
            ? "seller"
            : "courier",
    });
    redrawMarket();
  } catch (e) {
    toast(e.message);
    if (e.status === 409) await loadMarket();
  } finally {
    if (b.isConnected) b.disabled = false;
  }
};
async function showOrderChat(o) {
  open(
    `<section class="market-chat"><button class="add" id="market-chat-back">${T("Revenir aux commandes", "Back to orders")}</button><h2>${T("Discussion de la commande", "Order conversation")} · ${o.id}</h2><p>${T("Visible uniquement par les participants de la commande et l’administration.", "Visible only to order participants and administration.")}</p><div id="market-chat-messages" role="log" aria-live="polite"></div><form id="market-chat-form" class="editor"><label>${T("Votre message", "Your message")}<textarea name="message" rows="3" maxlength="2000" required></textarea></label><button class="primary">${T("Envoyer", "Send")}</button><p id="market-chat-error" role="alert"></p></form></section>`,
  );
  const form = $("#market-chat-form"),
    host = $("#market-chat-messages");
  async function refresh() {
    try {
      const messages = await marketAPI(
        "/messages?orderId=" + encodeURIComponent(o.id),
      );
      if (!host.isConnected) return;
      host.innerHTML =
        messages
          .map(
            (m) =>
              `<article class="seller-chat-message"><b>${esc(m.senderName || m.senderRole)} · ${T(...roleTitles[m.senderRole])}</b><p>${esc(m.message)}</p><small>${new Date(m.createdAt).toLocaleString()}</small></article>`,
          )
          .join("") || "<p>" + T("Aucun message.", "No messages.") + "</p>";
    } catch (e) {
      if (host.isConnected) $("#market-chat-error").textContent = e.message;
    }
  }
  await refresh();
  $("#market-chat-back").onclick = () => {
    if (activeRole === "buyer") showTracking();
    else if (activeRole === "seller") showSeller();
    else if (activeRole === "courier") showCourier();
    else showAdmin();
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    try {
      await marketAPI("/messages", {
        orderId: o.id,
        view: activeRole,
        message: form.elements.message.value,
      });
      form.elements.message.value = "";
      await refresh();
    } catch (e) {
      $("#market-chat-error").textContent = e.message;
    }
  };
  const timer = setInterval(() => {
    if (!host.isConnected) {
      clearInterval(timer);
      return;
    }
    refresh();
  }, 4000);
}
const sharedRatingPage = showDeliveryRating;
showDeliveryRating = function (id) {
  sharedRatingPage(id);
  const o = orders.find((o) => o.id === id),
    legend = $("#delivery-rating-form [name=courier]")
      ?.closest("fieldset")
      ?.querySelector("legend");
  if (legend && o)
    legend.textContent =
      T("Livreur : ", "Courier: ") +
      (o.courierName || T("Livreur affecté", "Assigned courier")) +
      " *";
};
openOrderTracker = function () {
  openCustomerPage(() =>
    open(
      `<h2>${T("Suivre ma commande", "Track my order")}</h2><form id="track-order-form" class="editor"><label>${T("Numéro de commande", "Order number")}<input id="track-order-id" required maxlength="90"></label><button class="primary">${T("Rechercher", "Search")}</button></form><div id="track-order-result" role="status"></div>`,
    ),
  );
  $("#track-order-form").onsubmit = async (e) => {
    e.preventDefault();
    await loadMarket(false);
    const o = orders.find(
      (o) => o.id === $("#track-order-id").value.trim().toUpperCase(),
    );
    $("#track-order-result").innerHTML = o
      ? sharedOrderMarkup(o)
      : "<p>" +
        T(
          "Aucune commande accessible avec ce numéro.",
          "No accessible order with this number.",
        ) +
        "</p>";
  };
};
const sharedFAQ = popularQuestions.find((q) => q.id === "tracking");
sharedFAQ.fr[1] =
  "Votre commande est partagée avec les boutiques concernées, le livreur affecté et YAVIYA. Ouvrez Mes commandes pour suivre les étapes et accéder à la discussion. Les anciens scénarios privés ne sont pas des commandes partagées.";
sharedFAQ.en[1] =
  "Your order is shared with the involved shops, assigned courier and YAVIYA. Open My orders to track progress and join the conversation. Older private scenarios are not shared orders.";
const courierFAQ = popularQuestions.find((q) => q.id === "courier");
courierFAQ.fr[1] =
  "L’inscription livreur comprend quatre étapes : coordonnées, identité, avantages et rémunération, puis abonnement Standard gratuit et coordonnées de règlement. Après validation, activez votre disponibilité et acceptez une mission.";
courierFAQ.en[1] =
  "Courier registration has four steps: contact details, identity, benefits and earnings, then the free Standard plan and settlement details. Once approved, set your availability and accept an assignment.";
document.querySelector(".demo-role-bar>span").textContent = T(
  "ESPACES DU COMPTE",
  "ACCOUNT AREAS",
);
verificationAPI("/bootstrap", {})
  .catch(() => {})
  .then(() => loadMarket());
setInterval(() => {
  if (
    document.hidden ||
    marketPolling ||
    deliverySaving ||
    $("#product-form") ||
    $("#delivery-proof-form") ||
    $("#market-action-form") ||
    $("#market-chat-form") ||
    $("#checkout-form") ||
    $("#register-form")
  )
    return;
  marketPolling = true;
  loadMarket().finally(() => (marketPolling = false));
}, 4000);

for (const q of faqItems) {
  if (/escrow/i.test(q[0])) {
    q[2] =
      "L’escrow n’est pas activé : aucun fonds électronique n’est retenu ni libéré. Les paiements électroniques nécessitent un compte marchand et un prestataire adapté. Le paiement en espèces à réception se confirme séparément par l’acheteur et l’encaisseur.";
    q[3] =
      "Escrow is not enabled: no electronic funds are held or released. Electronic payments require a merchant account and a suitable provider. Cash on receipt is confirmed separately by the buyer and collector.";
  }
}
for (const q of popularQuestions) {
  if (/paiement|escrow/i.test(q.fr[0])) {
    q.fr[1] =
      "Les commandes partagées proposent actuellement les espèces à réception. Les paiements Mobile Money, cartes et escrow ne sont pas activés : aucun débit, retenue ou libération électronique. Les déclarations d’encaissement et de règlement manuel sont conservées par commande.";
    q.en[1] =
      "Shared orders currently support cash on receipt. Mobile Money, cards and escrow are not enabled: no electronic debit, hold or release. Cash collection and manual settlement declarations are saved per order.";
  }
}
$("#home-faq").dataset.language = "";
applyLanguage();

// Make public role references visible in the associated workspace.
function showWorkspaceIdentifiers() {
  const host = $("#role-content");
  if (
    !host ||
    !["seller", "courier"].includes(activeRole) ||
    host.querySelector(".account-identifiers")
  )
    return;
  host.insertAdjacentHTML("afterbegin", accountIdentifiersMarkup());
}
const courierWithIdentifiers = showCourier;
showCourier = function () {
  courierWithIdentifiers();
  showWorkspaceIdentifiers();
};
const sellerWithIdentifiers = showSeller;
showSeller = function () {
  sellerWithIdentifiers();
  showWorkspaceIdentifiers();
};
