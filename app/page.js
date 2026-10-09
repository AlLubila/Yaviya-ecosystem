import LegacyPage from "./legacy-page";
import { marketplaceScripts } from "./script-sets";

export const metadata = {
  title: "YAVIYA — Votre marché, à portée de main",
  description:
    "Découvrez YAVIYA, votre future marketplace à Kinshasa. Mode, high-tech et maison, réunis au même endroit.",
};

export default function HomePage() {
  return <LegacyPage file="index.html" scripts={marketplaceScripts} />;
}
