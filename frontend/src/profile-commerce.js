// Navigation and seller onboarding for the two YAVIYA markets.
const commerceOpen = open;
open = function (html) {
  if (document.body.classList.contains("chat-open")) setChat(false);
  modal.classList.add("full-page");
  commerceOpen(html);
  document.body.classList.toggle("window-open", modal.open);
};
function syncFullWindow() {
  document.body.classList.toggle("window-open", modal.open);
}
modal.addEventListener("close", syncFullWindow);
modal.addEventListener("cancel", () => queueMicrotask(syncFullWindow));
function openCustomerPage(fn) {
  if (activeRole !== "buyer") setRole("buyer");
  if (drawer.open) drawer.close();
  fn();
}
function showCategories() {
  openCustomerPage(() =>
    open(
      `<span class="eyebrow">${T("EXPLORER", "EXPLORE")}</span><h2>${T("Catégories de produits", "Product categories")}</h2><div class="menu-links category-directory">${Object.entries(
        categoryNames,
      )
        .map(
          ([c, en]) =>
            `<button data-cat="${esc(c)}"><span>${T(c === "Mode" ? "Habits & accessoires" : c === "Maison" ? "Maison & quotidien" : c, en)}</span><small>${products.filter((p) => p.visible && p.approved && (c === "Tout" || p.category === c)).length} ${T("produits", "products")}</small></button>`,
        )
        .join("")}</div>`,
    ),
  );
}
$("#all").setAttribute("aria-controls", "modal");
$("#all").onclick = () => {
  showCategories();
  $("#all").setAttribute("aria-expanded", "true");
};
modal.addEventListener("close", () =>
  $("#all").setAttribute("aria-expanded", "false"),
);
function profileLink(action, fr, en, detail = "") {
  return `<button type="button" class="profile-link" data-profile="${action}"><b>${T(fr, en)}</b>${detail ? `<small>${detail}</small>` : ""}</button>`;
}
function showMyYaviya() {
  const p = customerProfile,
    has = p?.name,
    first = p?.firstName || p?.name?.split(" ")[0] || "",
    last = p?.lastName || p?.name?.split(" ").slice(1).join(" ") || "",
    pending = orders.filter((o) => !o.cancelled && !o.buyerConfirmed).length;
  openCustomerPage(() =>
    open(
      `<section class="profile-hub"><span class="eyebrow">${T("MON ESPACE", "MY ACCOUNT")}</span><h2>${T("Mon Yaviya", "My Yaviya")}</h2><div class="profile-summary"><span class="profile-avatar" aria-hidden="true">${esc((first[0] || "Y") + (last[0] || ""))}</span><div><h3>${has ? esc(p.name) : T("Bienvenue sur YAVIYA", "Welcome to YAVIYA")}</h3>${has ? `<p>${T("Prénom : ", "First name: ")}<b>${esc(first)}</b> · ${T("Nom : ", "Last name: ")}<b>${esc(last)}</b></p>${accountIdentifiersMarkup(p)}<p>${T("Téléphone : ", "Phone: ")}<b>${esc(p.phone)}</b></p><p>${esc(p.address)}</p>${p.email ? `<p>${esc(p.email)}</p>` : ""}` : `<p>${T("Créez votre compte pour retrouver vos coordonnées, vos favoris et votre numéro client.", "Create your account to access your details, favourites and customer number.")}</p>`}<button class="add" data-profile="edit">${T(has ? "Modifier mes informations" : "Créer un compte", has ? "Edit my details" : "Create an account")}</button></div></div><h3>${T("Mes achats et mes services", "My purchases and services")}</h3><div class="profile-grid">${profileLink("orders", "Historique des commandes", "Order history", pending + " " + T("commande(s) en cours", "order(s) in progress"))}${profileLink("edit", "Adresse et coordonnées", "Address and contact details")}${profileLink("settings", "Paramètres", "Settings")}${profileLink("wishlist", "Mes favoris", "My favourites", wishes.size + " " + T("produit(s)", "product(s)"))}${profileLink("coins", "Mes coupons", "My coupons", T("1 coupon par 2 000 FC d’achats éligibles", "1 coupon per FC 2,000 in eligible purchases"))}${profileLink("subscriptions", "Abonnement de livraison", "Delivery subscription", T("Mensuel et annuel · tarifs provisoires", "Monthly and annual · provisional rates"))}${profileLink("premium", "Service Premium", "Premium service", T("Avantages et conditions à découvrir", "Explore benefits and conditions"))}${profileLink("support", "Service client", "Customer service")}${profileLink("notices", "Mes notifications", "My notifications")}</div><h3>${T("Découvrir YAVIYA", "Explore YAVIYA")}</h3><div class="profile-grid">${profileLink("seller", "Devenir vendeur / changer de statut", "Become a seller / change account type")}${profileLink("sellerArea", "Mon espace vendeur", "My seller area")}${profileLink("courierArea", "Mon espace livreur", "My courier area")}${profileLink("delivery", "Modes de livraison", "Delivery options")}${profileLink("faq", "Questions fréquentes", "Frequently asked questions")}${profileLink("ads", "Publicités & partenaires", "Advertisements & partners")}${profileLink("daily", "Promo du jour", "Today’s promotions")}${profileLink("about", "À propos de YAVIYA", "About YAVIYA")}${profileLink("privacy", "Politique de confidentialité", "Privacy policy")}</div></section>`,
    ),
  );
}
function showPremium() {
  open(
    `<h2>${T("Service Premium YAVIYA", "YAVIYA Premium service")}</h2><p>${T("Un service destiné aux clients qui souhaitent acheter régulièrement et être accompagnés dans leur parcours.", "A service for customers who shop regularly and want support throughout their shopping journey.")}</p><div class="info-grid"><article><h3>${T("Livraison", "Delivery")}</h3><p>${T("Comparez les formules mensuelle et annuelle. Les livraisons express ont un coût plus élevé et ne sont pas automatiquement incluses.", "Compare monthly and annual plans. Express delivery costs more and is not automatically included.")}</p></article><article><h3>${T("Accompagnement prévu", "Planned assistance")}</h3><p>${T("Assistance prioritaire et offres réservées envisagées au lancement. Les avantages, plafonds et zones seront précisés avant toute souscription.", "Priority assistance and exclusive offers are planned at launch. Benefits, limits and coverage will be specified before subscription.")}</p></article></div><p class="demo-note">${T("Service en préparation, sans activation ni facturation dans la démo.", "Service in preparation, with no activation or billing in the demo.")}</p><button class="primary" data-profile="subscriptions">${T("Voir les abonnements de livraison", "View delivery subscriptions")}</button>`,
  );
}
showAbout = function () {
  openCustomerPage(() =>
    open(
      `<span class="eyebrow">YAVIYA</span><h2>${T("À propos de YAVIYA", "About YAVIYA")}</h2><p class="about-intro">${T("YAVIYA réunit les achats du quotidien, les commerces et les services de livraison dans un même marché en ligne. Vous pouvez découvrir des produits, comparer plusieurs vendeurs et suivre votre commande depuis votre compte.", "YAVIYA brings everyday shopping, shops and delivery services together in one online marketplace. Discover products, compare sellers and track orders from your account.")}</p><div class="info-grid"><article><h3>${T("Pour les acheteurs", "For buyers")}</h3><p>${T("Explorez les catégories high-tech, mode, maison, beauté, enfants et épicerie. Recherchez par nom ou photo, filtrez par boutique et localité, triez par prix ou note et retrouvez vos favoris. Une fiche produit présente des articles similaires chez d’autres vendeurs et le catalogue de la même boutique.", "Explore electronics, fashion, home, beauty, kids and grocery categories. Search by name or photo, filter by shop and location, sort by price or rating and save favourites. Product pages include similar items from other sellers and the same shop’s catalogue.")}</p></article><article><h3>${T("Pour les vendeurs", "For sellers")}</h3><p>${T("Les commerçants, artisans, petites entreprises non enregistrées et grandes entreprises peuvent préparer leur présence sur YAVIYA. L’inscription demande des informations de boutique, un choix d’abonnement et une pièce d’identité. Un administrateur examine manuellement chaque dossier. Le vendeur gère uniquement sa boutique ou ses boutiques.", "Merchants, artisans, unregistered small businesses and large companies can prepare their presence on YAVIYA. Registration collects shop details, a plan choice and an identity document. An administrator manually reviews each request. Sellers manage only their own shop or shops.")}</p></article><article><h3>${T("Commande et livraison", "Orders and delivery")}</h3><p>${T("Le vendeur accepte manuellement la commande avant préparation. Choisissez la remise en main propre, le domicile par coursier, un point de relais ou l’express. Le livreur indique sa disponibilité et joint une photo lors de la livraison. Le suivi reste visible dans les quatre espaces. La livraison standard est estimée à 1–3 jours après validation ; l’express dépend de la zone et de la disponibilité.", "The seller manually accepts each order before preparation. Choose in-person handover, home courier delivery, a collection point or express delivery. Couriers indicate availability and upload a delivery photo. Tracking is visible in all four views. Standard delivery is estimated at 1–3 days after confirmation; express depends on coverage and availability.")}</p></article><article><h3>${T("Paiement et Coupons", "Payments and Coupons")}</h3><p>${T("Le parcours présente le Mobile Money, la carte bancaire et le paiement à la livraison. Pour un paiement anticipé, l’escrow conserve le montant jusqu’à la confirmation de réception du client. Les achats éligibles rapportent 1 coupon par 2 000 FC ; les points peuvent être échangés contre les produits proposés dans l’espace Coupons.", "The journey includes Mobile Money, bank cards and cash on delivery. For prepaid orders, escrow holds the amount until the customer confirms receipt. Eligible purchases earn 1 coupon per FC 2,000; points can be exchanged for items offered in the Coupons area.")}</p></article><article><h3>${T("Nos marchés", "Our markets")}</h3><p>${T("Le marché RDC dessert Kinshasa, Lubumbashi, Kolwezi, Matadi et Boma. YAVIYA République du Congo dispose de son propre catalogue de vendeurs, à Brazzaville et Pointe-Noire. Un vendeur peut préparer une offre dans les deux pays avec des prix définis dans chaque monnaie. Les conditions opérationnelles seront confirmées avant lancement.", "The DRC market serves Kinshasa, Lubumbashi, Kolwezi, Matadi and Boma. YAVIYA Republic of Congo has its own seller catalogue in Brazzaville and Pointe-Noire. Sellers may prepare an offer in both countries with prices set in each currency. Operational terms will be confirmed before launch.")}</p></article><article><h3>${T("Une démonstration à explorer", "Explore the demonstration")}</h3><p>${T("Les produits, prix, notes et campagnes sont illustratifs. Les quatre vues permettent de tester les parcours. Aucun paiement, transport ni transfert réel n’est exécuté. Les commandes sont partagées entre les vues du même compte et séparées par pays.", "Products, prices, ratings and campaigns are illustrative. The four views let you test the journeys. No real payment, transport or transfer is performed. Orders are shared across the same account’s views and separated by country.")}</p></article></div><div class="profile-grid">${profileLink("seller", "Devenir vendeur", "Become a seller")}${profileLink("support", "Contacter le service client", "Contact customer service")}${profileLink("privacy", "Politique de confidentialité", "Privacy policy")}</div>`,
    ),
  );
};
async function showPrivacyWindow() {
  openCustomerPage(() =>
    open(
      `<h2>${T("Politique de confidentialité", "Privacy policy")}</h2><p id="privacy-window-content">${T("Chargement…", "Loading…")}</p>`,
    ),
  );
  const host = $("#privacy-window-content");
  try {
    const response = await fetch("confidentialite.html");
    if (!response.ok) throw Error();
    const doc = new DOMParser().parseFromString(
      await response.text(),
      "text/html",
    );
    if (host.isConnected) {
      const article = doc.querySelector(
        language === "en" ? "#policy-en" : "#policy-fr",
      );
      host.outerHTML = `<article class="privacy-window">${article.innerHTML}</article>`;
    }
  } catch {
    if (host.isConnected)
      host.innerHTML = `${T("La politique ne peut pas être chargée.", "The policy could not be loaded.")} <a href="confidentialite.html?country=${window.YAVIYA_COUNTRY}&lang=${language}">${T("Ouvrir la page", "Open the page")}</a>`;
  }
}
const commerceRegister = showRegister;
showRegister = function () {
  commerceRegister();
  const form = $("#register-form");
  if (!form) return;
  const name = form.elements.name,
    legacy = (customerProfile?.name || "").split(" ");
  const first = customerProfile?.firstName || legacy[0] || "",
    last = customerProfile?.lastName || legacy.slice(1).join(" ");
  name.closest("label").outerHTML =
    `<div class="name-fields"><label>${T("Prénom *", "First name *")}<input name="firstName" autocomplete="given-name" maxlength="100" required value="${esc(first)}"></label><label>${T("Nom *", "Last name *")}<input name="lastName" autocomplete="family-name" maxlength="100" required value="${esc(last)}"></label><input type="hidden" name="name" value="${esc(customerProfile?.name || "")}"></div>`;
  form.querySelector(".demo-note").textContent = T(
    "Vendeur ou livreur : identité à vérifier manuellement par l’admin. Une petite entreprise non enregistrée peut déclarer qu’elle n’a pas de numéro RCCM.",
    "Seller or courier: identity is manually checked by the administrator. An unregistered small business may declare it has no RCCM number.",
  );
  const addressLabel = form.elements.address.closest("label");
  addressLabel.insertAdjacentHTML("afterend", `<label class="privacy-consent professional-address-confirmation" hidden><input type="checkbox" name="professionalAddressConfirmed"><span></span></label>`);
  const addressConfirmation = form.elements.professionalAddressConfirmed;
  const company = $("#company-fields");
  company.insertAdjacentHTML(
    "beforeend",
    `<label>${T("Abonnement vendeur *", "Seller plan *")}<select name="sellerPlan" required>${sellerPlans.map((p) => `<option value="${p.id}" ${verificationState.check?.sellerPlan === p.id ? "selected" : ""}>${T(p.name, p.en)} · ${p.monthly === null ? T("sur mesure", "custom") : money(p.monthly) + " / " + T("mois", "month")}</option>`).join("")}</select></label><p class="demo-note">${T("Choix enregistré dans le dossier. Tarifs provisoires, aucun abonnement facturé.", "Selection saved with your request. Provisional prices, no subscription billed.")}</p><details class="onboarding-benefits"><summary>${T("Comparer les avantages des abonnements", "Compare plan benefits")}</summary>${sellerPlansTable()}<div class="info-grid">${sellerPlans.map((p) => `<article><h3>${T(p.name, p.en)}</h3><p>${T(...p.target)}</p><p>${T("Commission : ", "Commission: ")}${sellerPlanCommission(p)}</p><p>${p.monthly === null ? T("Sur mesure · commission négociée", "Custom · negotiated commission") : money(p.monthly) + " / " + T("mois", "month") + " · " + money(p.annual) + " / " + T("an", "year")}</p><ul>${p.features.map((f) => `<li>${T(...f)}</li>`).join("")}</ul></article>`).join("")}</div></details>`,
  );
  function sync() {
    const type = form.querySelector("[name=accountType]:checked")?.value || "buyer";
    const seller = type === "seller";
    const professional = type !== "buyer";
    addressLabel.firstChild.textContent = seller
      ? T("Adresse complète de la boutique / point de retrait *", "Full shop / pickup address *")
      : type === "courier"
        ? T("Adresse de départ / base opérationnelle *", "Starting address / operational base *")
        : T("Adresse *", "Address *");
    form.elements.address.placeholder = T("Ville, commune, quartier, avenue, numéro et repère", "City, municipality, district, street, number and landmark");
    addressConfirmation.closest("label").hidden = !professional;
    addressConfirmation.disabled = !professional;
    addressConfirmation.required = professional;
    addressConfirmation.nextElementSibling.textContent = seller
      ? T("Je confirme que cette adresse est le lieu exact de retrait des colis. *", "I confirm this is the exact parcel pickup location. *")
      : T("Je confirme mon adresse opérationnelle et vérifierai le retrait, le destinataire et la remise pour chaque mission. *", "I confirm my operational address and will verify pickup, recipient and handover for each assignment. *");
    form.elements.sellerPlan.disabled = !seller;
    form.elements.sellerPlan.required = seller;
  }
  form
    .querySelectorAll("[name=accountType]")
    .forEach((x) => x.addEventListener("change", sync));
  sync();
  const previous = form.onsubmit;
  form.onsubmit = (e) => {
    form.elements.name.value = (
      form.elements.firstName.value.trim() +
      " " +
      form.elements.lastName.value.trim()
    ).trim();
    return previous(e);
  };
  form.insertAdjacentHTML(
    "beforebegin",
    `<button class="add" data-profile="home">${T("Retour à Mon Yaviya", "Back to My Yaviya")}</button>`,
  );
};
function showSellerOnboarding() {
  openCustomerPage(() => {
    showRegister();
    const form = $("#register-form");
    form.querySelector("[name=accountType][value=seller]").checked = true;
    form
      .querySelector("[name=accountType][value=seller]")
      .dispatchEvent(new Event("change"));
    $("#modal-content h2").textContent = T(
      "Devenir vendeur · changer de statut",
      "Become a seller · change account type",
    );
    form.insertAdjacentHTML(
      "beforebegin",
      `<p class="onboarding-intro">${T("Renseignez votre profil, choisissez votre abonnement et soumettez les informations de votre activité. La confidentialité et la vérification manuelle s’appliquent aussi aux petites entreprises sans RCCM. Votre boutique devient accessible après validation.", "Complete your profile, choose a plan and submit your business details. Privacy and manual verification also apply to small businesses without RCCM. Your shop becomes accessible after approval.")}</p>`,
    );
  });
}
function profileAction(action) {
  const pages = {
    home: showMyYaviya,
    settings: showAccountSettings,
    security: () => window.showYaviyaSecurity?.(),
    edit: showRegister,
    orders: showTracking,
    cart: showCart,
    wishlist: showWishlist,
    coins: () => showCoins(),
    subscriptions: showSubscriptions,
    premium: showPremium,
    support: showSupport,
    notices: showNotifications,
    seller: showSellerOnboarding,
    sellerArea: () => setRole("seller"),
    courierArea: () => setRole("courier"),
    delivery: () => open(content.delivery),
    faq: () =>
      open(
        `<h2>${T("Questions fréquentes", "Frequently asked questions")}</h2><div class="customer-faq">${faqMarkup()}</div>`,
      ),
    about: showAbout,
    privacy: showPrivacyWindow,
    ads: () =>
      (location.href = "publicite.html?country=" + window.YAVIYA_COUNTRY),
    daily: () => {
      modal.close();
      $("#daily-promos").scrollIntoView({ behavior: "smooth" });
    },
  };
  pages[action]?.();
}
window.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest("button,a");
    if (!b) return;
    let action = b.dataset.profile;
    if (b.dataset.mobileTab === "profile") action = "home";
    if (b.dataset.mobileTab === "categories") action = "categories";
    if (b.dataset.action === "about") action = "about";
    if (
      b.dataset.action === "privacy" ||
      b.matches('a[href^="confidentialite.html"]')
    )
      action = "privacy";
    if (b.dataset.action === "seller" && activeRole === "buyer")
      action = "seller";
    if (!action) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (action === "categories") showCategories();
    else profileAction(action);
  },
  true,
);
showShop = function (id) {
  const s = shops.find((s) => s.id === id);
  if (!s) return;
  open(
    `<span class="eyebrow">${T("BOUTIQUE", "SHOP")}</span><h2 class="shop-name">${esc(s.name)} ${sellerVerificationBadge(s)}</h2><p>${esc(s.domain)}</p><p>${esc(s.city)} · ${esc(s.commune)}</p><p class="demo-note">${s.id >= 10000 ? T("Boutique associée à un vendeur validé manuellement.", "Shop associated with a manually approved seller.") : T("Boutique et catalogue illustratifs. Les badges de démonstration ne représentent pas une vérification commerciale réelle.", "Illustrative shop and catalogue. Demo badges do not represent real commercial verification.")}</p><div class="related-grid">${products
      .filter((p) => p.seller === id && p.visible && p.approved)
      .map(card)
      .join("")}</div>`,
  );
};
// Reserved administration spaces and authenticated seller conversations.
dashboardTabs.admin.push(
  ["orders", "Commandes & livraisons", "Orders & deliveries"],
  ["transfers", "Transferts vendeurs", "Seller transfers"],
  ["discussions", "Discussions vendeurs", "Seller discussions"],
);
dashboardTabs.seller.push([
  "discussions",
  "Discussion avec YAVIYA",
  "Talk to YAVIYA",
]);
let selectedMessageSeller = null,
  messageFetchToken = 0;
async function messagesAPI(body, target, sellerView = false) {
  const q = new URLSearchParams();
  if (target) q.set("sellerUserId", target);
  if (sellerView) q.set("view", "seller");
  const query = "?" + q;
  const r = await fetch("/api/seller-messages" + query, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json();
  if (!r.ok)
    throw Error(
      d.error || T("Discussion indisponible.", "Conversation unavailable."),
    );
  return d;
}
function discussionSkeleton(role) {
  return `<h2>${role === "admin" ? T("Discussions avec les vendeurs", "Seller conversations") : T("Discussion avec l’administration YAVIYA", "Talk to YAVIYA administration")}</h2><p>${T("Échangez sur votre dossier, votre boutique, une commande ou une demande de reversement. Les messages sont privés et enregistrés.", "Discuss verification, your shop, an order or a payout request. Messages are private and saved.")}</p><div class="seller-chat"><aside id="seller-chat-threads">${T("Chargement…", "Loading…")}</aside><section><div id="seller-chat-messages" role="log" aria-live="polite"></div><form id="seller-chat-form" class="editor" hidden><label>${T("Votre message *", "Your message *")}<textarea name="message" maxlength="2000" rows="3" required></textarea></label><button class="primary">${T("Envoyer", "Send")}</button><p id="seller-chat-error" role="alert"></p></form></section></div>`;
}
async function loadDiscussion(role) {
  const token = ++messageFetchToken,
    host = $("#seller-chat-messages"),
    threads = $("#seller-chat-threads"),
    form = $("#seller-chat-form");
  if (!host || !form) return;
  try {
    let data = await messagesAPI(
      null,
      role === "admin" ? selectedMessageSeller : null,
      role === "seller",
    );
    if (token !== messageFetchToken || !host.isConnected) return;
    if (role === "admin" && !data.isAdmin)
      throw Error(
        T(
          "Cet espace est réservé à l’administrateur habilité.",
          "This area requires the designated administrator.",
        ),
      );
    if (role === "admin" && !data.sellerUserId && data.threads.length) {
      selectedMessageSeller = data.threads[0].userId;
      data = await messagesAPI(null, selectedMessageSeller);
      if (token !== messageFetchToken || !host.isConnected) return;
    }
    threads.innerHTML =
      role === "admin"
        ? data.threads
            .map(
              (t) =>
                `<button type="button" data-message-seller="${esc(t.userId)}" aria-pressed="${data.sellerUserId === t.userId}"><b>${esc(t.companyName || t.name)}</b><small>${esc(t.name)} · ${t.status === "approved" ? T("Vérifié", "Verified") : T("Dossier en cours", "Verification in progress")}</small></button>`,
            )
            .join("") ||
          `<p>${T("Aucun compte vendeur enregistré dans ce pays. Les boutiques fictives du catalogue ne reçoivent pas de messages.", "No seller account is registered in this country. Fictional catalogue shops cannot receive messages.")}</p>`
        : `<b>YAVIYA</b><p>${T("Administration et assistance vendeurs", "Administration and seller support")}</p>`;
    host.innerHTML =
      data.messages
        .map(
          (m) =>
            `<article class="seller-chat-message ${m.sender === role ? "outgoing" : ""}"><b>${m.sender === "admin" ? "YAVIYA" : T("Vendeur", "Seller")}</b><p>${esc(m.message)}</p><small>${new Date(m.createdAt).toLocaleString(language === "en" ? "en-GB" : "fr-FR")}</small></article>`,
        )
        .join("") ||
      `<p class="chat-empty">${data.sellerUserId ? T("Commencez la discussion. Aucun message pour le moment.", "Start the conversation. No messages yet.") : T("Sélectionnez un vendeur pour ouvrir la discussion.", "Select a seller to open the conversation.")}</p>`;
    form.hidden = !data.sellerUserId;
    form.onsubmit = async (e) => {
      e.preventDefault();
      const button = form.querySelector("button"),
        error = $("#seller-chat-error"),
        message = form.elements.message.value;
      button.disabled = true;
      try {
        await messagesAPI(
          {
            message,
            sellerUserId: data.sellerUserId,
            asSeller: role === "seller",
          },
          null,
          role === "seller",
        );
        form.elements.message.value = "";
        await loadDiscussion(role);
      } catch (err) {
        error.textContent = err.message;
      } finally {
        if (button.isConnected) button.disabled = false;
      }
    };
    host.scrollTop = host.scrollHeight;
  } catch (e) {
    if (host.isConnected) {
      threads.textContent = "YAVIYA";
      host.innerHTML = `<p role="alert">${esc(e.message)}</p><button class="add" data-refresh-discussion="${role}">${T("Réessayer", "Retry")}</button>`;
      form.hidden = true;
    }
  }
}
function transfersMarkup() {
  return `<h2>${T("Transferts d’argent aux vendeurs", "Money transfers to sellers")}</h2><p>${T("Contrôlez les demandes de retrait, le montant disponible et le bénéficiaire avant d’enregistrer un reversement. Les montants sous escrow restent indisponibles jusqu’à confirmation de réception.", "Review withdrawal requests, available amounts and the recipient before recording a payout. Escrow funds stay unavailable until receipt is confirmed.")}</p><p class="demo-note">${T("Espace de préparation et de simulation. Aucun fournisseur de transfert réel n’est connecté.", "Preparation and simulation area. No real transfer provider is connected.")}</p><div class="dashboard-kpis"><div><span>${T("Demandes en attente", "Pending requests")}</span><b>${withdrawals.filter((w) => w.status === "En attente").length}</b></div><div><span>${T("Montant demandé", "Requested amount")}</span><b>${money(withdrawals.filter((w) => w.status === "En attente").reduce((n, w) => n + w.amount, 0))}</b></div><div><span>${T("Reversements simulés", "Simulated payouts")}</span><b>${withdrawals.filter((w) => w.status === "Validé en démo").length}</b></div></div><div class="table-wrap"><table><thead><tr><th>${T("Boutique", "Shop")}</th><th>${T("Montant", "Amount")}</th><th>${T("État", "Status")}</th><th>${T("Action", "Action")}</th></tr></thead><tbody>${withdrawals.map((w) => `<tr><td>${esc(shops.find((s) => s.id === w.seller)?.name || "")}</td><td>${money(w.amount)}</td><td>${esc(w.status)}</td><td>${w.status === "En attente" ? `<button class="add" data-prepare-transfer="${w.id}">${T("Préparer le transfert", "Prepare transfer")}</button>` : esc(w.transferReference || "")}</td></tr>`).join("") || `<tr><td colspan="4">${T("Aucune demande. Le vendeur peut demander un retrait après une commande livrée et confirmée.", "No requests. A seller can request withdrawal after an order is delivered and confirmed.")}</td></tr>`}</tbody></table></div><div id="transfer-preparation"></div><h3>${T("Circuit de validation", "Approval flow")}</h3><p>${T("Demande du vendeur → contrôle du solde et du destinataire → validation manuelle admin → reversement. Dans cette démo, seule la simulation est disponible.", "Seller request → balance and recipient review → manual administrator approval → payout. This demo supports simulation only.")}</p>`;
}
function prepareTransfer(id) {
  const w = withdrawals.find((w) => w.id === id && w.status === "En attente"),
    host = $("#transfer-preparation");
  if (!w || !host) return;
  host.innerHTML = `<form id="transfer-form" class="editor"><h3>${T("Préparer un reversement", "Prepare a payout")} · ${esc(shops.find((s) => s.id === w.seller)?.name || "")}</h3><p>${money(w.amount)}</p><label>${T("Canal envisagé *", "Planned method *")}<select name="method" required><option>Mobile Money</option><option>${T("Virement bancaire", "Bank transfer")}</option></select></label><label>${T("Bénéficiaire / destination fictive *", "Recipient / fictional destination *")}<input name="destination" maxlength="120" required></label><label>${T("Référence de simulation *", "Simulation reference *")}<input name="reference" maxlength="80" required></label><label class="privacy-consent"><input type="checkbox" name="checked" required><span>${T("J’ai contrôlé le bénéficiaire et le montant. *", "I have checked the recipient and amount. *")}</span></label><p class="demo-note">${T("Utilisez des coordonnées fictives. Aucun argent ne sera envoyé.", "Use fictional details. No money will be sent.")}</p><button class="primary">${T("Valider la simulation", "Approve simulation")}</button></form>`;
  $("#transfer-form").onsubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    if (!f.elements.checked.checked || w.status !== "En attente") return;
    w.status = "Validé en démo";
    w.transferReference = f.elements.reference.value.trim();
    w.transferMethod = f.elements.method.value;
    w.transferDestination = f.elements.destination.value.trim();
    transactions.push({
      seller: w.seller,
      label: "Retrait simulé · " + w.transferReference,
      amount: -w.amount,
    });
    notice(
      "seller",
      T("Reversement simulé validé", "Simulated payout approved"),
      money(w.amount) + " · " + w.transferReference,
      w.seller,
    );
    saveDelivery();
    showAdmin();
    toast(
      T(
        "Simulation enregistrée · aucun transfert réel",
        "Simulation saved · no real transfer",
      ),
    );
  };
}
// Save financial simulation alongside the private demo scenario.
const commerceSnapshot = scenarioSnapshot;
scenarioSnapshot = function () {
  return {
    ...commerceSnapshot(),
    withdrawals: JSON.parse(JSON.stringify(withdrawals)),
    transactions: JSON.parse(JSON.stringify(transactions)),
  };
};
const commerceDelivery = applyDelivery;
applyDelivery = function (data, redraw = true) {
  withdrawals.splice(
    0,
    withdrawals.length,
    ...(data.snapshot.withdrawals || []),
  );
  transactions.splice(
    0,
    transactions.length,
    ...(data.snapshot.transactions || []),
  );
  commerceDelivery(data, redraw);
};
function renderAdminOrderPage() {
  const panel = $('#role-content [data-dashboard-panel="orders"]');
  if (panel)
    panel.innerHTML = `<h2>${T("Commandes et suivi des livraisons", "Orders and delivery tracking")}</h2><p>${courierAvailable ? T("YAVIYA Courier disponible", "YAVIYA Courier available") : T("YAVIYA Courier indisponible", "YAVIYA Courier unavailable")}</p>${orders.map(sharedOrderMarkup).join("") || `<p>${T("Aucune commande dans ce scénario.", "No orders in this scenario.")}</p>`}`;
}
const commerceAdminDelivery = renderAdminDelivery;
renderAdminDelivery = function () {
  commerceAdminDelivery();
  renderAdminOrderPage();
};
function orderFocus(on) {
  document.body.classList.toggle("orders-focus", on);
  let b = $("#orders-full-close");
  if (on && !b) {
    $("#role-workspace .role-heading").insertAdjacentHTML(
      "beforeend",
      `<button class="add" id="orders-full-close">${T("Fermer les commandes", "Close orders")}</button>`,
    );
    b = $("#orders-full-close");
    b.onclick = () => {
      if (activeRole === "courier") setRole("buyer");
      else switchDashTab(activeRole, "overview");
    };
  }
  if (b) b.hidden = !on;
}
const commerceSwitchTab = switchDashTab;
switchDashTab = function (role, tab) {
  commerceSwitchTab(role, tab);
  orderFocus(tab === "orders");
  if (tab === "discussions") loadDiscussion(role);
};
const commerceAdmin = showAdmin;
showAdmin = function () {
  commerceAdmin();
  if (activeRole !== "admin") return;
  $('#role-content [data-dashboard-panel="transfers"]').innerHTML =
    transfersMarkup();
  $('#role-content [data-dashboard-panel="discussions"]').innerHTML =
    discussionSkeleton("admin");
  renderAdminOrderPage();
  if (selectedDashTab.admin === "discussions") loadDiscussion("admin");
};
const commerceSeller = showSeller;
showSeller = function () {
  commerceSeller();
  if (activeRole !== "seller" || !ownedSellerIds().length) return;
  const panel = $('#role-content [data-dashboard-panel="discussions"]');
  if (panel) panel.innerHTML = discussionSkeleton("seller");
  if (selectedDashTab.seller === "discussions") loadDiscussion("seller");
  const form = $("#withdraw-form");
  if (form) {
    const before = form.onsubmit;
    form.onsubmit = async (e) => {
      before(e);
      await saveDelivery();
    };
  }
  const shop = shops.find((s) => s.id === selectedSeller);
  const heading = $("#dashboard-common h2");
  if (heading)
    heading.insertAdjacentHTML(
      "beforeend",
      ` <span class="dashboard-shop-name">${esc(shop.name)} ${sellerVerificationBadge(shop)}</span>`,
    );
};
const commerceCourier = showCourier;
showCourier = function () {
  commerceCourier();
  if (activeRole === "courier") orderFocus(true);
};
const commerceRole = setRole;
setRole = function (role, updateURL = true) {
  orderFocus(false);
  commerceRole(role, updateURL);
};
window.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.payout || b.dataset.deny) setTimeout(() => saveDelivery(), 0);
    if (b.dataset.prepareTransfer) {
      e.preventDefault();
      e.stopImmediatePropagation();
      prepareTransfer(+b.dataset.prepareTransfer);
    }
    if (b.dataset.messageSeller) {
      e.preventDefault();
      e.stopImmediatePropagation();
      selectedMessageSeller = b.dataset.messageSeller;
      loadDiscussion("admin");
    }
    if (b.dataset.refreshDiscussion) {
      e.preventDefault();
      e.stopImmediatePropagation();
      loadDiscussion(b.dataset.refreshDiscussion);
    }
  },
  true,
);
setInterval(() => {
  const role = activeRole;
  if (
    ["seller", "admin"].includes(role) &&
    selectedDashTab[role] === "discussions" &&
    !$("#seller-chat-form textarea")?.value.trim()
  )
    loadDiscussion(role);
}, 5000);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("orders-focus")) {
    $("#orders-full-close")?.click();
  }
});
// Keep the catalogue menu focused on categories; account services open from Profil.
document
  .querySelectorAll(".market-navigation>*:not(#all):not(.header-language)")
  .forEach((el) => el.remove());
Object.assign(textTranslations, {
  Catégories: "Categories",
  produits: "products",
  "Prénom *": "First name *",
  "Nom *": "Last name *",
  "Fermer les commandes": "Close orders",
});
render();
renderOffers();
if (activeRole === "seller") showSeller();
if (activeRole === "admin") showAdmin();
if (activeRole === "courier") showCourier();
if (new URLSearchParams(location.search).get("mobileTab") === "profile")
  showMyYaviya();

async function saveRegisteredSellerPlan(id) {
  const c = verificationState.check;
  if (!c || !sellerPlans.some((p) => p.id === id)) return;
  const fd = new FormData();
  Object.entries({
    companyName: c.companyName,
    companyRcm: c.companyRcm,
    documentType: c.documentType,
    unregistered: String(!!c.unregistered),
    sellerPlan: id,
    identityConfirmed: "true",
  }).forEach(([k, v]) => fd.set(k, v || ""));
  try {
    await verificationAPI("", fd);
    await refreshVerification();
    toast(
      T(
        "Forfait enregistré dans votre dossier · sans facturation",
        "Plan saved with your verification request · no billing",
      ),
    );
  } catch (e) {
    toast(e.message);
  }
}
window.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest("[data-select-plan]");
    if (!b || activeRole !== "seller" || selectedSeller < 10000) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    saveRegisteredSellerPlan(b.dataset.selectPlan);
  },
  true,
);

async function buyNow(id) {
  let product = products.find((p) => p.id === id);
  if (
    !product ||
    !product.visible ||
    !product.approved ||
    !sellerInCurrentMarket(shopOf(product)) ||
    product.stock < 1
  ) {
    toast(
      T("Ce produit n’est pas disponible.", "This product is unavailable."),
    );
    return;
  }
  if (deliverySaving) return;
  try {
    if (window.ensureYaviyaSignedIn) await window.ensureYaviyaSignedIn();
    if (activeRole !== "buyer") setRole("buyer");
    if (typeof loadMarket === "function" && !(await loadMarket(false))) {
      throw Error(
        marketError ||
          T(
            "Service de commande indisponible. Réessayez.",
            "Order service unavailable. Retry.",
          ),
      );
    }
    if (typeof customerAPI === "function")
      customerProfile = await customerAPI();
    product = products.find((p) => p.id === id);
    if (
      !product ||
      !product.visible ||
      !product.approved ||
      product.stock < 1 ||
      !sellerInCurrentMarket(shopOf(product))
    ) {
      throw Error(
        T(
          "Ce produit n’est plus disponible.",
          "This product is no longer available.",
        ),
      );
    }
  } catch (error) {
    open(
      `<h2>${T("Finaliser mon achat", "Complete my purchase")}</h2><p>${esc(product?.title || "")}</p><p role="alert">${esc(error.message)}</p><p>${T("Votre achat n’a pas été enregistré. Réessayez lorsque le service est disponible.", "Your purchase was not saved. Retry when the service is available.")}</p><button class="primary" data-buy-now="${id}">${T("Réessayer cet achat", "Retry this purchase")}</button>`,
    );
    return;
  }
  const selection = new Map([[id, 1]]);
  if (!customerProfile) {
    showBuyerRegistration();
    const registration = $("#register-form");
    if (registration) {
      const save = registration.onsubmit;
      registration.onsubmit = async (event) => {
        await save(event);
        if (customerProfile) buyNow(id);
      };
    }
    return;
  }
  showCheckout(selection);
  const form = $("#checkout-form");
  if (!form) return;
  form.insertAdjacentHTML(
    "beforebegin",
    `<section class="instant-purchase"><span class="eyebrow">${T("ACHETER MAINTENANT", "BUY NOW")}</span><div>${product.img ? `<img src="${product.img}" alt="${esc(product.title)}">` : ""}<div><h3>${esc(product.title)}</h3><p>${esc(shopOf(product).name)} · ${T("Quantité : 1", "Quantity: 1")}</p><b>${money(product.price)}</b></div></div></section>`,
  );
}
window.addEventListener(
  "click",
  (e) => {
    const button = e.target.closest("[data-buy-now]");
    if (!button) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (button.disabled) return;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    buyNow(+button.dataset.buyNow).finally(() => {
      button.disabled = false;
      button.removeAttribute("aria-busy");
    });
  },
  true,
);
Object.assign(textTranslations, { "Acheter maintenant": "Buy now" });
render();
renderOffers();

if (modal.open) {
  modal.classList.add("full-page");
  syncFullWindow();
}

function showAccountSettings() {
  if (!customerProfile) return showBuyerRegistration();
  open(`<h2>${T("Paramètres du compte", "Account settings")}</h2><form id="account-preferences-form" class="editor">${profilePreferencesFields()}<p role="status" id="preferences-status"></p><button class="primary">${T("Enregistrer mes préférences", "Save preferences")}</button></form><div class="profile-grid">${profileLink("edit", "Adresse et coordonnées", "Address and contact details")}${profileLink("security", "Sécurité et double authentification", "Security and two-factor authentication")}${profileLink("privacy", "Confidentialité", "Privacy")}</div>`);
  const form = document.querySelector("#account-preferences-form");
  form.onsubmit = async (event) => {
    event.preventDefault();
    const button = form.querySelector("button");
    button.disabled = true;
    try {
      const preferences = Object.fromEntries(new FormData(form));
      await profileBeforeVerification({ ...customerProfile, ...preferences });
      customerProfile = { ...customerProfile, ...preferences };
      language = preferences.preferredLanguage;
      try { localStorage.setItem("yaviya-language", language); } catch {}
      applyLanguage();
      const selector = document.querySelector("#site-language");
      if (selector) selector.value = language;
      document.querySelector("#preferences-status").textContent = T("Préférences enregistrées.", "Preferences saved.");
    } catch (error) {
      document.querySelector("#preferences-status").textContent = error.message;
    } finally { button.disabled = false; }
  };
}
function profilePreferencesFields() {
  const p = customerProfile || {};
  const country = p.residenceCountry || window.YAVIYA_COUNTRY;
  const currency =
    p.currency || (window.YAVIYA_COUNTRY === "CG" ? "XAF" : "CDF");
  return `<fieldset class="profile-preferences"><legend>${T("Pays et préférences", "Country and preferences")}</legend><label>${T("Pays de résidence *", "Country of residence *")}<select name="residenceCountry" autocomplete="country" required>${window.YAVIYA_MARKET_CONFIG.identityCountries.map((c) => `<option value="${c.code}" ${c.code === country ? "selected" : ""}>${esc(language === "en" ? c.en : c.fr)}</option>`).join("")}</select></label><label>${T("Devise préférée", "Preferred currency")}<select name="currency">${window.YAVIYA_MARKET_CONFIG.profileCurrencies.map((c) => `<option ${c === currency ? "selected" : ""}>${c}</option>`).join("")}</select></label><label>${T("Langue préférée", "Preferred language")}<select name="preferredLanguage"><option value="fr" ${(p.preferredLanguage || language) === "fr" ? "selected" : ""}>Français</option><option value="en" ${(p.preferredLanguage || language) === "en" ? "selected" : ""}>English</option></select></label><p class="demo-note">${T("La devise est une préférence de profil. Les prix et paiements restent dans la devise du marché. Le pays de résidence ne modifie pas les zones de livraison.", "Currency is a profile preference. Prices and payments remain in the market currency. Country of residence does not change delivery coverage.")}</p></fieldset>`;
}
const profilePreferencesHome = showMyYaviya;
showMyYaviya = function () {
  profilePreferencesHome();
  if (!customerProfile) return;
  const p = customerProfile;
  const country = window.YAVIYA_MARKET_CONFIG.identityCountries.find(
    (c) => c.code === (p.residenceCountry || window.YAVIYA_COUNTRY),
  );
  const summary = document.querySelector(".profile-summary");
  summary?.insertAdjacentHTML(
    "afterend",
    `<p class="profile-preferences-summary">${T("Pays", "Country")}: ${esc(country ? (language === "en" ? country.en : country.fr) : "")} · ${T("Devise préférée", "Preferred currency")}: ${esc(p.currency || (window.YAVIYA_COUNTRY === "CG" ? "XAF" : "CDF"))} · ${T("Langue", "Language")}: ${p.preferredLanguage === "en" ? "English" : "Français"}</p>`,
  );
};
