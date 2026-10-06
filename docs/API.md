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
| `/api/yavicoins`, `/api/faq-feedback`                                  | `coins.js`, `feedback.js` | Fidélité fictive et retours FAQ                     |
| `/api/delivery`                                                        | `delivery.js`             | Compatibilité avec l'ancien scénario isolé          |

Les requêtes JSON et multipart exigent les droits du compte, la bonne origine et, pour les transitions, la révision courante. Les prix et stocks sont relus côté serveur. Les détails exacts et des appels exécutables figurent dans `tests/independent.test.mjs`. Les comptes ne doivent pas pouvoir choisir leur identité serveur ni devenir admin par inscription.

## Double authentification

Les routes `mfa-status`, `mfa-setup`, `mfa-enable`, `mfa-challenge`, `mfa-verify`, `mfa-recovery` et `mfa-disable` sous `/api/auth/` sont détaillées dans [TWO_FACTOR.md](TWO_FACTOR.md). Le frontend doit gérer `requiresTwoFactor` avant de considérer la connexion terminée. Les connexions Google utilisent le même challenge.
