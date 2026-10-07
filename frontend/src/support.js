const helpTopics = [
  [
    "Acheter",
    "Ajoutez un produit au panier, puis choisissez votre ville et votre commune à l’étape de livraison. Cette démonstration ne permet pas de passer une commande réelle.",
  ],
  [
    "Livraison",
    "Le formulaire propose les communes de Kinshasa et Lubumbashi. La présence d’une commune ne garantit pas une livraison active : livraison estimée sous 24 à 48 heures après validation, selon la zone. Les frais restent à confirmer au lancement.",
  ],
  [
    "Paiement",
    "Vous pouvez sélectionner M-Pesa, Airtel Money, Orange Money, Afrimoney ou carte bancaire dans le formulaire de commande. Ce choix est illustratif : aucun paiement réel n’est actif. Le paiement anticipé est retenu en escrow simulé jusqu’à la confirmation de réception par le client. Ne communiquez jamais votre code PIN ni votre numéro de carte ici.",
  ],
  [
    "Vendeurs vérifiés",
    "Le bouclier avec coche représente le badge vendeur vérifié. Dans cette démonstration, tous les profils et badges sont illustratifs. Avant le lancement, une vérification réelle devra être effectuée.",
  ],
  [
    "Devenir vendeur",
    "Les offres envisagées sont : Gratuit, 5 produits ; Plus, 25 000 FC/mois pour 20 produits ; Premium, 50 000 FC/mois pour un catalogue illimité. Les inscriptions ne sont pas encore ouvertes.",
  ],
  [
    "Retour et remboursement",
    "Aucune transaction réelle n’est effectuée ici. Les conditions de retour et de remboursement seront publiées avant le lancement commercial.",
  ],
  [
    "Contact et suivi",
    "Le suivi des commandes et le contact avec un conseiller seront disponibles au lancement. Cet assistant répond aux questions courantes, sans accès à des commandes réelles.",
  ],
];
function answerQuestion(q) {
  const t = q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (/commune|ville|livrai|kinshasa|lubumbashi|adresse|delai|frais/.test(t))
    return helpTopics[1][1];
  if (/verifi|badge|fiab|confiance/.test(t)) return helpTopics[3][1];
  if (/vendeur|vendre|boutique|abonnement|premium/.test(t))
    return helpTopics[4][1];
  if (/pai|money|carte|pin|mpesa|m-pesa|airtel|orange|afri/.test(t))
    return helpTopics[2][1];
  if (/retour|rembours|annul/.test(t)) return helpTopics[5][1];
  if (/suivi|contact|conseiller|service|reclam/.test(t))
    return helpTopics[6][1];
  if (/achat|acheter|panier|commande|produit/.test(t)) return helpTopics[0][1];
  if (/bonjour|salut|bonsoir/.test(t))
    return "Bonjour ! Je peux vous renseigner sur la livraison, les paiements, les boutiques et le parcours d’achat. Quel sujet vous intéresse ?";
  return "Je n’ai pas de réponse précise à cette question. Choisissez un sujet ci-dessous ou consultez le centre d’aide. Je suis un assistant automatique de FAQ, sans accès aux commandes ni à un conseiller.";
}
document.body.insertAdjacentHTML(
  "beforeend",
  `<button id="chat-toggle" class="primary" aria-expanded="false" aria-controls="chat-panel">◌ Besoin d’aide ?</button><section id="chat-panel" class="chat-panel" aria-label="Assistant YAVIYA" hidden><div class="chat-head"><div><b>Assistant YAVIYA</b><small>Réponses automatiques · FAQ</small></div><button id="chat-close" aria-label="Fermer le chatbot">×</button></div><div id="chat-messages" role="log" aria-live="polite"><p class="bot-message">Bonjour ! Comment puis-je vous aider ? Cette version est une démonstration ; ne saisissez pas de données personnelles.</p></div><div class="chat-topics">${helpTopics
    .slice(0, 5)
    .map((t, i) => `<button data-topic="${i}">${t[0]}</button>`)
    .join(
      "",
    )}</div><form id="chat-form"><label class="sr-only" for="chat-input">Votre question</label><input id="chat-input" placeholder="Posez votre question…" maxlength="500" required><button type="submit" class="primary">Envoyer</button></form><a href="aide.html" class="chat-help">Consulter le centre d’aide</a></section>`,
);
const toggle = document.querySelector("#chat-toggle"),
  panel = document.querySelector("#chat-panel");
let chatReturnFocus = null;
function setChat(show) {
  const dialog = document.querySelector("#modal[open]");
  if (show) {
    chatReturnFocus = document.activeElement;
    // A child of the open dialog remains interactive in the browser top layer.
    (dialog || document.body).append(panel);
  }
  document.body.classList.toggle("chat-open", show);
  panel.hidden = !show;
  toggle.setAttribute("aria-expanded", String(show));
  if (show) document.querySelector("#chat-input").focus();
  else {
    document.body.append(panel);
    const target = chatReturnFocus?.isConnected ? chatReturnFocus : toggle;
    target.focus();
  }
}
document.addEventListener(
  "click",
  (event) => {
    const trigger = event.target.closest("[data-open-chat]");
    if (!trigger) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setChat(true);
  },
  true,
);
document.querySelector("#modal")?.addEventListener("close", () => {
  if (document.querySelector("#modal").open) return;
  if (panel.parentElement !== document.body) {
    panel.hidden = true;
    document.body.classList.remove("chat-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.append(panel);
  }
});
toggle.onclick = () => setChat(panel.hidden);
document.querySelector("#chat-close").onclick = () => setChat(false);
panel.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    setChat(false);
  }
});
function chatReply(q, a) {
  const messages = document.querySelector("#chat-messages");
  for (const [text, cls] of [
    [q, "user-message"],
    [a, "bot-message"],
  ]) {
    const el = document.createElement("p");
    el.className = cls;
    el.textContent = text;
    messages.appendChild(el);
  }
  messages.scrollTop = messages.scrollHeight;
}
document.querySelector("#chat-form").onsubmit = (e) => {
  e.preventDefault();
  const input = document.querySelector("#chat-input"),
    q = input.value.trim();
  if (!q) return;
  chatReply(q, answerQuestion(q));
  input.value = "";
};
document.querySelectorAll("[data-topic]").forEach(
  (b) =>
    (b.onclick = () => {
      const t = helpTopics[Number(b.dataset.topic)];
      chatReply(t[0], answerQuestion(t[0]));
    }),
);
const faq = document.querySelector("#faq");
if (faq)
  faq.innerHTML = helpTopics
    .map((t) => `<details><summary>${t[0]}</summary><p>${t[1]}</p></details>`)
    .join("");
document.querySelector("#help-search")?.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  let found = 0;
  faq.querySelectorAll("details").forEach((d) => {
    d.hidden = !d.textContent.toLowerCase().includes(q);
    if (!d.hidden) found++;
  });
  document.querySelector("#help-empty").hidden = found > 0;
});
