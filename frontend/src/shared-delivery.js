let courierAvailable = false,
  deliveryRevision = 0,
  deliveryReady = false,
  deliverySaving = false,
  lastDeliverySnapshot = null;
const deliveryStatusBar = document.createElement("p");
deliveryStatusBar.className = "delivery-sync-bar";
deliveryStatusBar.setAttribute("role", "status");
document.querySelector(".demo-role-bar").after(deliveryStatusBar);
function allSellersAccepted(o) {
  return o.items.every((i) => o.sellerAccepted?.[i.seller] === true);
}
function sharedDeliveryLabel(o) {
  return o.cancelled
    ? T("Commande refusée par un vendeur", "Order declined by a seller")
    : o.buyerConfirmed
      ? T("Réception confirmée par l’acheteur", "Receipt confirmed by buyer")
      : o.step === 3
        ? T(
            "Livré · photo reçue · réception à confirmer",
            "Delivered · photo received · awaiting receipt confirmation",
          )
        : o.courierStatus === "collected"
          ? T("En cours de livraison", "Out for delivery")
          : o.courierStatus === "accepted"
            ? T(
                "Mission acceptée par le livreur",
                "Assignment accepted by courier",
              )
            : o.assignedCourier
              ? T(
                  "Mission affectée à un livreur disponible",
                  "Assigned to an available courier",
                )
              : allSellersAccepted(o)
                ? T(
                    "Acceptée par les vendeurs · attente d’un livreur disponible",
                    "Accepted by sellers · awaiting available courier",
                  )
                : T(
                    "En attente de validation manuelle du vendeur",
                    "Awaiting manual seller acceptance",
                  );
}
function proofMarkup(o) {
  return o.deliveryProof
    ? `<div class="delivery-proof"><b>${T("Preuve de livraison", "Delivery proof")}</b><a href="/api/demo-delivery/proof?orderId=${encodeURIComponent(o.id)}&country=${window.YAVIYA_COUNTRY}" target="_blank" rel="noopener"><img src="/api/demo-delivery/proof?orderId=${encodeURIComponent(o.id)}&country=${window.YAVIYA_COUNTRY}" alt="${T("Photo de preuve de livraison", "Photo delivery proof")}"></a><small>${new Date(o.deliveryProof.at).toLocaleString()}</small></div>`
    : "";
}
function sharedOrderMarkup(o) {
  return `<article class="shared-order" data-shared-order="${o.id}"><h3>${esc(o.id)}</h3><p class="verification-status">${sharedDeliveryLabel(o)}</p><p>${esc(o.city)} · ${esc(o.commune || "")} · ${money(o.total)}</p><p>${o.recipient ? esc(o.recipient.name) + " · " + esc(o.recipient.phone) : ""}${o.address ? " · " + esc(o.address) : ""}</p><p>${deliverySummary(o)}</p><p>${o.items.map((i) => esc(i.title) + " × " + i.q).join(", ")}</p><div class="seller-acceptance">${[...new Set(o.items.map((i) => i.seller))].map((id) => `<span>${esc(shops.find((s) => s.id === id)?.name || T("Boutique", "Shop") + " " + id)} : ${o.sellerAccepted?.[id] ? T("Acceptée", "Accepted") : T("À valider", "Awaiting acceptance")}${o.sellerSteps[id] >= 1 ? " · " + T("Colis prêt", "Parcel ready") : ""}</span>`).join("")}</div>${proofMarkup(o)}${o.coinCost ? `<p>${T("Payé en Coupons : ", "Paid with Coupons: ")}${o.coinCost}</p>` : ""}<details><summary>${T("Historique du suivi", "Tracking history")}</summary><ul>${o.events.map((e) => `<li>${esc(e)}</li>`).join("")}</ul></details></article>`;
}
function setSyncStatus(text, error = false) {
  deliveryStatusBar.textContent = text;
  deliveryStatusBar.classList.toggle("error", error);
}
async function deliveryAPI(body, path = "") {
  const r = await fetch("/api/demo-delivery" + path, {
    method: body ? "POST" : "GET",
    headers:
      body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {},
    body:
      body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const value = await r.json();
  if (!r.ok) {
    const e = Error(
      value.error ||
        T(
          "Suivi indisponible. Réessayez.",
          "Tracking unavailable. Please retry.",
        ),
    );
    e.status = r.status;
    throw e;
  }
  return value;
}
function normalizeDeliveryOrder(o) {
  if (!o.sellerAccepted)
    o.sellerAccepted = Object.fromEntries(
      o.items.map((i) => [i.seller, false]),
    );
  if (o.assignedCourier === undefined) o.assignedCourier = null;
  if (o.requestedCourier === undefined)
    o.requestedCourier = o.delivery?.courier || null;
  if (o.cancelled === undefined) o.cancelled = false;
  if (!o.courierStatus) o.courierStatus = "unassigned";
  return o;
}
function scenarioSnapshot() {
  orders.forEach(normalizeDeliveryOrder);
  return {
    orders: JSON.parse(JSON.stringify(orders)),
    courierAvailable,
    notices: JSON.parse(JSON.stringify(noticeEvents.slice(0, 250))),
  };
}
function applyDelivery(data, redraw = true) {
  deliveryRevision = data.revision;
  courierAvailable = data.snapshot.courierAvailable;
  orders.splice(0, orders.length, ...data.snapshot.orders);
  noticeEvents.splice(0, noticeEvents.length, ...data.snapshot.notices);
  lastDeliverySnapshot = JSON.parse(JSON.stringify(data.snapshot));
  deliveryReady = true;
  renderNoticeBadge();
  setSyncStatus(
    T("Suivi partagé à jour · ", "Shared tracking up to date · ") +
      new Date().toLocaleTimeString(),
  );
  if (redraw) redrawDeliveryViews();
}
function redrawDeliveryViews() {
  if (
    activeRole === "courier" &&
    !$("#delivery-proof-form input[type=file]")?.files?.length
  )
    showCourier();
  if (activeRole === "seller" && !$("#product-form")) showSeller();
  if (activeRole === "admin") renderAdminDelivery();
  if (activeRole === "buyer" && $("#modal-content [data-shared-order]"))
    showTracking();
}
async function saveDelivery() {
  if (!deliveryReady || deliverySaving) {
    toast(
      T(
        "Attendez la synchronisation avant de continuer.",
        "Wait for synchronization before continuing.",
      ),
    );
    return false;
  }
  deliverySaving = true;
  setSyncStatus(T("Enregistrement du suivi…", "Saving tracking…"));
  try {
    const result = await deliveryAPI({
      revision: deliveryRevision,
      snapshot: scenarioSnapshot(),
    });
    applyDelivery(result);
    return true;
  } catch (e) {
    setSyncStatus(
      T("Le suivi n’a pas été enregistré : ", "Tracking was not saved: ") +
        e.message,
      true,
    );
    if (e.status === 409) {
      try {
        applyDelivery(await deliveryAPI());
      } catch {}
    } else if (lastDeliverySnapshot) {
      applyDelivery({
        snapshot: lastDeliverySnapshot,
        revision: deliveryRevision,
      });
      setSyncStatus(
        T(
          "Enregistrement impossible. Réessayez avant de continuer.",
          "Unable to save. Retry before continuing.",
        ),
        true,
      );
    }
    return false;
  } finally {
    deliverySaving = false;
  }
}
function assignAvailableCourier() {
  if (!courierAvailable) return;
  for (const o of orders)
    if (
      !o.cancelled &&
      allSellersAccepted(o) &&
      o.requestedCourier === "yaviya" &&
      !o.assignedCourier
    ) {
      o.assignedCourier = "yaviya";
      o.courierStatus = "assigned";
      o.events.push(
        T(
          "Mission affectée au livreur disponible",
          "Assignment sent to available courier",
        ) +
          " — " +
          new Date().toLocaleTimeString(),
      );
      notice(
        "courier",
        T("Nouvelle mission", "New assignment"),
        o.id,
        "yaviya",
      );
    }
}
function broadcastDelivery(o, message) {
  o.events.push(message + " — " + new Date().toLocaleTimeString());
  notice(
    "buyer",
    T("Suivi de commande", "Order tracking"),
    o.id + " · " + message,
  );
  notice(
    "admin",
    T("Suivi de livraison", "Delivery tracking"),
    o.id + " · " + message,
  );
  [...new Set(o.items.map((i) => i.seller))].forEach((id) =>
    notice(
      "seller",
      T("Suivi de commande", "Order tracking"),
      o.id + " · " + message,
      id,
    ),
  );
  if (o.assignedCourier)
    notice(
      "courier",
      T("Suivi de mission", "Assignment tracking"),
      o.id + " · " + message,
      o.assignedCourier,
    );
}
const sharedCheckout = showCheckout;
showCheckout = function (selection) {
  if (!deliveryReady) {
    toast(
      T(
        "Le suivi se charge. Réessayez dans un instant.",
        "Tracking is loading. Please retry shortly.",
      ),
    );
    return;
  }
  sharedCheckout(selection);
  const form = $("#checkout-form");
  if (!form) return;
  const previous = form.onsubmit;
  form.onsubmit = async (e) => {
    if (deliverySaving) {
      e.preventDefault();
      return;
    }
    const before = orders.length;
    previous(e);
    if (orders.length > before) {
      const o = orders[0];
      o.sellerAccepted = Object.fromEntries(
        o.items.map((i) => [i.seller, false]),
      );
      o.requestedCourier = o.delivery?.courier || null;
      o.assignedCourier = null;
      o.courierStatus = "unassigned";
      o.cancelled = false;
      noticeEvents.splice(
        0,
        noticeEvents.length,
        ...noticeEvents.filter(
          (n) => !(n.role === "courier" && n.message?.includes(o.id)),
        ),
      );
      broadcastDelivery(
        o,
        T(
          "Commande reçue, en attente de validation du vendeur",
          "Order received, awaiting seller acceptance",
        ),
      );
      const saved = await saveDelivery();
      if (saved) showTracking();
    }
  };
};
const manualSeller = showSeller;
showSeller = function () {
  manualSeller();
  const panel = $('#role-content [data-dashboard-panel="orders"]');
  if (!panel) return;
  panel.innerHTML = `<h2>${T("Mes commandes · validation manuelle", "My orders · manual acceptance")}</h2>${
    sellerOrders(selectedSeller)
      .map(
        (o) =>
          `${sharedOrderMarkup(o)}${!o.cancelled && !o.sellerAccepted?.[selectedSeller] ? `<div class="manual-seller-actions"><button class="primary" data-seller-accept="${o.id}">${T("Accepter la commande", "Accept order")}</button><button class="add" data-seller-decline="${o.id}">${T("Refuser la commande", "Decline order")}</button></div>` : !o.cancelled && o.sellerSteps[selectedSeller] === 0 ? `<button class="primary" data-seller-prepare="${o.id}" ${!allSellersAccepted(o) ? "disabled" : ""}>${T("Confirmer le colis prêt", "Confirm parcel ready")}</button>` : !o.cancelled && !o.requestedCourier && o.step === 1 ? `<button class="primary" data-seller-handover="${o.id}">${T("Confirmer la remise au client ou au relais", "Confirm customer or relay handover")}</button>` : ""}`,
      )
      .join("") ||
    `<p>${T("Aucune commande pour cette boutique.", "No orders for this shop.")}</p>`
  }`;
};
showCourier = function () {
  if (!courierCanWork()) {
    open(
      `<h2>${T("Mon espace livreur", "My courier area")}</h2><p class="verification-status">${esc(verificationStatus())}</p><button class="primary" data-client="register">${T("Compléter mon identité", "Complete identity verification")}</button>`,
    );
    return;
  }
  const mine = orders.filter(
    (o) => o.assignedCourier === "yaviya" && !o.cancelled && o.step < 3,
  );
  const waiting = orders.filter(
    (o) =>
      !o.cancelled &&
      allSellersAccepted(o) &&
      o.requestedCourier === "yaviya" &&
      !o.assignedCourier,
  ).length;
  open(
    `<h2>${T("Tableau de bord livreur", "Courier dashboard")}</h2><div class="courier-availability"><label><input type="checkbox" id="courier-available" ${courierAvailable ? "checked" : ""} ${!deliveryReady || deliverySaving ? "disabled" : ""}>${T("Je suis disponible pour recevoir des commandes", "I am available to receive orders")}</label><p>${courierAvailable ? T("Disponible · les nouvelles missions peuvent vous être affectées", "Available · new assignments can be sent to you") : T("Indisponible · aucune nouvelle mission ne vous est affectée", "Unavailable · no new assignments will be sent to you")}</p><small>${T("Les missions déjà acceptées restent à terminer.", "Already accepted assignments still need to be completed.")}</small>${waiting ? `<p>${waiting} ${T("commande(s) attendent un livreur disponible", "order(s) await an available courier")}</p>` : ""}</div><p class="demo-note">${T("Simulation partagée entre les quatre vues de votre compte. Aucun transport réel.", "Shared simulation across the four views of your account. No real transport.")}</p><div class="courier-missions">${
      mine
        .map((o) => {
          const status = o.courierStatus || "assigned",
            prepared = Object.values(o.sellerSteps).every((n) => n >= 1);
          return `${sharedOrderMarkup(o)}${o.cancelled ? "" : status === "assigned" ? `<button class="primary" data-courier-accept="${o.id}">${T("Accepter la mission", "Accept assignment")}</button>` : status === "accepted" ? `<button class="primary" data-courier-collect="${o.id}" ${prepared ? "" : "disabled"}>${T("Confirmer la récupération", "Confirm collection")}</button>${prepared ? "" : `<p>${T("Attendre que chaque vendeur confirme son colis prêt.", "Wait until each seller confirms their parcel is ready.")}</p>`}` : status === "collected" ? `<button class="primary" data-proof-order="${o.id}">${T("Ajouter la photo et confirmer la livraison", "Add photo and confirm delivery")}</button>` : ""}`;
        })
        .join("") ||
      `<p>${T("Aucune mission affectée.", "No assignments received.")}</p>`
    }</div>`,
  );
  $("#courier-available").onchange = async (e) => {
    if (deliverySaving) return;
    courierAvailable = e.target.checked;
    assignAvailableCourier();
    await saveDelivery();
  };
  renderNoticeBadge();
};
showTracking = function () {
  open(
    `<h2>${T("Mes commandes · suivi à jour", "My orders · current tracking")}</h2><p class="demo-note">${T("Même suivi dans les espaces acheteur, vendeur, livreur et admin. La photo du livreur ne remplace pas votre confirmation de réception pour l’escrow.", "The same tracking appears in buyer, seller, courier and admin areas. The courier photo does not replace your receipt confirmation for escrow.")}</p>${orders.map((o) => `${sharedOrderMarkup(o)}<p><b>${esc(o.paymentState || "")}</b></p>${o.buyerConfirmed && !o.coinCost ? `<p>${T("Coupons : ", "Coupons: ")}${Math.floor(o.items.reduce((n, i) => n + i.price * i.q, 0) / 2000)} · ${o.coinsClaimed ? T("Crédités", "Credited") : T("À réclamer", "Claim available")}</p>${!o.coinsClaimed ? `<button class="add" data-claim-coins="${o.id}">${T("Réclamer mes coupons", "Claim my Coupons")}</button>` : ""}` : ""}${o.step === 3 && !o.cancelled && !o.buyerConfirmed ? `<button class="primary" data-receipt="${o.id}">${T("Confirmer la réception", "Confirm receipt")}</button>` : o.buyerConfirmed ? `<p>${T("Réception confirmée · fonds libérés en démo", "Receipt confirmed · demo funds released")}</p>` : ""}`).join("") || `<p>${T("Aucune commande.", "No orders.")}</p>`}`,
  );
};
function renderAdminDelivery() {
  const panel = $('#role-content [data-dashboard-panel="overview"]');
  if (!panel) return;
  panel.querySelector("#admin-delivery-tracking")?.remove();
  panel.insertAdjacentHTML(
    "beforeend",
    `<section id="admin-delivery-tracking"><h2>${T("Suivi partagé des livraisons", "Shared delivery tracking")}</h2><p>${courierAvailable ? T("YAVIYA Courier : disponible", "YAVIYA Courier: available") : T("YAVIYA Courier : indisponible", "YAVIYA Courier: unavailable")}</p>${orders.map(sharedOrderMarkup).join("") || `<p>${T("Aucune livraison.", "No deliveries.")}</p>`}</section>`,
  );
}
const sharedAdmin = showAdmin;
showAdmin = function () {
  sharedAdmin();
  renderAdminDelivery();
};
function showProofForm(o) {
  open(
    `<h2>${T("Preuve de livraison", "Delivery proof")} · ${esc(o.id)}</h2><form id="delivery-proof-form"><label>${T("Photo de livraison *", "Delivery photo *")}<input type="file" name="photo" accept="image/jpeg,image/png" capture="environment" required></label><div id="proof-preview"></div><p class="demo-note">${T("JPG ou PNG, maximum 8 Mo. Photo privée, visible dans les quatre vues de votre scénario de démo. Évitez de photographier une pièce d’identité ou des personnes sans leur accord.", "JPG or PNG, maximum 8 MB. Private photo, visible in the four views of your demo scenario. Avoid photographing identity documents or people without permission.")}</p><label class="privacy-consent"><input type="checkbox" name="delivered" required>${T("Je confirme avoir remis le colis au destinataire. *", "I confirm the parcel was handed to the recipient. *")}</label><button class="primary">${T("Envoyer la preuve et confirmer la livraison", "Send proof and confirm delivery")}</button><p id="proof-error" role="alert"></p></form>`,
  );
  const form = $("#delivery-proof-form");
  let previewUrl;
  form.elements.photo.onchange = (e) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const f = e.target.files[0];
    if (f) {
      previewUrl = URL.createObjectURL(f);
      $("#proof-preview").innerHTML =
        `<img src="${previewUrl}" alt="${T("Aperçu de la preuve", "Proof preview")}">`;
    }
  };
  form.onsubmit = async (e) => {
    e.preventDefault();
    if (deliverySaving) return;
    const photo = form.elements.photo.files[0];
    if (!photo || !form.elements.delivered.checked) {
      $("#proof-error").textContent = T(
        "Ajoutez une photo et confirmez la remise.",
        "Add a photo and confirm handover.",
      );
      return;
    }
    const fd = new FormData();
    fd.set("photo", photo);
    fd.set("orderId", o.id);
    fd.set("revision", deliveryRevision);
    fd.set("delivered", "true");
    deliverySaving = true;
    form.querySelector("button").disabled = true;
    try {
      const result = await deliveryAPI(fd, "/proof");
      applyDelivery(result, false);
      const updated = orders.find((x) => x.id === o.id);
      broadcastDelivery(
        updated,
        T("Livraison confirmée avec photo", "Delivery confirmed with photo"),
      );
      deliverySaving = false;
      await saveDelivery();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      showCourier();
    } catch (err) {
      $("#proof-error").textContent = err.message;
      form.querySelector("button").disabled = false;
    } finally {
      deliverySaving = false;
    }
  };
}
window.addEventListener(
  "click",
  async (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const id =
      b.dataset.sellerAccept ||
      b.dataset.sellerDecline ||
      b.dataset.sellerPrepare ||
      b.dataset.sellerHandover ||
      b.dataset.courierAccept ||
      b.dataset.courierCollect ||
      b.dataset.proofOrder;
    if (id) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (!deliveryReady || deliverySaving) return;
      const o = orders.find((x) => x.id === id);
      if (!o || o.cancelled) return;
      const sellerAction =
        b.dataset.sellerAccept ||
        b.dataset.sellerDecline ||
        b.dataset.sellerPrepare ||
        b.dataset.sellerHandover;
      if (sellerAction) {
        if (
          activeRole !== "seller" ||
          !ownedSellerIds().includes(selectedSeller) ||
          !o.items.some((i) => i.seller === selectedSeller)
        )
          return;
        if (b.dataset.sellerAccept) {
          o.sellerAccepted[selectedSeller] = true;
          broadcastDelivery(
            o,
            T(
              "Commande acceptée manuellement par ",
              "Order manually accepted by ",
            ) + shops.find((s) => s.id === selectedSeller).name,
          );
          assignAvailableCourier();
        } else if (b.dataset.sellerDecline) {
          o.cancelled = true;
          o.assignedCourier = null;
          broadcastDelivery(
            o,
            T("Commande refusée par le vendeur", "Order declined by seller"),
          );
        } else if (b.dataset.sellerHandover) {
          if (o.requestedCourier || o.step !== 1 || !allSellersAccepted(o))
            return;
          Object.keys(o.sellerSteps).forEach((id) => (o.sellerSteps[id] = 3));
          o.step = 3;
          broadcastDelivery(
            o,
            T(
              "Remise au client ou au relais confirmée",
              "Customer or relay handover confirmed",
            ),
          );
        } else {
          if (!allSellersAccepted(o)) return;
          o.sellerSteps[selectedSeller] = 1;
          o.step = Math.min(...Object.values(o.sellerSteps));
          broadcastDelivery(
            o,
            T(
              "Le vendeur confirme le colis prêt",
              "Seller confirms parcel ready",
            ),
          );
        }
      } else {
        if (
          activeRole !== "courier" ||
          !courierCanWork() ||
          o.assignedCourier !== "yaviya"
        )
          return;
        if (b.dataset.proofOrder) {
          if (o.courierStatus === "collected") showProofForm(o);
          return;
        }
        if (b.dataset.courierAccept && o.courierStatus === "assigned") {
          o.courierStatus = "accepted";
          broadcastDelivery(
            o,
            T(
              "Mission acceptée par le livreur",
              "Assignment accepted by courier",
            ),
          );
        } else if (
          b.dataset.courierCollect &&
          o.courierStatus === "accepted" &&
          Object.values(o.sellerSteps).every((n) => n >= 1)
        ) {
          o.courierStatus = "collected";
          o.step = 2;
          Object.keys(o.sellerSteps).forEach((id) => (o.sellerSteps[id] = 2));
          broadcastDelivery(
            o,
            T(
              "Colis récupéré · en cours de livraison",
              "Parcel collected · out for delivery",
            ),
          );
        } else return;
      }
      await saveDelivery();
      return;
    }
    // Prevent earlier demo handlers from bypassing manual acceptance and photo proof.
    if (b.dataset.advance || b.dataset.courierOrder) {
      e.preventDefault();
      e.stopImmediatePropagation();
      toast(
        T(
          "Utilisez la validation manuelle et la preuve photo.",
          "Use manual acceptance and photo proof.",
        ),
      );
    }
    if (b.dataset.receipt) {
      if (deliverySaving || !deliveryReady) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      const o = orders.find((o) => o.id === b.dataset.receipt);
      if (
        !o ||
        o.cancelled ||
        o.step !== 3 ||
        (o.delivery?.courier && !o.deliveryProof)
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      setTimeout(async () => {
        broadcastDelivery(
          o,
          T("Réception confirmée par l’acheteur", "Receipt confirmed by buyer"),
        );
        await saveDelivery();
      }, 0);
    }
  },
  true,
);
let deliveryPollBusy = false;
async function pollDelivery() {
  if (window.YAVIYA_SHARED_COMMERCE) return;
  if (deliverySaving || deliveryPollBusy) return;
  deliveryPollBusy = true;
  try {
    const data = await deliveryAPI();
    if (!deliveryReady || data.revision !== deliveryRevision) {
      const previous = orders.map((o) => [o.id, sharedDeliveryLabel(o)]);
      applyDelivery(data);
      for (const [id, status] of previous) {
        const o = orders.find((o) => o.id === id);
        if (o && sharedDeliveryLabel(o) !== status)
          toast(T("Suivi mis à jour : ", "Tracking updated: ") + id);
      }
    }
  } catch {
    setSyncStatus(
      T(
        "Synchronisation indisponible. Le suivi sera réessayé automatiquement.",
        "Synchronization unavailable. Tracking will retry automatically.",
      ),
      true,
    );
  } finally {
    deliveryPollBusy = false;
  }
}
pollDelivery();
setInterval(pollDelivery, 3000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) pollDelivery();
});
if (activeRole === "admin") renderAdminDelivery();

const sharedConfirmReward = confirmReward;
confirmReward = function (id) {
  sharedConfirmReward(id);
  const button = $("#redeem-confirm");
  if (!button) return;
  const previous = button.onclick;
  button.onclick = async (e) => {
    const count = orders.length;
    await previous(e);
    if (orders.length > count) {
      normalizeDeliveryOrder(orders[0]);
      await saveDelivery();
      showTracking();
    }
  };
};
const sharedClaimCoins = claimOrderCoins;
claimOrderCoins = async function (o) {
  await sharedClaimCoins(o);
  if (o.coinsClaimed) {
    const current = orders.find((x) => x.id === o.id);
    if (current) current.coinsClaimed = true;
    if (!deliverySaving) await saveDelivery();
  }
};
