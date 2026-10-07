textTranslations["Devenir partenaire YAVIYA"] = "Become a YAVIYA partner";
heroSlides.push(
  {
    img: "partner-payment.jpg",
    eyebrow: ["VODACOM · M-PESA", "VODACOM · M-PESA"],
    title: [
      "Le paiement mobile, à portée de main.",
      "Mobile payment, at your fingertips.",
    ],
    copy: [
      "Concept publicitaire : paiement M-Pesa en démonstration. Partenariat et activation à confirmer.",
      "Advertising concept: M-Pesa payment demonstration. Partnership and activation to be confirmed.",
    ],
    link: "index.html?info=payments",
    cta: ["Découvrir le paiement mobile", "Explore mobile payment"],
    tag: "VODACOM M-PESA · CONCEPT",
  },
  {
    img: "partner-logistics.jpg",
    eyebrow: ["PARTENAIRES LOGISTIQUES", "LOGISTICS PARTNERS"],
    title: ["Votre livraison prend la route.", "Your delivery is on its way."],
    copy: [
      "Un espace publicitaire pour les entreprises de logistique. Livraison estimée : 24 à 48 heures, parcours de démonstration.",
      "An advertising space for logistics companies. Estimated delivery: 24–48 hours, demonstration flow.",
    ],
    link: "index.html?info=logistics",
    cta: ["Découvrir la livraison", "Explore delivery"],
    tag: "PARTENAIRE LOGISTIQUE · DÉMO",
  },
  {
    img: "partner-benefits.jpg",
    eyebrow: ["YAVIYA BENEFITS", "YAVIYA BENEFITS"],
    title: ["Vos achats vous récompensent.", "Your shopping rewards you."],
    copy: [
      "Gagnez des coupons et échangez-les contre des produits de démonstration. Découvrez aussi les abonnements de livraison.",
      "Earn Coupons and redeem them for demonstration products. Explore delivery subscriptions too.",
    ],
    link: "index.html?info=benefits",
    cta: ["Découvrir mes avantages", "Explore my benefits"],
    tag: "YAVIYA BENEFITS",
  },
);
$("#home-ad-filter").insertAdjacentHTML(
  "beforeend",
  `<option value="payments">${T("Paiement & Mobile Money", "Payment & Mobile Money")}</option><option value="logistics">${T("Logistique", "Logistics")}</option><option value="benefits">YAVIYA Benefits</option>`,
);
filteredHomeAds = function () {
  return heroSlides.filter(
    (s, i) =>
      homeAdFilter === "all" ||
      (homeAdFilter === "catalog" && i === 0) ||
      (homeAdFilter === "daily" && i === 3) ||
      (homeAdFilter === "payments" && i === 4) ||
      (homeAdFilter === "logistics" && i === 5) ||
      (homeAdFilter === "benefits" && i === 6),
  );
};
drawHomeAd();
function showPartnership() {
  open(
    `<span class="eyebrow">${T("PARTENARIATS", "PARTNERSHIPS")}</span><h2>${T("Devenir partenaire YAVIYA", "Become a YAVIYA partner")}</h2><p>${T("Vous représentez une marque, une entreprise de livraison ou un prestataire de services ? Présentez-nous votre activité et le partenariat que vous souhaitez construire avec YAVIYA.", "Do you represent a brand, a delivery company or a service provider? Tell us about your business and the partnership you would like to build with YAVIYA.")}</p><p>${T("Indiquez le nom de votre entreprise, votre ville, vos coordonnées et votre proposition.", "Include your company name, city, contact details and proposal.")}</p><p><strong>${T("Contact partenariats", "Partnership contact")} :</strong> <a href="mailto:partenariat@yaviya.cd">partenariat@yaviya.cd</a></p><a class="primary" href="mailto:partenariat@yaviya.cd?subject=Proposition%20de%20partenariat%20YAVIYA">${T("Écrire à notre équipe", "Email our team")}</a>`,
  );
}
function showCampaignInfo(info) {
  if (info === "partnership") {
    showPartnership();
    return;
  }
  if (info === "payments")
    open(
      `<span class="eyebrow">VODACOM · M-PESA</span><h2>${T("Paiement Mobile Money", "Mobile Money payments")}</h2><p>${T("Le parcours YAVIYA propose M-Pesa, Orange Money, Airtel Money et Afrimoney, ainsi que la carte bancaire et le paiement à la livraison.", "The YAVIYA flow offers M-Pesa, Orange Money, Airtel Money and Afrimoney, alongside bank cards and cash on delivery.")}</p><p>${T("Dans la démonstration, le paiement anticipé est retenu en escrow simulé jusqu’à votre confirmation de réception. Aucun fonds réel n’est détenu.", "In the demonstration, prepaid funds are held in simulated escrow until you confirm receipt. No real funds are held.")}</p><p class="demo-note">${T("Concept de publicité ; aucun partenariat commercial avec Vodacom n’est confirmé. Aucun accès à votre compte M-Pesa.", "Advertising concept; no commercial partnership with Vodacom is confirmed. No access to your M-Pesa account.")}</p>`,
    );
  else if (info === "logistics") open(content.delivery);
  else if (info === "benefits")
    open(
      `<span class="eyebrow">YAVIYA BENEFITS</span><h2>${T("Les avantages de Mon Yaviya", "My Yaviya benefits")}</h2><div class="benefit-list"><section><h3>Coupons</h3><p>${T("Des points gagnés après confirmation de réception et échangeables contre des produits de démonstration.", "Points earned after receipt confirmation and redeemable for demo products.")}</p><button class="primary" data-coins="wallet">${T("Ouvrir mon portefeuille", "Open my wallet")}</button></section><section><h3>${T("Abonnements de livraison", "Delivery subscriptions")}</h3><p>${T("YAVIYA Prime : 250 000 FC/an, livraisons gratuites selon conditions, réductions exclusives, accès anticipé aux promotions, support prioritaire, offres partenaires et fidélité.", "YAVIYA Prime: FC 250,000/year, free deliveries subject to conditions, exclusive discounts, early promotion access, priority support, partner offers and loyalty.")}</p><button class="add" data-client="subscriptions">${T("Voir les abonnements", "View subscriptions")}</button></section><section><h3>${T("Confirmation de réception", "Receipt confirmation")}</h3><p>${T("Dans le parcours d’escrow simulé, le solde vendeur est libéré après votre confirmation de réception.", "In the simulated escrow flow, seller funds are released after you confirm receipt.")}</p><button class="add" data-action="tracking">${T("Mes commandes", "My orders")}</button></section></div>`,
    );
}
document.addEventListener(
  "click",
  (e) => {
    if (e.target.closest("[data-partnership]")) {
      e.preventDefault();
      showPartnership();
      return;
    }
    const a = e.target.closest("a[href]");
    if (!a) return;
    const u = new URL(a.href, location.href),
      info = u.searchParams.get("info");
    if (
      ["payments", "logistics", "benefits", "partnership"].includes(info) &&
      u.origin === location.origin
    ) {
      e.preventDefault();
      showCampaignInfo(info);
    }
  },
  true,
);
const info = new URL(location.href).searchParams.get("info");
if (info) showCampaignInfo(info);
