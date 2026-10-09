import LegacyPage from "../legacy-page";
import { marketplaceScripts } from "../script-sets";

export const metadata = {
  title: "République du Congo",
  description:
    "Découvrez YAVIYA, votre future marketplace à Brazzaville. Mode, high-tech et maison, réunis au même endroit.",
};

export default function CongoPage() {
  return <LegacyPage file="congo.html" scripts={marketplaceScripts} />;
}
