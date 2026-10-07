let couponsWallet = null,
  couponsBusy = false;
async function couponsAPI(data) {
  const r = await fetch("/api/coupons", {
    method: data ? "POST" : "GET",
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  const body = await r.json();
  if (!r.ok)
    throw Error(
      r.status === 401
        ? T(
            "Connectez-vous à YAVIYA pour ouvrir votre portefeuille.",
            "Sign in to YAVIYA to open your wallet.",
          )
        : body.error === "Create your profile first"
          ? T(
              "Créez votre profil client pour activer les coupons.",
              "Create your customer profile to activate Coupons.",
            )
          : body.error === "Insufficient coins"
            ? T("Solde de coupons insuffisant.", "Not enough Coupons.")
            : T(
                "Portefeuille indisponible. Réessayez.",
                "Wallet unavailable. Please try again.",
              ),
    );
  couponsWallet = body;
  return body;
}
function coinAmount(n) {
  return (
    new Intl.NumberFormat(language === "en" ? "en-GB" : "fr-CD").format(n) +
    " Coupons"
  );
}
function coinHistoryLabel(event) {
  if (event.kind === "demo_credit")
    return T("Crédit d’essai unique", "One-time trial credit");
  if (event.kind === "earn")
    return (
      T("Achat confirmé", "Confirmed purchase") + " · " + esc(event.reference)
    );
  return (
    T("Échange produit", "Product redemption") +
    " · " +
    esc(
      products.find((p) => p.id === +event.reference)?.title || event.reference,
    )
  );
}
async function showCoins() {
  open(
    `<h2>Coupons</h2><p role="status">${T("Chargement du portefeuille…", "Loading wallet…")}</p>`,
  );
  try {
    const wallet = await couponsAPI();
    open(
      `<div class="coin-wallet-head"><span class="eyebrow">${T("MON PORTEFEUILLE FIDÉLITÉ", "MY LOYALTY WALLET")}</span><h2>Coupons</h2><b>${coinAmount(wallet.balance)}</b><span>${T("Valeur de démonstration : ", "Demo value: ")}${money(wallet.balance * 10)}</span></div><p class="demo-note">${T("Règles provisoires : 1 coupon par 2 000 FC de produits reçus et confirmés ; 1 coupon = 10 FC pour un échange. Coupons de démonstration, sans valeur monétaire réelle, non retirables en espèces.", "Provisional rules: 1 coupon per FC 2,000 of received and confirmed products; 1 coupon = FC 10 for redemption. Demo coupons have no real monetary value and cannot be withdrawn as cash.")}</p>${!customerProfile ? `<p>${T("Créez votre profil pour gagner et utiliser vos coupons.", "Create your profile to earn and use your coupons.")}</p><button class="primary" data-client="register">${T("Créer mon compte", "Create my account")}</button>` : ""}${wallet.events.some((e) => e.kind === "demo_credit") ? "" : `<button class="add" data-coins="credit">${T("Tester avec 5 000 coupons · une seule fois", "Try 5,000 coupons · once only")}</button>`}<h3>${T("Échanger contre un produit", "Redeem for a product")}</h3><p>${T("Sélection de démonstration. Les échanges sont simulés ; aucun produit réel n’est expédié. La livraison est offerte uniquement dans ce parcours de test.", "Demo selection. Redemptions are simulated; no real product is shipped. Delivery is free only in this test flow.")}</p><div class="rewards-grid">${Object.entries(
        wallet.rewards,
      )
        .map(([id, r]) => {
          const p = products.find((p) => p.id === +id);
          if (!p) return "";
          const enough = wallet.balance >= r.cost;
          return `<article class="reward-card"><img src="${p.img}" alt="${esc(p.title)}"><h4>${esc(p.title)}</h4><b>${coinAmount(r.cost)}</b><button class="${enough ? "primary" : "add"}" data-reward="${id}" ${!enough || !customerProfile ? "disabled" : ""}>${T(enough ? "Échanger mes coupons" : "Coupons insuffisants", enough ? "Redeem my coupons" : "Not enough coupons")}</button></article>`;
        })
        .join(
          "",
        )}</div><h3>${T("Historique des coupons", "Coupons history")}</h3><ul class="coin-history">${wallet.events.map((e) => `<li><span>${coinHistoryLabel(e)}<small>${new Date(e.created_at).toLocaleString(language === "en" ? "en-GB" : "fr-FR")}</small></span><b class="${e.delta < 0 ? "coin-debit" : "coin-credit"}">${e.delta > 0 ? "+" : ""}${coinAmount(e.delta)}</b></li>`).join("") || `<li>${T("Aucun mouvement pour le moment.", "No activity yet.")}</li>`}</ul>`,
    );
  } catch (e) {
    open(
      `<h2>Coupons</h2><p role="alert">${esc(e.message)}</p><button class="add" data-coins="wallet">${T("Réessayer", "Try again")}</button><button class="primary" data-client="register">${T("Créer mon profil", "Create my profile")}</button>`,
    );
  }
}
async function creditCoins() {
  if (coinsBusy) return;
  couponsBusy = true;
  try {
    await couponsAPI({ kind: "demo_credit" });
    await showCoins();
    toast(T("Crédit d’essai chargé", "Trial credit added"));
  } catch (e) {
    toast(e.message);
  } finally {
    couponsBusy = false;
  }
}
function confirmReward(id) {
  const p = products.find((p) => p.id === id),
    reward = couponsWallet?.rewards[id];
  if (!p || !reward) return;
  open(
    `<h2>${T("Confirmer l’échange", "Confirm redemption")}</h2><img class="detail-image" src="${p.img}" alt="${esc(p.title)}"><h3>${esc(p.title)}</h3><p>${T("Coût : ", "Cost: ")}<b>${coinAmount(reward.cost)}</b></p><p>${T("Solde après échange : ", "Balance after redemption: ")}${coinAmount(coinsWallet.balance - reward.cost)}</p><p class="demo-note">${T("Échange de démonstration. Aucun produit réel ne sera livré. Les coupons seront déduits du portefeuille enregistré.", "Demo redemption. No real product will be delivered. Coupons will be deducted from your saved wallet.")}</p><button class="primary" id="redeem-confirm">${T("Confirmer l’échange de démonstration", "Confirm demo redemption")}</button><button class="add" data-coins="wallet">${T("Retour", "Back")}</button><p id="reward-error" role="alert"></p>`,
  );
  const reference = crypto.randomUUID();
  $("#redeem-confirm").onclick = async (e) => {
    if (coinsBusy) return;
    couponsBusy = true;
    e.target.disabled = true;
    try {
      await couponsAPI({ kind: "redeem", productId: id, reference });
      const order = {
        createdAt: Date.now(),
        buyerConfirmed: false,
        id: "YV-" + reference.slice(0, 8).toUpperCase(),
        city: "Kinshasa",
        commune: "À préciser · démo",
        payment: "Coupons",
        paymentState: "Échange Coupons · démo",
        coinCost: reward.cost,
        items: [{ id, q: 1, price: 0, seller: p.seller, title: p.title }],
        step: 0,
        total: 0,
        rate: 0,
        sellerSteps: { [p.seller]: 0 },
        events: ["Échange de " + reward.cost + " Coupons · démonstration"],
      };
      orders.unshift(order);
      showTracking();
      toast(
        T(
          "Produit obtenu avec vos coupons en démo",
          "Product redeemed with your demo Coupons",
        ),
      );
    } catch (err) {
      $("#reward-error").textContent = err.message;
      e.target.disabled = false;
    } finally {
      couponsBusy = false;
    }
  };
}
document.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest("[data-coins],[data-reward]");
    if (!b) return;
    e.stopImmediatePropagation();
    if (drawer.open) drawer.close();
    if (b.dataset.reward) confirmReward(+b.dataset.reward);
    else b.dataset.coins === "credit" ? creditCoins() : showCoins();
  },
  true,
);
const couponsRegister = showRegister;
showRegister = function () {
  couponsRegister();
  $("#modal-content").insertAdjacentHTML(
    "afterbegin",
    `<button class="add account-coins-link" data-coins="wallet">${T("Mon portefeuille de coupons", "My coupons wallet")}</button>`,
  );
};
async function claimOrderCoins(o) {
  if (!customerProfile || o.coinCost || !o.buyerConfirmed) return;
  const amount = Math.round(o.items.reduce((n, i) => n + i.q * i.price, 0));
  try {
    await couponsAPI({ kind: "earn", reference: o.id, amount });
    o.coinsClaimed = true;
    toast(
      T(
        "Coupons ajoutés à votre portefeuille",
        "Coupons added to your wallet",
      ),
    );
    showTracking();
  } catch (e) {
    toast(e.message);
  }
}
document.removeEventListener("click", receiptHandler, true);
document.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest("[data-receipt]");
    if (!b) return;
    const o = orders.find((o) => o.id === b.dataset.receipt),
      wasConfirmed = o?.buyerConfirmed;
    receiptHandler(e);
    if (o && !wasConfirmed && o.buyerConfirmed) claimOrderCoins(o);
  },
  true,
);
const couponsTracking = showTracking;
showTracking = function () {
  couponsTracking();
  const host =
    activeRole === "buyer" ? $("#modal-content") : $("#role-content");
  host.querySelectorAll(".order-box").forEach((el, i) => {
    const o = orders[i];
    if (o?.coinCost)
      el.insertAdjacentHTML(
        "beforeend",
        `<p><b>${T("Payé avec ", "Paid with ")}${coinAmount(o.coinCost)}</b></p>`,
      );
    else if (o?.buyerConfirmed)
      el.insertAdjacentHTML(
        "beforeend",
        `<p>${T("Récompense : ", "Reward: ")}${coinAmount(Math.floor(o.items.reduce((n, x) => n + x.q * x.price, 0) / 2000))} · ${o.coinsClaimed ? T("Crédités", "Credited") : T("Créez votre compte ou réclamez vos coupons", "Create your account or claim your coupons")}</p>${!o.coinsClaimed ? `<button class="add" data-claim-coins="${o.id}">${T("Réclamer mes coupons", "Claim my Coupons")}</button>` : ""}`,
      );
  });
};
document.addEventListener(
  "click",
  (e) => {
    const b = e.target.closest("[data-claim-coins]");
    if (!b) return;
    e.stopImmediatePropagation();
    if (!customerProfile) {
      showRegister();
      return;
    }
    claimOrderCoins(orders.find((o) => o.id === b.dataset.claimCoins));
  },
  true,
);
faqItems.push([
  "Que sont les coupons ?",
  "What are Coupons?",
  "Des points de fidélité de démonstration : 1 coin gagné par 2 000 FC de produits reçus et confirmés. 1 coin vaut provisoirement 10 FC pour un échange de produit. Ouvrez Mes coupons pour consulter le solde, l’historique et la sélection de produits. Aucun retrait en argent.",
  "Demo loyalty points: earn 1 coin per FC 2,000 of received and confirmed products. Each coin provisionally represents FC 10 for product redemption. Open My coupons to see your balance, history and rewards. No cash withdrawals.",
]);
$("#home-faq").dataset.language = "";
applyLanguage();
