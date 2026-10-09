import "../frontend/styles/style.css";

export const metadata = {
  title: {
    default: "YAVIYA — Votre marché, à portée de main",
    template: "%s — YAVIYA",
  },
  description:
    "Découvrez YAVIYA, votre marketplace locale pour acheter, vendre et livrer en toute simplicité.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23f26a21'/%3E%3Cpath d='M8 8l8 10 8-10M16 18v8' fill='none' stroke='white' stroke-width='4'/%3E%3C/svg%3E",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
