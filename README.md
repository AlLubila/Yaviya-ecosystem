# YAVIYA — Démo frontend et backend

Code de la démonstration YAVIYA, organisé pour être repris par un développeur et déposé sur GitHub. Version exportée le 2 octobre 2026 depuis le commit `20840d6575688698a9b6ca914c7e2337cace5a27` du site.

## Lancer la démo

Prérequis : **Node.js 22.13 ou supérieur**, de préférence Node.js 24, et npm.

```bash
npm ci
npm run dev
```

Ouvrir **http://127.0.0.1:3000**. Les boutons en haut donnent accès aux vues **Acheteur, Vendeur, Livreur et Admin**. Le marché RDC utilise `/index.html` ; le marché République du Congo utilise `/congo.html?country=CG`.

Le serveur local crée un compte de connexion fictif pour explorer les quatre vues. Un compte vendeur ou livreur inscrit doit toujours soumettre son identité et être validé manuellement dans l’administration. Utiliser des informations et des documents fictifs pour les essais.

La base SQLite et les fichiers privés sont créés dans `.local/`, exclu de Git. Les migrations sont appliquées automatiquement au premier démarrage. Le panier reste lié à la visite ; profils, messages, commandes et évaluations sont sauvegardés.

## Organisation

| Dossier | Contenu |
| --- | --- |
| `frontend/pages/` | Pages HTML : RDC, Congo, aide, publicité, confidentialité |
| `frontend/src/` | JavaScript réparti par fonction : catalogue, compte, livraison, navigation, marchés, abonnements, fidélité |
| `frontend/styles/` | Feuille de styles responsive |
| `frontend/assets/images/` | Images du catalogue et des campagnes |
| `backend/src/` | Worker, routeur HTTP et gestionnaires API |
| `backend/database/schema/` | Schéma Drizzle de la base |
| `backend/database/migrations/` | Migrations SQL et historique Drizzle |
| `scripts/` | Compilation, serveur local, adaptateurs SQLite/fichiers et vérifications |
| `tests/` | Tests du backend, des accès privés et des évaluations |
| `docs/` | Description de chaque fichier, architecture, API et transfert GitHub |
| `.github/workflows/` | Vérifications automatiques à chaque push et pull request |

Voir [le rôle de chaque fichier](docs/FILES.md), [l’architecture](docs/ARCHITECTURE.md), [les API](docs/API.md) et [la publication GitHub](docs/GITHUB.md).

## Fonctions incluses

- Catalogue multi-vendeurs, catégories et sous-catégories en plein écran, recherche et filtres, tri par prix et notes illustratives.
- Recherche par photo approximative, favoris, panier multi-vendeurs et achat immédiat.
- Inscription par étapes, téléphone requis, confidentialité, identité vendeur/livreur, option petite entreprise sans RCCM, validation manuelle.
- Abonnements vendeurs Free, Plus, Premium, Business et Enterprise ; YAVIYA Prime ; gestion de commissions dans le scénario de démo.
- Suivi partagé entre les quatre vues d’un compte : validation vendeur, disponibilité livreur, préparation, récupération, photo privée et confirmation acheteur.
- Tableaux vendeurs/admin et espace livreur avec historique filtrable et évaluations.
- Discussions privées vendeur/admin et livreur/admin ; notes après livraison pour chaque vendeur et le livreur.
- Yavicoins, FAQ pliables et retours clients, assistant automatique, campagnes partenaires, versions français/anglais et deux marchés.

## Ce qui reste une démonstration

Le backend fourni fonctionne pour les profils, documents, messages, scénarios de commande, FAQ, Yavicoins et évaluations. Les paiements Mobile Money/carte, l’escrow financier, les reversements, la facturation des abonnements et les transports réels **ne sont pas intégrés**. Les données initiales de catalogue, notes produits et campagnes sont illustratives.

Les commandes sont partagées entre les quatre vues **du même compte de connexion** et séparées par pays. Elles ne constituent pas encore une affectation opérationnelle entre de vrais comptes acheteurs, vendeurs et livreurs. Les discussions privées, elles, utilisent des comptes enregistrés distincts.

Le code original utilise JavaScript classique et des variables globales ; l’ordre des scripts dans les pages est conservé. Cette livraison sépare et rend les sources lisibles sans convertir le produit en React/Next.js.

## Commandes

```bash
npm run build     # Produit dist/, frontend et backend assemblés
npm start         # Sert un build existant en local
npm run check     # Vérifie la syntaxe et les références d’assets
npm test          # Tests fonctionnels du backend
npm run db:generate # Génère une migration après modification du schéma
```

`.env.example` décrit les réglages locaux. Pour les charger avec Node.js :

```bash
node --env-file=.env.example scripts/dev.mjs
```

## Hébergement et accès

Le backend original cible les interfaces **Cloudflare Workers / D1 / R2**. Le serveur Node fourni est un adaptateur **local uniquement**. Il écoute sur `127.0.0.1`, injecte une identité fictive et n’est pas un serveur d’authentification de production.

Avant tout hébergement indépendant, ajouter un système d’authentification fiable, des sessions et une passerelle qui définit les en-têtes d’identité. Ne pas accepter des en-têtes d’identité envoyés par un navigateur sur une API publique. Les identifiants, jetons, bases et documents privés du site hébergé ne sont pas inclus dans cet export.

Aucune licence libre n’est accordée automatiquement par cet export. Choisir une licence avec le propriétaire du projet avant toute diffusion publique ; vérifier aussi les droits des images avant réutilisation commerciale.
