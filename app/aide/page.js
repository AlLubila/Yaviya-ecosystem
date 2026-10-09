import LegacyPage from "../legacy-page";

export const metadata = {
  title: "Centre d’aide",
  description: "Retrouvez les réponses aux questions fréquentes sur YAVIYA.",
};

export default function HelpPage() {
  return (
    <LegacyPage
      file="aide.html"
      scripts={[
        "country-bootstrap.js",
        "support.js",
        "popular-faq.js",
        "country-final.js",
        "mobile-nav.js",
        "language-top.js?v=20261008",
      ]}
    />
  );
}
