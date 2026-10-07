let verificationState = { check: null, stores: [], isAdmin: false },
  verificationLoaded = false;
const demoMerchantStores = [shops[0].id, shops[3].id];
const noticeEvents = [];
let noticesOpen = false;
const documentLabels = {
  identity: ["Carte d’identité", "Identity card"],
  passport: ["Passeport", "Passport"],
  "licence-b": ["Permis B", "Driving licence B"],
  "licence-c": ["Permis C · livreur", "Driving licence C · courier"],
  voter: ["Carte d’électeur", "Voter card"],
};
async function verificationAPI(path = "", body) {
  const options =
    body instanceof FormData
      ? { method: "POST", body }
      : body
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {};
  const r = await fetch("/api/verification" + path, options);
  const d = await r.json();
  if (!r.ok)
    throw Error(
      d.error ||
        T(
          "Vérification indisponible. Réessayez.",
          "Verification unavailable. Please retry.",
        ),
    );
  return d;
}
function ownedSellerIds() {
  return customerProfile?.accountType === "seller"
    ? verificationState.check?.status === "approved"
      ? verificationState.stores.map((s) => 10000 + s.id)
      : []
    : demoMerchantStores;
}
function notice(role, title, message, recipient) {
  noticeEvents.unshift({
    id: crypto.randomUUID(),
    role,
    title,
    message,
    recipient,
    read: false,
    at: Date.now(),
  });
  renderNoticeBadge();
}
function visibleNotices() {
  return noticeEvents.filter(
    (n) =>
      n.role === activeRole &&
      (n.role !== "seller" ||
        n.recipient === undefined ||
        ownedSellerIds().includes(n.recipient)) &&
      (n.role !== "courier" ||
        n.recipient === undefined ||
        n.recipient === "yaviya"),
  );
}
function renderNoticeBadge() {
  const workspace = $("#role-workspace .role-heading");
  if (workspace && !workspace.querySelector("#workspace-notices")) {
    const b = document.createElement("button");
    b.id = "workspace-notices";
    b.className = "add";
    b.textContent = T("Notifications", "Notifications");
    b.onclick = showNotifications;
    workspace.append(b);
  }
  const unread = visibleNotices().filter((n) => !n.read).length;
  const workspaceButton = $("#workspace-notices");
  if (workspaceButton)
    workspaceButton.textContent =
      T("Notifications", "Notifications") + (unread ? " (" + unread + ")" : "");
  const b = $("#notification-count");
  if (b) {
    const count = unread;
    b.textContent = count;
    b.hidden = !count;
  }
}
function showNotifications() {
  const list = visibleNotices();
  open(
    `<h2>${T("Notifications", "Notifications")}</h2><p class="demo-note">${T("Alertes dans la démo pendant cette visite. Aucun SMS, e-mail ou notification push externe n’est envoyé.", "In-app demo alerts during this visit. No external SMS, email or push notification is sent.")}</p>${list.map((n) => `<article class="notice-item"><b>${esc(n.title)}</b><p>${esc(n.message)}</p><small>${new Date(n.at).toLocaleTimeString()}</small></article>`).join("") || `<p>${T("Aucune notification pour cet espace.", "No notifications for this area.")}</p>`}`,
  );
  list.forEach((n) => (n.read = true));
  renderNoticeBadge();
}
document
  .querySelector(".header-actions")
  .insertAdjacentHTML(
    "beforeend",
    `<button id="notification-bell" class="icon-btn" aria-label="${T("Notifications", "Notifications")}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5z"/><path d="M10 20h4"/></svg><b id="notification-count" hidden></b></button>`,
  );
$("#notification-bell").onclick = showNotifications;
function verificationStatus() {
  const state = verificationState.check;
  return !verificationLoaded
    ? T("Chargement du dossier…", "Loading verification…")
    : !state
      ? T("Dossier à soumettre", "Submit your verification")
      : state.status === "approved" &&
          (!state.issuingCountry ||
            !["image/jpeg", "image/png"].includes(state.documentMime))
        ? T(
            "Dossier à compléter : pays d’émission et photo de la pièce.",
            "Complete your issuing country and identity photo.",
          )
        : state.status === "approved"
          ? T(
              "Vérifié et validé manuellement",
              "Manually verified and approved",
            )
          : state.status === "rejected"
            ? T("Dossier refusé : ", "Request rejected: ") + state.note
            : T(
                "En attente de vérification manuelle par l’admin",
                "Awaiting manual administrator verification",
              );
}
async function refreshVerification() {
  try {
    const previous = verificationState.check?.status;
    verificationState = await verificationAPI();
    verificationLoaded = true;
    shops.filter((s) => s.id >= 10000).forEach((s) => (s.reviewed = false));
    verificationState.stores.forEach((s) => {
      const id = 10000 + s.id;
      if (!shops.some((x) => x.id === id))
        shops.push({
          id,
          name: s.name,
          homeCountry: s.country,
          city: Object.keys(communes)[0],
          commune: communes[Object.keys(communes)[0]][0],
          domain: "Boutique enregistrée",
          initials: s.name.slice(0, 2),
          reviewed: true,
          demoPlan: verificationState.check?.sellerPlan || "free",
        });
      else
        Object.assign(
          shops.find((x) => x.id === id),
          {
            reviewed: true,
            demoPlan: verificationState.check?.sellerPlan || "free",
          },
        );
    });
    render();
    renderOffers();
    if (previous && verificationState.check?.status !== previous)
      notice(
        verificationState.check?.kind === "courier" ? "courier" : "seller",
        T("Votre dossier de vérification", "Your verification request"),
        verificationStatus(),
        ownedSellerIds()[0],
      );
    if (activeRole === "seller") showSeller();
    if (
      activeRole === "courier" &&
      !$("#register-form") &&
      !$("#courier-settlement-form") &&
      !$("#courier-chat-form") &&
      !$("#delivery-proof-form") &&
      !$("#market-action-form") &&
      !$("#market-chat-form")
    )
      showCourier();
    if (activeRole === "admin") showAdmin();
  } catch {
    verificationLoaded = false;
  }
}
function identityFields() {
  const c = verificationState.check;
  return `<section id="identity-fields" class="identity-fields" hidden><h3>${T("Vérification du vendeur ou du livreur", "Seller or courier verification")}</h3><p class="verification-status">${esc(verificationStatus())}</p><div id="company-fields"><label>${T("Nom de l’entreprise *", "Company name *")}<input name="companyName" maxlength="150" value="${esc(c?.companyName || "")}"></label><label class="unregistered-choice"><input type="checkbox" name="unregistered" ${c?.unregistered ? "checked" : ""}><span>${T("Petite entreprise non enregistrée · pas de numéro RCCM", "Unregistered small business · no RCCM number")}</span></label><label>${T("Numéro d’entreprise RCM / RCCM *", "Company RCM / RCCM number *")}<input name="companyRcm" maxlength="100" value="${esc(c?.companyRcm || "")}"></label></div><label>${T("Pièce d’identité *", "Identity document *")}<select name="documentType"><option value="">${T("Choisir", "Select")}</option>${Object.entries(
    documentLabels,
  )
    .map(
      ([id, label]) =>
        `<option value="${id}" ${c?.documentType === id ? "selected" : ""}>${T(...label)}</option>`,
    )
    .join(
      "",
    )}</select></label><label>${T("Pays d’émission de la pièce d’identité *", "Identity document issuing country *")}<select name="issuingCountry"><option value="">${T("Choisir le pays", "Select country")}</option>${window.YAVIYA_MARKET_CONFIG.identityCountries.map((country) => `<option value="${country.code}" ${c?.issuingCountry === country.code ? "selected" : ""}>${esc(T(country.fr, country.en))}</option>`).join("")}</select></label><label>${T("Photo de la pièce d’identité *", "Identity document photo *")}<input type="file" name="identityDocument" accept="image/jpeg,image/png"></label>${c?.fileName ? `<p>${T("Document déjà soumis : ", "Previously submitted document: ")}${esc(c.fileName)} · <a href="/api/verification/document?country=${window.YAVIYA_COUNTRY}" target="_blank" rel="noopener">${T("Consulter", "View")}</a></p>` : ""}<p class="demo-note">${T("Photo JPG ou PNG, maximum 8 Mo. Le document est conservé dans un espace privé pour le contrôle manuel ; il n’est pas affiché aux clients ni aux autres vendeurs. Pour tester, utilisez un document fictif.", "JPG or PNG photo, maximum 8 MB. The document is privately stored for manual review; it is not shown to customers or other sellers. Use a fictional document for testing.")}</p><label class="privacy-consent"><input type="checkbox" name="identityConfirmed"><span>${T("Je confirme que cette pièce correspond à mon identité et que les informations fournies sont exactes. *", "I confirm this document represents my identity and the supplied information is accurate. *")}</span></label></section>`;
}
const beforeVerificationRegister = showRegister;
showRegister = function () {
  beforeVerificationRegister();
  const form = $("#register-form");
  if (!form) return;
  form
    .querySelector(".privacy-consent")
    .insertAdjacentHTML("beforebegin", identityFields());
  function change() {
    const type =
        form.querySelector("[name=accountType]:checked")?.value || "buyer",
      needed = type !== "buyer",
      sameCheck =
        verificationState.check?.kind === type &&
        !!verificationState.check?.fileName &&
        ["image/jpeg", "image/png"].includes(
          verificationState.check?.documentMime,
        );
    $("#identity-fields").hidden = !needed;
    $("#company-fields").hidden = type !== "seller";
    for (const name of [
      "companyName",
      "companyRcm",
      "documentType",
      "issuingCountry",
      "identityDocument",
      "identityConfirmed",
    ]) {
      const el = form.elements[name];
      el.disabled =
        !needed || (name.startsWith("company") && type !== "seller");
      el.required =
        needed &&
        !el.disabled &&
        (name !== "identityDocument" || !sameCheck) &&
        (name !== "companyRcm" || !form.elements.unregistered.checked);
    }
    const permit = form.elements.documentType.querySelector(
      '[value="licence-c"]',
    );
    permit.hidden = permit.disabled = type !== "courier";
    if (type !== "courier" && form.elements.documentType.value === "licence-c")
      form.elements.documentType.value = "";
    form.elements.unregistered.disabled = type !== "seller";
    form.elements.companyRcm.disabled =
      type !== "seller" || form.elements.unregistered.checked;
    form.elements.companyRcm.required =
      type === "seller" && !form.elements.unregistered.checked;
    form.elements.identityConfirmed.checked = sameCheck;
  }
  form
    .querySelectorAll("[name=accountType]")
    .forEach((el) => el.addEventListener("change", change));
  form.elements.unregistered.addEventListener("change", change);
  change();
  if (!verificationLoaded) refreshVerification();
};
const profileBeforeVerification = customerAPI;
customerAPI = async function (body) {
  if (!body?.accountType) return profileBeforeVerification(body);
  const type = body.accountType,
    form = $("#register-form");
  let file, fields;
  if (type !== "buyer") {
    if (!form)
      throw Error(
        T(
          "Ouvrez le formulaire de vérification.",
          "Open the verification form.",
        ),
      );
    file = form.elements.identityDocument.files[0];
    fields = {
      companyName: form.elements.companyName.value.trim(),
      companyRcm: form.elements.companyRcm.value.trim(),
      documentType: form.elements.documentType.value,
      issuingCountry: form.elements.issuingCountry.value,
      unregistered: String(form.elements.unregistered.checked),
      sellerPlan:
        form.elements.sellerPlan?.value ||
        verificationState.check?.sellerPlan ||
        "free",
      courierPlan: form.elements.courierPlan?.value || "standard",
      courierBenefitsAccepted: String(
        form.elements.courierBenefitsAccepted?.checked || false,
      ),
      courierPayoutMethod:
        form.elements.courierPayoutMethod?.value || "mobile_money",
      courierPayoutAccount: form.elements.courierPayoutAccount?.value || "",
    };
    if (
      !form.elements.identityConfirmed.checked ||
      !fields.documentType ||
      !fields.issuingCountry ||
      (type === "seller" &&
        (!fields.companyName ||
          (fields.unregistered !== "true" && !fields.companyRcm)))
    )
      throw Error(
        T(
          "Complétez et confirmez votre dossier de vérification.",
          "Complete and confirm your verification request.",
        ),
      );
    if (
      !file &&
      !(
        verificationState.check?.kind === type &&
        verificationState.check?.fileName &&
        ["image/jpeg", "image/png"].includes(
          verificationState.check?.documentMime,
        )
      )
    )
      throw Error(
        T("Joignez votre pièce d’identité.", "Attach your identity document."),
      );
    if (file && !["image/jpeg", "image/png"].includes(file.type))
      throw Error(
        T("Joignez une photo JPG ou PNG.", "Attach a JPG or PNG photo."),
      );
    if (file && file.size > 8 * 1024 * 1024)
      throw Error(
        T(
          "Le document doit faire moins de 8 Mo.",
          "Document must be smaller than 8 MB.",
        ),
      );
  }
  const allowed = Object.fromEntries(
    [
      "name",
      "firstName",
      "lastName",
      "phone",
      "email",
      "address",
      "accountType",
      "privacyConsent",
      "privacyVersion",
    ].map((k) => [k, body[k]]),
  );
  const saved = await profileBeforeVerification(allowed);
  customerProfile = {
    ...allowed,
    accountIds: saved.accountIds,
    accountId: saved.accountId,
    customerNumber: saved.customerNumber,
    sellerNumber: saved.sellerNumber,
    courierNumber: saved.courierNumber,
  };
  if (type !== "buyer") {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.set(k, v));
    if (file) fd.set("document", file);
    fd.set("identityConfirmed", "true");
    const result = await verificationAPI("", fd);
    if (result.status === "pending") {
      notice(
        type === "seller" ? "seller" : "courier",
        T("Dossier reçu", "Request received"),
        T(
          "Votre dossier attend la vérification manuelle de l’admin.",
          "Your request awaits manual administrator review.",
        ),
        ownedSellerIds()[0],
      );
      notice(
        "admin",
        T("Nouveau dossier à vérifier", "New verification request"),
        type === "seller"
          ? T(
              "Inscription vendeur avec RCM/RCCM et identité",
              "Seller registration with RCM/RCCM and identity",
            )
          : T(
              "Inscription livreur avec identité",
              "Courier registration with identity",
            ),
      );
    }
  }
  await refreshVerification();
  return saved;
};
const scopedSeller = showSeller;
showSeller = function () {
  const ids = ownedSellerIds();
  if (!ids.length) {
    open(
      `<h2>${T("Mon espace vendeur", "My seller area")}</h2><p class="verification-status">${esc(verificationStatus())}</p><p>${T("Votre boutique sera accessible après validation manuelle de votre entreprise et de votre identité.", "Your shop will become available after manual approval of your company and identity.")}</p><button class="primary" data-client="register">${T("Mon dossier et mon profil", "My verification and profile")}</button>`,
    );
    return;
  }
  if (!ids.includes(selectedSeller)) selectedSeller = ids[0];
  scopedSeller();
  const select = $("#seller-switch");
  if (select)
    select.onchange = (e) => {
      const id = +e.target.value;
      if (ids.includes(id)) {
        selectedSeller = id;
        showSeller();
      }
    };
  const business = $("#business-stores");
  if (business)
    business.addEventListener(
      "submit",
      (e) => {
        const choices = [
          ...business.querySelectorAll("[name=enterprise-store]:checked"),
        ].map((x) => +x.value);
        if (choices.some((id) => !ids.includes(id))) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      true,
    );
  renderNoticeBadge();
};
const scopedEditor = editProduct;
editProduct = function (id) {
  const p = id ? products.find((p) => p.id === id) : null;
  if (!ownedSellerIds().includes(p?.seller || selectedSeller)) {
    toast(
      T(
        "Vous ne pouvez gérer que vos boutiques.",
        "You can only manage your own shops.",
      ),
    );
    return;
  }
  scopedEditor(id);
};
const previousAdd = add;
add = function (id) {
  const before = cart.get(id) || 0;
  previousAdd(id);
  if ((cart.get(id) || 0) > before) {
    if (activeRole !== "buyer") setRole("buyer");
    showCart();
  }
};
const previousCart = showCart;
showCart = function () {
  previousCart();
  const host =
    activeRole === "buyer" ? $("#modal-content") : $("#role-content");
  host.insertAdjacentHTML(
    "beforeend",
    `<button type="button" class="add" id="continue-shopping">${T("Continuer mes achats", "Continue shopping")}</button>`,
  );
  $("#continue-shopping").onclick = () => {
    if (modal.open) modal.close();
    setRole("buyer");
    $("#catalog").scrollIntoView({ behavior: "smooth" });
  };
};
let trackedOrderIds = new Set();
const notificationCheckout = showCheckout;
showCheckout = function (selection) {
  notificationCheckout(selection);
  const form = $("#checkout-form");
  if (!form) return;
  const previous = form.onsubmit;
  form.onsubmit = (e) => {
    const count = orders.length;
    previous(e);
    if (orders.length > count) {
      const o = orders[0];
      o.buyer = customerProfile?.customerNumber || "demo-buyer";
      o.assignedCourier = o.delivery?.courier || null;
      notice(
        "buyer",
        T(
          "Commande reçue · validation vendeur en attente",
          "Order received · awaiting seller acceptance",
        ),
        o.id,
      );
      [...new Set(o.items.map((i) => i.seller))].forEach((id) =>
        notice(
          "seller",
          T("Nouvelle vente", "New sale"),
          o.id +
            " · " +
            o.items
              .filter((i) => i.seller === id)
              .map((i) => i.title + " × " + i.q)
              .join(", "),
          id,
        ),
      );
      if (o.assignedCourier)
        notice(
          "courier",
          T("Nouvelle mission de livraison", "New delivery assignment"),
          o.id + " · " + o.city,
          o.assignedCourier,
        );
      trackedOrderIds.add(o.id);
    }
  };
};
function courierCanWork() {
  return (
    customerProfile?.accountType !== "courier" ||
    (verificationState.check?.kind === "courier" &&
      verificationState.check.status === "approved")
  );
}
function showCourier() {
  if (!courierCanWork()) {
    open(
      `<h2>${T("Mon espace livreur", "My courier area")}</h2><p class="verification-status">${esc(verificationStatus())}</p><button class="primary" data-client="register">${T("Compléter mon identité", "Complete identity verification")}</button>`,
    );
    return;
  }
  const mine = orders.filter(
    (o) => o.assignedCourier === "yaviya" && !o.buyerConfirmed,
  );
  open(
    `<h2>${T("Tableau de bord livreur", "Courier dashboard")}</h2><p>${T("YAVIYA Courier · mes missions uniquement", "YAVIYA Courier · my assignments only")}</p><p class="demo-note">${T("Courses de démonstration pendant cette visite. La livraison réelle et les affectations individuelles restent à activer.", "Demo assignments during this visit. Real delivery and individual assignments remain to be activated.")}</p><div class="courier-missions">${
      mine
        .map((o) => {
          const prepared = Object.values(o.sellerSteps).every((n) => n >= 1),
            status = o.courierStatus || "assigned";
          return `<article class="order-box"><h3>${esc(o.id)}</h3><p>${esc(o.city)} · ${esc(o.commune || "")}</p><p>${deliverySummary(o)}</p><p>${esc(o.items.map((i) => i.title + " × " + i.q).join(", "))}</p><p>${T("Statut : ", "Status: ")}${T(status === "assigned" ? "Mission reçue" : status === "accepted" ? "Mission acceptée" : status === "collected" ? "Colis récupérés" : "Livré", status === "assigned" ? "Assigned" : status === "accepted" ? "Accepted" : status === "collected" ? "Collected" : "Delivered")}</p>${status !== "delivered" ? `<button class="primary" data-courier-order="${o.id}" ${status === "accepted" && !prepared ? "disabled" : ""}>${T(status === "assigned" ? "Accepter la mission" : status === "accepted" ? "Confirmer la récupération" : "Confirmer la livraison", status === "assigned" ? "Accept assignment" : status === "accepted" ? "Confirm collection" : "Confirm delivery")}</button>` : ""}${!prepared ? `<small>${T("Récupération disponible après préparation par chaque vendeur.", "Collection becomes available after each seller prepares their parcel.")}</small>` : ""}</article>`;
        })
        .join("") ||
      `<p>${T("Aucune mission YAVIYA Courier pendant cette visite.", "No YAVIYA Courier assignment during this visit.")}</p>`
    }</div>`,
  );
  $("#role-description").textContent = T(
    "Identité, missions attribuées, récupération et livraison.",
    "Identity, assigned missions, collection and delivery.",
  );
  renderNoticeBadge();
}
const flowSetRole = setRole;
setRole = function (role, updateURL = true) {
  flowSetRole(role, updateURL);
  renderNoticeBadge();
};
document.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const p = b.dataset.edit
      ? products.find((p) => p.id === +b.dataset.edit)
      : null;
    if (
      activeRole === "seller" &&
      ((p && !ownedSellerIds().includes(p.seller)) ||
        (b.dataset.advance &&
          !sellerOrders(selectedSeller).some(
            (o) => o.id === b.dataset.advance,
          )))
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
      toast(
        T("Accès limité à vos boutiques.", "Access is limited to your shops."),
      );
      return;
    }
    if (b.dataset.courierOrder) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (activeRole !== "courier" || !courierCanWork()) return;
      const o = orders.find(
        (o) =>
          o.id === b.dataset.courierOrder && o.assignedCourier === "yaviya",
      );
      if (!o) return;
      const state = o.courierStatus || "assigned";
      if (
        state === "accepted" &&
        !Object.values(o.sellerSteps).every((n) => n >= 1)
      )
        return;
      o.courierStatus =
        state === "assigned"
          ? "accepted"
          : state === "accepted"
            ? "collected"
            : "delivered";
      if (o.courierStatus === "collected") {
        Object.keys(o.sellerSteps).forEach(
          (id) => (o.sellerSteps[id] = Math.max(2, o.sellerSteps[id])),
        );
        o.step = 2;
      }
      if (o.courierStatus === "delivered") {
        Object.keys(o.sellerSteps).forEach((id) => (o.sellerSteps[id] = 3));
        o.step = 3;
      }
      const message = T("Livraison : ", "Delivery: ") + o.courierStatus;
      o.events.push(message + " — " + new Date().toLocaleTimeString());
      notice(
        "buyer",
        T("Suivi de commande", "Order tracking"),
        o.id + " · " + message,
      );
      Object.keys(o.sellerSteps).forEach((id) =>
        notice(
          "seller",
          T("Suivi de livraison", "Delivery tracking"),
          o.id + " · " + message,
          +id,
        ),
      );
      showCourier();
    }
  },
  true,
);
// Capture order status changes from existing demo handlers without replacing their behavior.
let statusSnapshot = new Map();
function syncOrderNotices() {
  for (const o of orders) {
    const value = JSON.stringify([o.step, o.sellerSteps, o.buyerConfirmed]);
    if (statusSnapshot.has(o.id) && statusSnapshot.get(o.id) !== value) {
      notice(
        "buyer",
        T("Commande mise à jour", "Order updated"),
        o.id + " · " + stages[o.step],
      );
      if (o.assignedCourier)
        notice(
          "courier",
          T("Commande mise à jour", "Order updated"),
          o.id + " · " + stages[o.step],
          o.assignedCourier,
        );
      Object.keys(o.sellerSteps || {}).forEach((id) =>
        notice(
          "seller",
          T("Commande mise à jour", "Order updated"),
          o.id + " · " + stages[o.step],
          +id,
        ),
      );
    }
    statusSnapshot.set(o.id, value);
  }
}
setInterval(syncOrderNotices, 1000);
async function renderAdminVerification() {
  const panel = $('#role-content [data-dashboard-panel="sellers"]');
  if (!panel) return;
  panel.querySelector(".admin-verification")?.remove();
  panel.insertAdjacentHTML(
    "afterbegin",
    `<section class="admin-verification"><h2>${T("Dossiers vendeurs et livreurs", "Seller and courier verification")}</h2><div id="admin-review-list">${T("Chargement…", "Loading…")}</div></section>`,
  );
  const host = $("#admin-review-list");
  try {
    const requests = await verificationAPI("/reviews");
    if (!host.isConnected) return;
    host.innerHTML =
      requests
        .map(
          (r) =>
            `<article class="verification-request"><h3>${esc(r.name)}${r.publicId ? " · " + esc(r.publicId) : ""} · ${r.kind === "seller" ? T("Vendeur", "Seller") : T("Livreur", "Courier")}</h3><p>${esc(r.phone)} · ${r.userId.startsWith("cg:") ? "République du Congo" : "RDC"}</p>${r.kind === "courier" ? `<p>${T("Abonnement livreur : Standard · gratuit dans le MVP", "Courier plan: Standard · free during the MVP")}</p>` : ""}${r.kind === "seller" ? `<p>${esc(r.companyName)} · ${r.unregistered ? T("Petite entreprise non enregistrée · sans RCCM", "Unregistered small business · no RCCM") : "RCM/RCCM : " + esc(r.companyRcm)} · ${T("Forfait : ", "Plan: ")}${esc(r.sellerPlan)}</p>` : ""}<p>${esc(window.YAVIYA_MARKET_CONFIG.identityCountries.find((c) => c.code === r.issuingCountry)?.fr || "Pays à confirmer")} · ${T(...documentLabels[r.documentType])} · ${esc(r.status)}</p><a href="/api/verification/document?userId=${encodeURIComponent(r.userId)}&country=${window.YAVIYA_COUNTRY}" target="_blank" rel="noopener">${T("Consulter la pièce privée", "View private document")}</a>${r.status === "pending" ? `<form class="review-form" data-review-user="${esc(r.userId)}"><label><input name="identityChecked" type="checkbox">${T("J’ai contrôlé l’identité et la pièce.", "I have checked the identity and document.")}</label>${r.kind === "seller" ? `<label><input name="companyChecked" type="checkbox">${r.unregistered ? T("J’ai contrôlé l’activité déclarée de la petite entreprise non enregistrée.", "I have checked the declared unregistered small business activity.") : T("J’ai contrôlé le numéro RCM/RCCM et l’entreprise.", "I have checked the RCM/RCCM number and company.")}</label>` : ""}<label>${T("Commentaire / motif du refus", "Comment / rejection reason")}<textarea name="note" maxlength="500"></textarea></label><button class="primary" name="decision" value="approve">${T("Valider manuellement", "Approve manually")}</button><button class="add" name="decision" value="reject">${T("Refuser", "Reject")}</button><p class="review-error" role="alert"></p></form>` : `<p>${esc(r.note)}</p>`}</article>`,
        )
        .join("") ||
      `<p>${T("Aucun dossier soumis.", "No verification requests submitted.")}</p>`;
    host.querySelectorAll(".review-form").forEach(
      (form) =>
        (form.onsubmit = async (e) => {
          e.preventDefault();
          try {
            await verificationAPI("/reviews", {
              userId: form.dataset.reviewUser,
              decision: e.submitter?.value || "approve",
              identityChecked: form.elements.identityChecked.checked,
              companyChecked: form.elements.companyChecked?.checked || false,
              note: form.elements.note.value,
            });
            await refreshVerification();
            notice(
              "admin",
              T("Dossier traité", "Verification reviewed"),
              T("Décision enregistrée.", "Decision saved."),
            );
            renderAdminVerification();
          } catch (err) {
            form.querySelector(".review-error").textContent = err.message;
          }
        }),
    );
  } catch (err) {
    if (host.isConnected) host.textContent = err.message;
  }
}
const flowsAdmin = showAdmin;
showAdmin = function () {
  flowsAdmin();
  renderAdminVerification();
};
// Search icon order: photo first, general search last.
const textSearch = $("#search .text-search-submit"),
  photoSearch = $("#photo-search-button");
if (textSearch && photoSearch) {
  textSearch.before(photoSearch);
  textSearch.setAttribute("aria-label", T("Rechercher", "Search"));
}
setInterval(() => {
  if (customerProfile && verificationState.check?.status === "pending")
    refreshVerification();
}, 20000);
verificationAPI("/bootstrap", {})
  .catch(() => {})
  .finally(refreshVerification);
if (activeRole === "seller") showSeller();
if (activeRole === "courier") showCourier();
if (activeRole === "admin") showAdmin();
