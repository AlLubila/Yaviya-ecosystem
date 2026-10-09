import LegacyPage from "../legacy-page";

export const metadata = {
  title: "Publicités & offres",
  description: "Découvrez les campagnes et promotions de démonstration YAVIYA.",
};

export default function AdvertisingPage() {
  return (
    <LegacyPage
      file="publicite.html"
      scripts={[
        "country-bootstrap.js",
        "advertising.js",
        "country-final.js",
        "mobile-nav.js",
        "language-top.js?v=20261008",
      ]}
    />
  );
}
