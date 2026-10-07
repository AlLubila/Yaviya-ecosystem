function showBuyerRegistration() {
  window.YAVIYA_BUYER_REGISTRATION = true;
  try {
    showRegister();
  } finally {
    window.YAVIYA_BUYER_REGISTRATION = false;
  }
}
// Keep one live form so going back never discards entered details or attachments.
const stagedRegister = showRegister;
showRegister = function () {
  stagedRegister();
  const form = $("#register-form");
  if (!form) return;
  if (window.YAVIYA_BUYER_REGISTRATION) {
    for (const radio of form.querySelectorAll("[name=accountType]")) {
      radio.checked = radio.value === "buyer";
      radio.disabled = radio.value !== "buyer";
    }
    form
      .querySelector("[name=accountType][value=buyer]")
      .dispatchEvent(new Event("change"));
  }
  const originalSubmit = form.onsubmit,
    submit = form.querySelector("button.primary"),
    error = $("#registration-error"),
    identity = $("#identity-fields"),
    company = $("#company-fields"),
    consent = form.elements.privacyConsent.closest("label"),
    planSelect = form.elements.sellerPlan;
  const planLabel = planSelect.closest("label"),
    planNote = planLabel.nextElementSibling,
    planDetails = form.querySelector(".onboarding-benefits");
  const account = document.createElement("section"),
    business = document.createElement("section"),
    verification = document.createElement("section"),
    subscription = document.createElement("section");
  for (const [section, id] of [
    [account, "account"],
    [business, "business"],
    [verification, "verification"],
    [subscription, "subscription"],
  ]) {
    section.className = "registration-step";
    section.dataset.registrationStep = id;
  }
  company.remove();
  identity.remove();
  consent.remove();
  planLabel.remove();
  planNote?.remove();
  planDetails?.remove();
  submit.remove();
  error.remove();
  const nodes = [...form.childNodes];
  nodes.forEach((n) => account.append(n));
  business.append(company);
  verification.append(identity, consent);
  subscription.append(planLabel);
  if (planNote) subscription.append(planNote);
  if (planDetails) subscription.append(planDetails);
  const courierSubscription = document.createElement("div");
  courierSubscription.className = "courier-subscription";
  courierSubscription.innerHTML = `<label>${T("Abonnement livreur *", "Courier plan *")}<select name="courierPlan" required><option value="standard">${T("Standard · 0 FC / mois pendant le MVP", "Standard · FC 0 / month during the MVP")}</option></select></label><p>${T("Accès aux missions, au suivi, aux évaluations et à la discussion avec YAVIYA après validation de votre identité.", "Access to assignments, tracking, ratings and YAVIYA conversations after identity approval.")}</p><p class="demo-note">${T("Formule gratuite de démonstration. Aucun prélèvement. Les conditions commerciales seront confirmées avant lancement.", "Free demo plan. No charge. Commercial terms will be confirmed before launch.")}</p>`;
  subscription.append(courierSubscription);
  const benefits = document.createElement("section");
  benefits.className = "registration-step";
  benefits.dataset.registrationStep = "benefits";
  benefits.innerHTML = `<h3>${T("Vos avantages et votre rémunération", "Benefits and earnings")}</h3><ul><li>${T("Choisissez vos disponibilités et acceptez les missions proposées.", "Choose your availability and accept offered assignments.")}</li><li>${T("Consultez le montant de chaque mission avant de l’accepter.", "See the earnings for each assignment before accepting.")}</li><li>${T("Suivez vos frais, votre bénéfice net et vos règlements par livraison.", "Track expenses, net earnings and settlements for every delivery.")}</li><li>${T("Discutez avec les participants de la commande et avec YAVIYA.", "Talk to order participants and YAVIYA.")}</li><li>${T("Recevez les évaluations des clients sur votre propre compte livreur.", "Receive customer ratings on your own courier account.")}</li></ul><p>${T("Barème pilote : 100 % des frais de livraison sont affectés au livreur ; vos frais de mission réduisent le bénéfice net. Ces conditions restent à confirmer avant l’activité commerciale.", "Pilot terms: 100% of delivery fees are allocated to the courier; assignment expenses reduce net earnings. These terms must be confirmed before commercial activity.")}</p><label class="privacy-consent"><input name="courierBenefitsAccepted" type="checkbox" required><span>${T("J’ai lu les modalités du pilote et du règlement par livraison.", "I have read the pilot terms and per-delivery settlement conditions.")}</span></label>`;
  courierSubscription.insertAdjacentHTML(
    "beforeend",
    `<h3>${T("Recevoir mes règlements", "Receive settlements")}</h3><label>${T("Mode de règlement préféré", "Preferred settlement method")}<select name="courierPayoutMethod"><option value="mobile_money">Mobile Money</option><option value="bank">${T("Virement bancaire", "Bank transfer")}</option><option value="cash">${T("Espèces", "Cash")}</option></select></label><label>${T("Numéro Mobile Money ou référence de compte", "Mobile Money number or account reference")}<input name="courierPayoutAccount" maxlength="150" value="${esc(customerProfile?.phone || "")}"></label><p>${T("Le montant et le statut sont visibles pour chaque livraison. Un règlement manuel doit comporter une référence ; les transferts automatiques ne sont pas activés. Ne saisissez pas de PIN ou de mot de passe.", "Each delivery shows its amount and settlement status. A manual settlement requires a reference; automatic transfers are not enabled. Do not enter a PIN or password.")}</p>`,
  );
  form.append(account, business, verification, benefits, subscription);
  form.noValidate = true;
  const progress = document.createElement("div");
  progress.className = "registration-progress";
  progress.setAttribute("aria-live", "polite");
  form.before(progress);
  const navigation = document.createElement("div");
  navigation.className = "registration-navigation";
  navigation.innerHTML = `<button type="button" class="add" id="registration-back">${T("Retour", "Back")}</button><button type="button" class="primary" id="registration-continue">${T("Continuer", "Continue")}</button>`;
  navigation.append(submit);
  form.append(error, navigation);
  const back = $("#registration-back"),
    next = $("#registration-continue");
  let index = 0,
    busy = false;
  function type() {
    return form.querySelector("[name=accountType]:checked")?.value || "buyer";
  }
  function pages() {
    return type() === "seller"
      ? [account, business, verification, subscription]
      : type() === "courier"
        ? [account, verification, benefits, subscription]
        : [account];
  }
  function label(page) {
    return page === account
      ? T("Compte et coordonnées", "Account and contact details")
      : page === business
        ? T("Votre activité", "Your business")
        : page === verification
          ? T("Identité et confidentialité", "Identity and privacy")
          : page === benefits
            ? T("Avantages et rémunération", "Benefits and earnings")
            : type() === "courier"
              ? T("Abonnement et règlements", "Plan and settlements")
              : T("Choisir mon abonnement", "Choose my plan");
  }
  function display() {
    const seller = type() === "seller",
      courier = type() === "courier";
    planLabel.hidden = !seller;
    if (planNote) planNote.hidden = !seller;
    if (planDetails) planDetails.hidden = !seller;
    courierSubscription.hidden = !courier;
    form.elements.courierPlan.disabled = !courier;
    form.elements.courierPlan.required = courier;
    form.elements.courierBenefitsAccepted.disabled = !courier;
    form.elements.courierPayoutMethod.disabled = !courier;
    form.elements.courierPayoutAccount.disabled = !courier;
    form.elements.courierPayoutAccount.required =
      courier && form.elements.courierPayoutMethod.value !== "cash";
    const selected = pages();
    index = Math.min(index, selected.length - 1);
    [account, business, verification, benefits, subscription].forEach(
      (s) => (s.hidden = s !== selected[index]),
    );
    if (type() === "buyer") account.append(consent);
    else verification.append(consent);
    progress.innerHTML = `<p>${T("Étape", "Step")} ${index + 1} / ${selected.length}</p><h3 tabindex="-1">${label(selected[index])}</h3><ol>${selected.map((s, i) => `<li ${i === index ? 'aria-current="step"' : ""} class="${i < index ? "complete" : ""}">${label(s)}</li>`).join("")}</ol>`;
    back.hidden = index === 0;
    next.hidden = index === selected.length - 1;
    submit.hidden = index !== selected.length - 1;
    submit.textContent = T(
      type() === "buyer" ? "Enregistrer mon compte" : "Soumettre mon dossier",
      type() === "buyer" ? "Save my account" : "Submit my request",
    );
    form.dataset.registrationIndex = index;
    form.dataset.registrationCount = selected.length;
  }
  function validField(field) {
    return (
      field.disabled ||
      (field.type === "file" && field.files?.length > 0) ||
      field.checkValidity()
    );
  }
  function invalid(page) {
    return [...page.querySelectorAll("input,select,textarea")].find(
      (field) => !validField(field),
    );
  }
  function focusInvalid(field, page) {
    const selected = pages();
    index = selected.indexOf(page);
    display();
    field.reportValidity();
    field.focus();
  }
  function advance() {
    if (busy) return;
    const current = pages()[index],
      field = invalid(current);
    if (field) {
      focusInvalid(field, current);
      return;
    }
    index++;
    display();
    progress.scrollIntoView({ block: "start", behavior: "smooth" });
    progress.querySelector("h3").focus();
  }
  form.elements.courierPayoutMethod.onchange = () => {
    form.elements.courierPayoutAccount.required =
      type() === "courier" &&
      form.elements.courierPayoutMethod.value !== "cash";
  };
  next.onclick = advance;
  back.onclick = () => {
    if (busy) return;
    index = Math.max(0, index - 1);
    display();
    progress.scrollIntoView({ block: "start", behavior: "smooth" });
    progress.querySelector("h3").focus();
  };
  form.querySelectorAll("[name=accountType]").forEach((r) =>
    r.addEventListener("change", () => {
      index = 0;
      display();
    }),
  );
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (index < pages().length - 1) {
      advance();
      return;
    }
    for (const page of pages()) {
      const field = invalid(page);
      if (field) {
        focusInvalid(field, page);
        return;
      }
    }
    busy = true;
    submit.disabled = next.disabled = back.disabled = true;
    submit.textContent = T("Enregistrement…", "Saving…");
    try {
      await originalSubmit(e);
    } finally {
      busy = false;
      if (form.isConnected) {
        submit.disabled = next.disabled = back.disabled = false;
        display();
      }
    }
  };
  display();
};
const categorySections = window.YAVIYA_MARKET_CONFIG.categorySections;
showCategories = function () {
  openCustomerPage(() =>
    open(
      `<span class="eyebrow">${T("EXPLORER", "EXPLORE")}</span><h2>${T("Catégories de produits", "Product categories")}</h2><button class="add" data-category-root="Tout">${T("Tout le catalogue", "Entire catalogue")}</button><div class="category-tree">${categorySections.map(([cat, fr, en, children], sectionIndex) => `<section><h3><button data-category-root="${esc(cat)}" data-category-section="${sectionIndex}">${T(fr, en)}</button></h3><ul>${children.map(([childFR, childEN, term]) => `<li><button data-subcategory="${esc(cat)}" data-category-term="${esc(term)}" data-category-section="${sectionIndex}" data-category-item="${children.findIndex((c) => c[0] === childFR)}">${T(childFR, childEN)}</button></li>`).join("")}</ul></section>`).join("")}</div>`,
    ),
  );
};
function categoryProducts(section, item) {
  const [cat, , , children] = categorySections[section],
    term = children[item][2];
  const normalize = (s) =>
    String(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  const terms = {
    câble: ["cable", "chargeur", "accessoire"],
    veste: ["veste", "complet", "costume"],
    baskets: ["baskets", "chaussure"],
    assiettes: [
      "assiette",
      "service de table",
      "fourchette",
      "cuillere",
      "vaisselle",
    ],
    rallonge: ["rallonge", "cable electrique"],
    cosmétique: ["cosmetique", "maquillage"],
    habit: ["habit", "vetement", "chemise", "robe"],
    riz: ["riz", "cereale"],
    café: ["cafe", "boisson"],
    "ring light": ["ring light", "eclairage"],
  }[term] || [normalize(term)];
  return products.filter((p) => {
    if (
      p.category !== cat ||
      !p.visible ||
      !p.approved ||
      !sellerInCurrentMarket(shopOf(p))
    )
      return false;
    const title = normalize(p.title);
    if (p.subcategory) return p.subcategory === children[item][0];
    if (!term) return false;
    return terms.some((t) => title.includes(t));
  });
}
let categoryPageSelection = null,
  categoryPageSort = "default";
function showCategoryProducts(section, item) {
  const group = categorySections[section];
  if (!group) return;
  const child = Number.isInteger(item) ? group[3][item] : null;
  if (Number.isInteger(item) && !child) return;
  categoryPageSelection = { section, item };
  const heading = child ? T(child[0], child[1]) : T(group[1], group[2]);
  let list = child
    ? categoryProducts(section, item)
    : products.filter(
        (p) =>
          p.category === group[0] &&
          p.visible &&
          p.approved &&
          sellerInCurrentMarket(shopOf(p)),
      );

  if (categoryPageSort === "rating")
    list.sort((a, b) => reviewStats(b).rating - reviewStats(a).rating);
  else if (categoryPageSort !== "default")
    list.sort((a, b) =>
      categoryPageSort === "asc" ? a.price - b.price : b.price - a.price,
    );
  openCustomerPage(() =>
    open(
      `<section class="subcategory-page"><button class="add" data-back-categories>${T("Toutes les catégories", "All categories")}</button><p class="eyebrow">${T(group[1], group[2])}</p><h2>${esc(heading)}</h2><label class="subcategory-sort">${T("Trier par", "Sort by")}<select id="subcategory-sort"><option value="default">${T("Sélection", "Featured")}</option><option value="asc">${T("Prix croissant", "Price: low to high")}</option><option value="desc">${T("Prix décroissant", "Price: high to low")}</option><option value="rating">${T("Note des clients", "Customer rating")}</option></select></label><div class="subcategory-products related-grid">${list.map((p) => card(p).replace(/<small>Stock : \d+<\/small>/g, "")).join("")}</div>${list.length ? "" : `<p class="subcategory-empty" role="status">${T("Aucun article dans cette sous-catégorie pour le moment.", "No items in this subcategory yet.")}</p>`}</section>`,
    ),
  );
  $("#subcategory-sort").value = categoryPageSort;
  $("#subcategory-sort").onchange = (e) => {
    categoryPageSort = e.target.value;
    showCategoryProducts(section, item);
  };
}
window.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest(
      "[data-category-root],[data-subcategory],[data-back-categories]",
    );
    if (!b) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (b.hasAttribute("data-back-categories")) {
      categoryPageSelection = null;
      showCategories();
      return;
    }
    if (b.dataset.subcategory) {
      categoryPageSort = "default";
      showCategoryProducts(+b.dataset.categorySection, +b.dataset.categoryItem);
      return;
    }
    const section =
      b.dataset.categorySection !== undefined
        ? +b.dataset.categorySection
        : categorySections.findIndex((s) => s[0] === b.dataset.categoryRoot);
    if (section >= 0) {
      categoryPageSort = "default";
      showCategoryProducts(section);
      return;
    }
    query = "";
    $("#query").value = "";
    if (modal.open) modal.close();
    setCategory("Tout");
  },
  true,
);
const categoryLanguage = applyLanguage;
applyLanguage = function () {
  categoryLanguage();
  if (categoryPageSelection && $("#modal .subcategory-page"))
    showCategoryProducts(
      categoryPageSelection.section,
      categoryPageSelection.item,
    );
};
if (
  new URLSearchParams(location.search).get("mobileTab") === "profile" &&
  $("#register-form")
)
  showRegister();
if (new URLSearchParams(location.search).get("mobileTab") === "categories")
  showCategories();
