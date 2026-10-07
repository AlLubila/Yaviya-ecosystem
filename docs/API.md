# Organisation des API

`api/handler.js` est le point d'entrée Vercel. `backend/application.js` identifie la session YAVIYA et remplace les en-têtes d'identité du client. Les gestionnaires de `backend/worker/` conservent les contrôles métier et l'isolation pays. Le paramètre `country=CG` sélectionne le marché Congo.

| Routes                                                                 | Gestionnaire              | Responsabilité                                      |
| ---------------------------------------------------------------------- | ------------------------- | --------------------------------------------------- |
| `/api/auth/signup`, `/login`, `/logout`, `/session` sous `/api/auth/`       | `backend/auth.js`         | Comptes et sessions indépendants                    |
| `/api/auth/google`, `/api/auth/google-callback`                        | `backend/google-auth.js`  | OAuth Google configuré côté serveur                 |
| `/api/customer`                                                        | `backend/worker/index.js` | Profil et identifiants courts YAVIYA                |
| `/api/verification`, `/reviews`, `/document` sous `/api/verification/` | `verification.js`         | Contrôles d'identité et validation admin            |
| `/api/marketplace`                                                     | `commerce.js`             | Catalogue, commandes et droits du compte            |
| `/api/marketplace/orders`, `/orders/action`                            | `commerce.js`             | Création idempotente et transitions de commande     |
| `/api/marketplace/courier`, `/messages`, `/proof`                      | `commerce.js`             | Missions, participants, échanges et preuve privée   |
| `/api/marketplace/payments`                                            | `commerce.js`             | Paiements non activés ; aucun débit simulé          |
| `/api/product-photos`, `/api/product-photos/image`                     | `product-photos.js`       | Photos et galerie de produit possédé                |
| `/api/delivery-reviews`                                                | `delivery-reviews.js`     | Notes après réception, livreur affecté côté serveur |
| `/api/seller-messages`, `/api/courier-messages`                        | Gestionnaires de messages | Discussions privées avec l'admin                    |
| `/api/coupons` (alias historique `/api/yavicoins`), `/api/faq-feedback`                                  | `coins.js`, `feedback.js` | Fidélité fictive et retours FAQ                     |
| `/api/delivery`                                                        | `delivery.js`             | Compatibilité avec l'ancien scénario isolé          |

Les requêtes JSON et multipart exigent les droits du compte, la bonne origine et, pour les transitions, la révision courante. Les prix et stocks sont relus côté serveur. Les détails exacts et des appels exécutables figurent dans `tests/independent.test.mjs`. Les comptes ne doivent pas pouvoir choisir leur identité serveur ni devenir admin par inscription.

## Double authentification

Les routes `mfa-status`, `mfa-setup`, `mfa-enable`, `mfa-challenge`, `mfa-verify`, `mfa-recovery` et `mfa-disable` sous `/api/auth/` sont détaillées dans [TWO_FACTOR.md](TWO_FACTOR.md). Le frontend doit gérer `requiresTwoFactor` avant de considérer la connexion terminée. Les connexions Google utilisent le même challenge.

## Classement et destinations

`/api/marketplace/catalogue` accepte une `subcategory` facultative parmi les sous-catégories de la famille choisie et la conserve. `/api/marketplace/orders` refuse toute destination RDC hors Kinshasa/Lubumbashi, même pour `hand` et `relay`. La source unique est `backend/data/market-config.json` ; voir [CATALOGUE_COVERAGE.md](CATALOGUE_COVERAGE.md).

## Statistiques produits (1.4.0)

- `GET /api/product-insights?country=CD&ids=1,2` : comptes acheteurs distincts des produits publics, réception confirmée, commandes annulées exclues. Maximum 100 IDs par appel. Aucun identifiant d’acheteur ni de visiteur n’est exposé.
- `POST /api/product-insights/view?country=CD` avec `{ "productId": 1 }` : consultation d’une fiche publique, origine identique obligatoire. Une consultation par compte ou navigateur, produit et tranche de 30 minutes ; propriétaire et admin exclus. Cookie HttpOnly `yaviya_visitor` pour les visiteurs non connectés, seul son SHA-256 est enregistré. Un compte/navigateur peut enregistrer au maximum 100 consultations dans une tranche. Cette mesure représente des identifiants distincts, pas une certification de personnes physiques.
- `GET /api/product-insights/report?country=CD&period=30&sellerId=1` : agrégats privés. Un vendeur validé accède uniquement à ses propres boutiques du marché courant ; l’admin accède à tous les produits, avec `country=ALL` pour centraliser les deux marchés. Périodes : `7`, `30`, `quarter` (90 jours), `semester` (180 jours), `year` (365 jours), `all`.

Le rapport présente visiteurs distincts, consultations, acheteurs distincts, commandes avec réception confirmée et quantités reçues. Les achats sont filtrés par date de création de commande ; les vues par date de consultation. Les totaux distincts ne sont pas des sommes de lignes : un compte achetant plusieurs produits ou dans les deux marchés ne compte qu’une fois dans le total global.

Appliquer **`0015_product_insights.sql`** avec `npm run db:migrate` sur la base cible avant d’activer ces endpoints. Ces fonctions nécessitent une base persistante configurée, comme le reste du backend. La compilation frontend ne lance pas les migrations de production. Une erreur serveur affiche « données indisponibles », jamais un faux compteur à zéro.
