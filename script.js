// Point d’entrée : chargement ordonné des modules classiques du frontend.
// Chaque module garde sa portée globale et son ordre d’exécution original.
(async function startYaviya() {
  const modules = [
  "app.js",
  "country-data.js",
  "marketplace.js",
  "support.js",
  "customer.js",
  "delivery-roles.js",
  "promotions-dashboards.js",
  "enhancements.js",
  "yavicoins.js",
  "partner-campaigns.js",
  "popular-faq.js",
  "seller-plans.js",
  "seller-markets.js",
  "country-final.js",
  "mobile-nav.js",
  "search-photo-ratings.js",
  "language-top.js",
  "account-verification-flows.js",
  "commerce-guard.js",
  "shared-delivery.js",
  "profile-commerce.js",
  "pricing-benefits.js",
  "registration-categories.js",
  "courier-reviews.js",
  "mvp-final.js",
  "product-gallery.js",
  "shared-commerce.js"
];
  try {
    for (const name of modules) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'assets/js/' + name;
        script.async = false;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Chargement impossible : ' + name));
        document.body.appendChild(script);
      });
    }
  } catch (error) {
    console.error(error);
    const notice = document.createElement('p');
    notice.setAttribute('role', 'alert');
    notice.textContent = 'Impossible de charger YAVIYA. Vérifiez que le dossier assets est présent et utilisez le serveur local décrit dans README.md.';
    document.body.prepend(notice);
  }
})();
