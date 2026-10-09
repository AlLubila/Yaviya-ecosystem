import LegacyPage from "../legacy-page";

export const metadata = { title: "Confidentialité" };

export default function PrivacyPage() {
  return (
    <LegacyPage
      file="confidentialite.html"
      scripts={["mobile-nav.js", "language-top.js?v=20261008"]}
    />
  );
}
