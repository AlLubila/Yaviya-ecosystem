const popularQuestions = [
  {
    id: "order",
    fr: [
      "Comment acheter un produit en quelques étapes ?",
      "Ouvrez la fiche du produit, consultez ses photos et ses caractéristiques, puis choisissez « Acheter maintenant » ou « Ajouter au panier ». Connectez-vous, complétez vos coordonnées et choisissez une ville ouverte à la livraison. Vérifiez le récapitulatif et les frais avant de confirmer : une commande enregistrée reçoit un numéro dans « Mes commandes ».",
    ],
    en: [
      "How do I buy a product?",
      "Open the product page, inspect its photos and specifications, then choose “Buy now” or “Add to cart”. Sign in, complete your contact details and choose a delivery city currently served. Review the summary and fees before confirming. A saved order receives a reference in “My orders”.",
    ],
  },
  {
    id: "photos",
    fr: [
      "Comment bien vérifier un article avant de commander ?",
      "Parcourez toutes les miniatures : vue principale, autre angle et détails ajoutés par le vendeur. Comparez la couleur, la taille, les matières et le contenu du colis avec la description. Une photo seule ne garantit pas ces caractéristiques : demandez les précisions manquantes au vendeur avant de valider. Les vues générées du catalogue démo sont illustratives.",
    ],
    en: [
      "How can I inspect an item before buying?",
      "Browse every thumbnail: main view, another angle and details uploaded by the seller. Compare colour, size, materials and package contents with the description. Photos alone do not guarantee these specifications: ask the seller for missing details before confirming. Generated demo catalogue views are illustrative.",
    ],
  },
  {
    id: "verified",
    fr: [
      "Que signifie le badge vendeur vérifié ?",
      "Le badge vous aide à repérer le statut de vérification de la boutique. Consultez aussi sa fiche, les informations disponibles et les avis : une vérification ne garantit pas à elle seule la qualité de chaque article. Les badges « Vérifié · démo » représentent des boutiques fictives et ne constituent pas une vérification réelle.",
    ],
    en: [
      "What does a verified seller badge mean?",
      "The badge helps identify the store’s verification status. Also review its profile, available information and reviews: verification alone does not guarantee every item’s quality. “Verified · demo” badges represent fictional stores, not real verification.",
    ],
  },
  {
    id: "tracking",
    fr: [
      "Où retrouver et suivre ma commande ?",
      "Connectez-vous au compte utilisé lors de l’achat et ouvrez « Mes commandes » ou « Suivre ma commande ». Conservez votre numéro : il permet d’identifier le bon achat. Le vendeur, le livreur affecté et l’administration interviennent sur la même commande selon leur rôle. Si le service est indisponible, réessayez plus tard ; ne considérez pas une commande comme enregistrée sans confirmation.",
    ],
    en: [
      "Where can I find and track my order?",
      "Sign into the account used for the purchase and open “My orders” or “Track my order”. Keep your reference to identify the purchase. The seller, assigned courier and administrator act on the same order according to their roles. If the service is unavailable, retry later; an order is not saved until confirmed.",
    ],
  },
  {
    id: "delivery",
    fr: [
      "Dans quelles villes de RDC puis-je commander ?",
      "Le parcours accepte actuellement Kinshasa et Lubumbashi, avec sélection de la commune. Les autres villes du sélecteur sont indiquées « bientôt disponible » et restent bloquées jusqu’à l’ouverture de la livraison. Vous savez ainsi avant de confirmer si votre adresse est éligible.",
    ],
    en: [
      "Which DRC cities can I order from?",
      "Checkout currently accepts Kinshasa and Lubumbashi, with commune selection. Other cities in the selector are marked “coming soon” and blocked until delivery opens there. You can check address eligibility before confirming.",
    ],
  },
  {
    id: "fees",
    fr: [
      "Comment connaître les frais et le délai de livraison ?",
      "Sélectionnez votre ville, votre commune et le mode de livraison : le récapitulatif affiche les frais calculés pour votre commande. Plusieurs vendeurs peuvent nécessiter plusieurs colis. Les montants et délais de la démo sont indicatifs ; confirmez les conditions réelles avec le vendeur avant tout achat hors démonstration.",
    ],
    en: [
      "How do I check delivery fees and timing?",
      "Choose your city, commune and delivery method: the summary shows the calculated order fees. Multiple sellers can require multiple parcels. Demo fees and timing are illustrative; confirm actual terms with the seller before any real purchase.",
    ],
  },
  {
    id: "payment",
    fr: [
      "Puis-je payer par Mobile Money ou carte bancaire ?",
      "Les commandes partagées proposent les espèces à réception. Mobile Money et les cartes bancaires restent prévus pour une future intégration : aucun débit électronique ni abonnement réel n’est activé. Vérifiez le total et le numéro de commande ; les déclarations de paiement à réception sont enregistrées séparément par l’acheteur et l’encaisseur.",
    ],
    en: [
      "Can I pay by Mobile Money or bank card?",
      "Shared orders support cash on receipt. Mobile Money and bank cards are planned for future integration: no electronic debit or real subscription is active. Check the total and order reference; cash receipt declarations are saved separately by the buyer and collector.",
    ],
  },
  {
    id: "escrow",
    fr: [
      "Quand le vendeur reçoit-il le paiement ?",
      "Pour les commandes partagées, l’encaissement à réception et le règlement manuel sont déclarés et conservés par commande. Aucun escrow électronique n’est activé et aucun fonds réel n’est détenu par YAVIYA dans la démo. Vérifiez le produit reçu et les informations de paiement avant de confirmer votre réception.",
    ],
    en: [
      "When is payment released to the seller?",
      "For shared orders, cash collection and manual settlement declarations are saved per order. Electronic escrow is not enabled and YAVIYA holds no real funds in the demo. Check the received product and payment details before confirming receipt.",
    ],
  },
  {
    id: "receipt",
    fr: [
      "Que dois-je vérifier à la réception du colis ?",
      "Comparez le produit reçu avec votre commande : référence, quantité commandée, couleur, taille, état et accessoires. Si vous constatez un problème, gardez le numéro de commande et des photos du produit et de l’emballage, puis contactez le vendeur ou l’aide avant de confirmer la réception.",
    ],
    en: [
      "What should I check when my parcel arrives?",
      "Compare the item with your order: reference, ordered quantity, colour, size, condition and accessories. If something is wrong, keep the order reference and photos of the item and packaging, then contact the seller or help before confirming receipt.",
    ],
  },
  {
    id: "returns",
    fr: [
      "Que faire si le produit est abîmé ou ne correspond pas ?",
      "Expliquez précisément le problème au vendeur ou au support avec votre numéro de commande et des photos. Conservez l’article et son emballage pendant l’examen de la demande. Les conditions définitives de retour et de remboursement doivent être publiées avant le lancement ; la démo ne traite aucun remboursement réel.",
    ],
    en: [
      "What if an item is damaged or does not match?",
      "Describe the issue to the seller or support with your order reference and photos. Keep the item and packaging while the request is reviewed. Final return and refund terms must be published before launch; the demo processes no real refunds.",
    ],
  },
  {
    id: "reviews",
    fr: [
      "Puis-je noter séparément le vendeur et le livreur ?",
      "Oui, après la livraison, les parcours d’évaluation distinguent le vendeur et le livreur affecté à la commande. Décrivez la conformité du produit et la préparation pour le vendeur, puis la remise du colis pour le livreur. Un avis précis aide les prochains acheteurs à choisir avec plus d’informations.",
    ],
    en: [
      "Can I rate the seller and courier separately?",
      "Yes, after delivery, review flows distinguish the seller from the courier assigned to the order. Describe item accuracy and preparation for the seller, then parcel handover for the courier. Specific feedback helps future buyers make informed choices.",
    ],
  },
  {
    id: "security",
    fr: [
      "Comment mieux protéger mon compte ?",
      "Dans les paramètres de sécurité, activez l’authentification à deux facteurs avec une application d’authentification, puis conservez vos codes de secours dans un endroit sûr. Utilisez un mot de passe unique. Ne communiquez jamais votre mot de passe, votre code à usage unique ou vos codes de secours au vendeur ou au livreur.",
    ],
    en: [
      "How can I better protect my account?",
      "Enable two-factor authentication with an authenticator app in security settings and store your recovery codes safely. Use a unique password. Never share your password, one-time code or recovery codes with a seller or courier.",
    ],
  },
  {
    id: "unavailable",
    fr: [
      "« Acheter maintenant » affiche une erreur : que faire ?",
      "Si une connexion est demandée, connectez-vous puis complétez votre profil acheteur. Vérifiez aussi que l’article est disponible et que votre ville est ouverte à la livraison. Si le service de compte ou de commande est temporairement indisponible, utilisez « Réessayer » quand il revient. Vérifiez « Mes commandes » avant de recommencer après une confirmation incertaine.",
    ],
    en: [
      "“Buy now” shows an error. What should I do?",
      "Sign in if prompted and complete your buyer profile. Check item availability and delivery city eligibility. If the account or order service is temporarily unavailable, use “Retry” when it returns. Check “My orders” before repeating a purchase after an uncertain confirmation.",
    ],
  },
  {
    id: "seller",
    fr: [
      "Comment ouvrir une boutique et ajouter plusieurs photos ?",
      "Choisissez le parcours vendeur et complétez les étapes : coordonnées, activité, identité puis abonnement. Le dossier est soumis à l’administration. Dans l’éditeur produit, ajoutez jusqu’à 8 photos et placez la meilleure en premier : elle devient la couverture. Ajoutez des angles différents et des détails utiles. Aucun abonnement réel n’est facturé dans le MVP.",
    ],
    en: [
      "How do I open a store and add multiple photos?",
      "Choose seller registration and complete contact, business, identity and final subscription steps. Administration reviews the application. In the product editor, add up to 8 photos and put the best first as the cover. Include different angles and useful details. No real subscription is billed in the MVP.",
    ],
  },
  {
    id: "courier",
    fr: [
      "Comment devenir livreur et consulter mes missions ?",
      "Complétez les quatre étapes du parcours livreur : coordonnées, identité, avantages et rémunération, puis abonnement Standard gratuit et coordonnées de règlement. Après validation et affectation, votre espace présente vos livraisons et les informations de rémunération simulées. Les échanges avec l’administration permettent de préciser les missions ; aucun paiement réel n’est exécuté dans la démo.",
    ],
    en: [
      "How do I become a courier and view assignments?",
      "Complete the four courier registration steps: contact details, identity, benefits and earnings, then the free Standard subscription and settlement details. After approval and assignment, your workspace shows deliveries and simulated compensation information. Discussions with administration help clarify assignments; the demo executes no real payments.",
    ],
  },
  {
    id: "coins",
    fr: [
      "À quoi servent les Yavicoins ?",
      "Consultez « Mes Yavicoins » pour voir le solde et les possibilités d’échange présentées dans le parcours. Les règles affichées expliquent comment ils sont gagnés après réception confirmée. Dans cette version, les coins sont des points de démonstration sans valeur monétaire réelle.",
    ],
    en: [
      "What are Yavicoins for?",
      "Open “My Yavicoins” for your balance and the redemption options shown in the flow. Displayed rules explain how points are earned after confirmed receipt. In this version, coins are demo points with no real monetary value.",
    ],
  },
  {
    id: "contact",
    fr: [
      "Comment demander de l’aide efficacement ?",
      "Ouvrez « Aide » et indiquez votre numéro de commande, l’étape concernée et ce qui ne fonctionne pas. Une description précise permet d’identifier plus facilement le problème. Le formulaire prépare un e-mail : vous devez l’envoyer depuis votre messagerie. Les coordonnées et horaires proposés dans la démo restent à valider avant lancement.",
    ],
    en: [
      "How can I get useful help?",
      "Open Help and include your order reference, the affected step and what is not working. Specific details make the issue easier to identify. The form prepares an email; you must send it from your email app. Demo contact details and opening hours remain to be validated before launch.",
    ],
  },
];
const isMarketPage = typeof faqItems !== "undefined";
let helpLanguage = "fr";
try {
  helpLanguage = localStorage.getItem("yaviya-language") || "fr";
} catch {}
const pLang = () => (isMarketPage ? language : helpLanguage);
const pT = (fr, en) => (pLang() === "en" ? en : fr);
const faqVotes = new Map();
function popularFaqMarkup() {
  return popularQuestions
    .map(
      (q) =>
        `<details data-popular-question="${q.id}"><summary>${q[pLang()][0]}</summary><div class="faq-answer"><p>${q[pLang()][1]}</p>${q.id === "tracking" ? `<a class="add" href="index.html?info=tracking" data-track-link>${pT("Suivre ma commande", "Track my order")}</a>` : ""}<div class="faq-feedback" data-feedback-area="${q.id}"><p>${pT("Ce problème est-il résolu ?", "Is this issue resolved?")}</p><div><button class="add" data-faq-vote="${q.id}" data-resolved="true" aria-pressed="${faqVotes.get(q.id) === true}">${pT("Oui, résolu", "Yes, resolved")}</button><button class="add" data-faq-vote="${q.id}" data-resolved="false" aria-pressed="${faqVotes.get(q.id) === false}">${pT("Non", "No")}</button></div><p class="faq-vote-status" role="status">${faqVotes.has(q.id) ? pT("Merci pour votre retour.", "Thank you for your feedback.") : ""}</p><div class="faq-not-resolved" ${faqVotes.get(q.id) === false ? "" : "hidden"}><p>${pT("Besoin d’aide supplémentaire ? Contactez le support.", "Need more help? Contact support.")}</p><a href="aide.html#support-contact">${pT("Ouvrir le formulaire de contact", "Open contact form")}</a></div></div></div></details>`,
    )
    .join("");
}
if (isMarketPage) {
  faqItems.splice(
    0,
    faqItems.length,
    ...popularQuestions.map((q) => [q.fr[0], q.en[0], q.fr[1], q.en[1]]),
  );
  faqMarkup = popularFaqMarkup;
  $("#home-faq").dataset.language = "";
  applyLanguage();
  $("#faq-title").textContent = pT("Questions populaires", "Popular questions");
  const oldMenu = renderMenu;
  renderMenu = function () {
    oldMenu();
    $("#menu-content .menu-links:last-child").insertAdjacentHTML(
      "afterbegin",
      `<button data-track-orders>${pT("Suivre ma commande", "Track my order")}</button>`,
    );
  };
  const originalLanguage = applyLanguage;
  applyLanguage = function () {
    originalLanguage();
    $("#faq-title").textContent = pT(
      "Questions populaires",
      "Popular questions",
    );
  };
  function openOrderTracker() {
    open(
      `<h2>${pT("Suivre ma commande", "Track my order")}</h2><p>${pT("Connectez-vous au compte acheteur et entrez votre numéro de commande.", "Sign into your buyer account and enter your order reference.")}</p><form id="track-order-form" class="editor"><label>${pT("Numéro de commande", "Order number")}<input id="track-order-id" required placeholder="YV-XXXXXXXX"></label><button class="primary">${pT("Rechercher ma commande", "Find my order")}</button></form><div id="track-order-result" aria-live="polite"></div>`,
    );
    $("#track-order-form").onsubmit = (e) => {
      e.preventDefault();
      const id = $("#track-order-id").value.trim().toUpperCase(),
        o = orders.find((o) => o.id === id);
      $("#track-order-result").innerHTML = o
        ? `<section class="order-box"><h3>${o.id}</h3><p><b>${stages[o.step]}</b></p><ul>${o.events.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><button class="add" data-action="tracking">${pT("Voir toutes mes commandes", "View all my orders")}</button></section>`
        : `<p>${pT("Commande introuvable dans ce compte. Vérifiez le numéro et le compte utilisé lors de l’achat.", "Order not found in this account. Check the reference and the account used for the purchase.")}</p>`;
    };
  }
  document.addEventListener(
    "click",
    (e) => {
      const b = e.target.closest("[data-track-orders],[data-track-link]");
      if (!b) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (drawer.open) drawer.close();
      openOrderTracker();
    },
    true,
  );
  if (new URL(location.href).searchParams.get("info") === "tracking")
    openOrderTracker();
} else {
  document.querySelector("#faq").innerHTML = popularFaqMarkup();
  document
    .querySelector("header")
    .insertAdjacentHTML(
      "beforeend",
      `<label>Langue<select id="help-language"><option value="fr">Français</option><option value="en">English</option></select></label>`,
    );
  document.querySelector("#help-language").value = helpLanguage;
  document.querySelector("#help-language").onchange = (e) => {
    helpLanguage = e.target.value;
    try {
      localStorage.setItem("yaviya-language", helpLanguage);
    } catch {}
    document.documentElement.lang = helpLanguage;
    document.querySelector("#faq").innerHTML = popularFaqMarkup();
    document.querySelector("#popular-title").textContent = pT(
      "Questions populaires",
      "Popular questions",
    );
    renderContact();
  };
  document.querySelector(".help-note").remove();
  document
    .querySelector("main")
    .insertAdjacentHTML(
      "beforeend",
      '<section id="support-contact" class="help-note"></section>',
    );
}
function renderContact() {
  const host = document.querySelector("#support-contact");
  if (!host) return;
  host.innerHTML = `<h2>${pT("Contactez le service client", "Contact customer service")}</h2><p><a href="mailto:contact@yaviya.cd">contact@yaviya.cd</a></p><p>${pT("Horaires prévus : 7j/7 de 8h à 20h. Téléphone et WhatsApp : à confirmer. Coordonnées à valider avant lancement.", "Planned hours: 8am–8pm, seven days a week. Phone and WhatsApp: to be confirmed. Contact details to be validated before launch.")}</p><form id="contact-draft" class="editor"><label>${pT("Numéro de commande (facultatif)", "Order number (optional)")}<input name="order" maxlength="60"></label><label>${pT("Sujet", "Subject")}<input name="subject" maxlength="100" required></label><label>${pT("Votre message", "Your message")}<textarea name="message" maxlength="2000" required></textarea></label><button class="primary">${pT("Préparer un e-mail", "Prepare an email")}</button></form><p id="contact-draft-result" role="status"></p>`;
  document.querySelector("#contact-draft").onsubmit = (e) => {
    e.preventDefault();
    const d = new FormData(e.target),
      link = document.createElement("a");
    link.className = "add";
    link.textContent = pT("Ouvrir dans ma messagerie", "Open in my email app");
    link.href =
      "mailto:contact@yaviya.cd?subject=" +
      encodeURIComponent("[YAVIYA] " + d.get("subject")) +
      "&body=" +
      encodeURIComponent(
        (d.get("order") ? "Commande : " + d.get("order") + "\n\n" : "") +
          d.get("message"),
      );
    document.querySelector("#contact-draft-result").replaceChildren(link);
  };
}
renderContact();
document.addEventListener(
  "click",
  async (e) => {
    const b = e.target.closest("[data-faq-vote]");
    if (!b) return;
    e.stopImmediatePropagation();
    const area = b.closest("[data-feedback-area]"),
      question = b.dataset.faqVote,
      resolved = b.dataset.resolved === "true";
    area.querySelectorAll("button").forEach((x) => (x.disabled = true));
    const status = area.querySelector(".faq-vote-status");
    status.textContent = pT("Enregistrement…", "Saving…");
    try {
      const r = await fetch("/api/faq-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, resolved }),
      });
      if (!r.ok) throw Error();
      faqVotes.set(question, resolved);
      area
        .querySelectorAll("[data-resolved]")
        .forEach((x) =>
          x.setAttribute(
            "aria-pressed",
            String((x.dataset.resolved === "true") === resolved),
          ),
        );
      area.querySelector(".faq-not-resolved").hidden = resolved;
      status.textContent = pT(
        "Merci, votre retour a été enregistré.",
        "Thank you, your feedback has been saved.",
      );
    } catch {
      status.textContent = pT(
        "Enregistrement indisponible. Connectez-vous ou réessayez.",
        "Saving unavailable. Sign in or try again.",
      );
    } finally {
      area.querySelectorAll("button").forEach((x) => (x.disabled = false));
    }
  },
  true,
);
fetch("/api/faq-feedback")
  .then((r) => (r.ok ? r.json() : []))
  .then((rows) =>
    rows.forEach((r) => {
      if (faqVotes.has(r.question)) return;
      faqVotes.set(r.question, Boolean(r.resolved));
      document
        .querySelectorAll(`[data-feedback-area="${r.question}"]`)
        .forEach((a) => {
          a.querySelector(".faq-vote-status").textContent = pT(
            "Merci pour votre retour.",
            "Thank you for your feedback.",
          );
          a.querySelector(".faq-not-resolved").hidden = !!r.resolved;
          a.querySelectorAll("[data-resolved]").forEach((b) =>
            b.setAttribute(
              "aria-pressed",
              String((b.dataset.resolved === "true") === !!r.resolved),
            ),
          );
        });
    }),
  )
  .catch(() => {});
answerQuestion = function (q) {
  const t = q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const id = /photo|angle|image/.test(t)
    ? "photos"
    : /secur|2fa|facteur|authentificat/.test(t)
      ? "security"
      : /note|avis|review|rating/.test(t)
        ? "reviews"
        : /erreur|error|indispon|fonctionne/.test(t)
          ? "unavailable"
          : /frais|fee|delai|timing/.test(t)
            ? "fees"
            : /reception|receipt|colis recu/.test(t)
              ? "receipt"
              : /devenir livreur|become.*courier/.test(t)
                ? "courier"
                : /coin|fidel|loyal/.test(t)
                  ? "coins"
                  : /escrow|retenu|release/.test(t)
                    ? "escrow"
                    : /track|suiv|numero/.test(t)
                      ? "tracking"
                      : /retour|return|refund|rembours/.test(t)
                        ? "returns"
                        : /verifi|badge|verified/.test(t)
                          ? "verified"
                          : /vendre|vendeur|seller/.test(t)
                            ? "seller"
                            : /pai|money|visa|master|payment/.test(t)
                              ? "payment"
                              : /livr|deliv|commune|zone/.test(t)
                                ? "delivery"
                                : /contact|support|client|telephone/.test(t)
                                  ? "contact"
                                  : "order";
  return popularQuestions.find((x) => x.id === id)[pLang()][1];
};

if (isMarketPage)
  showSupport = function () {
    open(
      `<h2>${pT("Contactez le service client", "Contact customer service")}</h2><p><a href="mailto:contact@yaviya.cd">contact@yaviya.cd</a></p><p>${pT("Horaires prévus : 7j/7, de 8h à 20h. Téléphone et WhatsApp : à confirmer.", "Planned hours: 8am–8pm, seven days a week. Phone and WhatsApp: to be confirmed.")}</p><a class="primary" href="aide.html#support-contact">${pT("Ouvrir le formulaire de contact", "Open contact form")}</a><p class="demo-note">${pT("Coordonnées proposées, à valider avant lancement.", "Proposed contact details, to be validated before launch.")}</p>`,
    );
  };
