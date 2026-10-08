# Rôle de chaque fichier

Les sources de la version complète sont classées par fonction. Les scripts frontend restent classiques et leur ordre est conservé dans les pages. Le build aplatit les chemins publics ; modifier les sources, pas dist. Aucun secret ni donnée utilisateur hébergée n’est exporté.

| Fichier                                                  | Rôle                                                                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `.env.example`                                           | Variables à configurer, sans valeurs secrètes.                                                             |
| `.github/workflows/ci.yml`                               | Tests et build automatiques GitHub Actions.                                                                |
| `.gitignore`                                             | Exclut dépendances, build, bases locales et secrets.                                                       |
| `MODIFICATIONS.md`                                       | Historique des corrections de la restauration indépendante.                                                |
| `README.md`                                              | Installation, activation distante et limites de la version complète.                                       |
| `docs/POSTGRESQL_SUPABASE.md`                            | Déploiement et sécurité de la cible PostgreSQL/Supabase.                                                    |
| `supabase/config.toml`                                   | Configuration locale de Supabase.                                                                          |
| `supabase/migrations/20261007231856_yaviya_core.sql`     | Schéma PostgreSQL, fonctions, RLS et données de référence.                                                  |
| `supabase/migrations/20261007231914_yaviya_storage.sql`  | Buckets et politiques des fichiers publics et privés.                                                       |
| `supabase/migrations/20261007232019_advisor_hardening.sql` | Index et durcissement issus des audits Supabase.                                                          |
| `supabase/migrations/20261007233426_runtime_postgres_adapter.sql` | Schéma privé de compatibilité pour l’API PostgreSQL.                                                |
| `supabase/migrations/20261007235502_runtime_fk_indexes.sql` | Index des relations du schéma privé recommandés par l’audit.                                             |
| `tests/postgresql-schema.test.mjs`                       | Contrôle des domaines métier, de la RLS et du stockage privé PostgreSQL.                                    |
| `YAVIYA-Backend-Documentation-v30.zip`                   | Archive préexistante conservée ; les fichiers de la nouvelle version sont désormais dépliés dans le dépôt. |
| `YAVIYA-Frontend-v30.zip`                                | Archive préexistante conservée ; les fichiers de la nouvelle version sont désormais dépliés dans le dépôt. |
| `YAVIYA-Projet-Complet-v30 (3).zip`                      | Archive préexistante conservée ; les fichiers de la nouvelle version sont désormais dépliés dans le dépôt. |
| `YAVIYA-Projet-Complet-v30.zip`                          | Archive préexistante conservée ; les fichiers de la nouvelle version sont désormais dépliés dans le dépôt. |
| `api/handler.js`                                         | Entrée HTTP Vercel et conversion vers Request/Response.                                                    |
| `backend/application.js`                                 | Session indépendante et identité injectée côté serveur.                                                    |
| `backend/auth.js`                                        | Comptes, mots de passe scrypt, sessions et limitation des tentatives.                                      |
| `backend/database.js`                                    | Adaptation D1 à PostgreSQL/SQLite et fichiers privés en base.                                              |
| `backend/google-auth.js`                                 | Google OAuth : état, PKCE, nonce, validation JWT et session.                                               |
| `backend/worker/account-identifiers.js`                  | Identifiants courts YVC, YVYS et YVYC.                                                                     |
| `backend/worker/assets.js`                               | Table vide : les fichiers publics sont servis séparément, sans images dupliquées dans l’API.               |
| `backend/worker/catalogue-seeds.js`                      | Catalogue, boutiques, communes et tarifs illustratifs initiaux.                                            |
| `backend/worker/coins.js`                                | Événements de fidélité fictive.                                                                            |
| `backend/worker/commerce.js`                             | Commandes partagées, prix/stock serveur, participants, transitions et règlements.                          |
| `backend/worker/courier-messages.js`                     | Discussions privées livreur/admin.                                                                         |
| `backend/worker/delivery-reviews.js`                     | Avis après réception, liés aux vendeurs et au livreur affecté.                                             |
| `backend/worker/delivery.js`                             | Compatibilité des anciens scénarios par compte.                                                            |
| `backend/worker/feedback.js`                             | Retours FAQ.                                                                                               |
| `backend/worker/index.js`                                | Entrée métier : routage, profils et isolation des marchés.                                                 |
| `backend/worker/product-photos.js`                       | Fichiers, droits et références des images produit.                                                         |
| `backend/worker/seller-messages.js`                      | Discussions privées vendeur/admin.                                                                         |
| `backend/worker/verification.js`                         | Dépôt de documents, approbation et propriété de boutique.                                                  |
| `database/migrations/0000_stormy_meteorite.sql`          | Migration 0000 : customers.                                                                                |
| `database/migrations/0001_neat_tana_nile.sql`            | Migration 0001 : coin_events.                                                                              |
| `database/migrations/0002_nappy_norrin_radd.sql`         | Migration 0002 : faq_feedback.                                                                             |
| `database/migrations/0003_military_katie_power.sql`      | Migration 0003 : customers.                                                                                |
| `database/migrations/0004_great_maestro.sql`             | Migration 0004 : admin_access, identity_checks, owned_stores.                                              |
| `database/migrations/0005_breezy_darkstar.sql`           | Migration 0005 : delivery_scenarios.                                                                       |
| `database/migrations/0006_omniscient_arclight.sql`       | Migration 0006 : seller_messages, customers, identity_checks.                                              |
| `database/migrations/0007_outgoing_wither.sql`           | Migration 0007 : courier_messages, delivery_reviews.                                                       |
| `database/migrations/0008_nice_captain_cross.sql`        | Migration 0008 : identity_checks.                                                                          |
| `database/migrations/0009_thankful_toad_men.sql`         | Migration 0009 : product_photos.                                                                           |
| `database/migrations/0010_left_cardiac.sql`              | Migration 0010 : market_couriers, market_messages, market_orders, market_participants, market_products.    |
| `database/migrations/0011_short_account_identifiers.sql` | Migration 0011 : account_identifiers.                                                                      |
| `database/migrations/0012_independent_auth.sql`          | Migration 0012 : auth_users, auth_sessions, auth_limits, private_files.                                    |
| `database/migrations/0013_google_auth.sql`               | Migration 0013 : google_identities, google_states.                                                         |
| `database/migrations/meta/0000_snapshot.json`            | Instantané du schéma pour la migration 0000.                                                               |
| `database/migrations/meta/0001_snapshot.json`            | Instantané du schéma pour la migration 0001.                                                               |
| `database/migrations/meta/0002_snapshot.json`            | Instantané du schéma pour la migration 0002.                                                               |
| `database/migrations/meta/0003_snapshot.json`            | Instantané du schéma pour la migration 0003.                                                               |
| `database/migrations/meta/0004_snapshot.json`            | Instantané du schéma pour la migration 0004.                                                               |
| `database/migrations/meta/0005_snapshot.json`            | Instantané du schéma pour la migration 0005.                                                               |
| `database/migrations/meta/0006_snapshot.json`            | Instantané du schéma pour la migration 0006.                                                               |
| `database/migrations/meta/0007_snapshot.json`            | Instantané du schéma pour la migration 0007.                                                               |
| `database/migrations/meta/0008_snapshot.json`            | Instantané du schéma pour la migration 0008.                                                               |
| `database/migrations/meta/0009_snapshot.json`            | Instantané du schéma pour la migration 0009.                                                               |
| `database/migrations/meta/0010_snapshot.json`            | Instantané du schéma pour la migration 0010.                                                               |
| `database/migrations/meta/0011_snapshot.json`            | Instantané du schéma pour la migration 0011.                                                               |
| `database/migrations/meta/_journal.json`                 | Journal ordonné Drizzle.                                                                                   |
| `docs/API.md`                                            | Routes et répartition des gestionnaires API.                                                               |
| `docs/DEMO.md`                                           | Lancement local et essais des quatre comptes distincts.                                                    |
| `docs/FILES.md`                                          | Ce document, rôle de chaque fichier livré.                                                                 |
| `frontend/assets/images/handbag.png`                     | Visuel illustratif local : handbag.                                                                        |
| `frontend/assets/images/headphones.png`                  | Visuel illustratif local : headphones.                                                                     |
| `frontend/assets/images/hero.png`                        | Visuel illustratif local : hero.                                                                           |
| `frontend/assets/images/partner-benefits.jpg`            | Visuel illustratif local : partenaire benefits.                                                            |
| `frontend/assets/images/partner-logistics.jpg`           | Visuel illustratif local : partenaire logistics.                                                           |
| `frontend/assets/images/partner-payment.jpg`             | Visuel illustratif local : partenaire payment.                                                             |
| `frontend/assets/images/product-blazer.jpg`              | Visuel illustratif local : produit blazer.                                                                 |
| `frontend/assets/images/product-coffee.jpg`              | Visuel illustratif local : produit coffee.                                                                 |
| `frontend/assets/images/product-cosmetic.jpg`            | Visuel illustratif local : produit cosmetic.                                                               |
| `frontend/assets/images/product-desk-fan.jpg`            | Visuel illustratif local : produit desk fan.                                                               |
| `frontend/assets/images/product-dinner-set.jpg`          | Visuel illustratif local : produit dinner set.                                                             |
| `frontend/assets/images/product-dress.jpg`               | Visuel illustratif local : produit dress.                                                                  |
| `frontend/assets/images/product-frame.jpg`               | Visuel illustratif local : produit frame.                                                                  |
| `frontend/assets/images/product-guitar.jpg`              | Visuel illustratif local : produit guitar.                                                                 |
| `frontend/assets/images/product-keyboard.jpg`            | Visuel illustratif local : produit keyboard.                                                               |
| `frontend/assets/images/product-kids-outfit.jpg`         | Visuel illustratif local : produit kids outfit.                                                            |
| `frontend/assets/images/product-laptop.jpg`              | Visuel illustratif local : produit laptop.                                                                 |
| `frontend/assets/images/product-lotion.jpg`              | Visuel illustratif local : produit lotion.                                                                 |
| `frontend/assets/images/product-plates.jpg`              | Visuel illustratif local : produit plates.                                                                 |
| `frontend/assets/images/product-power-strip.jpg`         | Visuel illustratif local : produit power strip.                                                            |
| `frontend/assets/images/product-puzzle.jpg`              | Visuel illustratif local : produit puzzle.                                                                 |
| `frontend/assets/images/product-rice.jpg`                | Visuel illustratif local : produit rice.                                                                   |
| `frontend/assets/images/product-ringlight.jpg`           | Visuel illustratif local : produit ringlight.                                                              |
| `frontend/assets/images/product-scarf.jpg`               | Visuel illustratif local : produit scarf.                                                                  |
| `frontend/assets/images/product-shirt.jpg`               | Visuel illustratif local : produit shirt.                                                                  |
| `frontend/assets/images/product-smartphone.jpg`          | Visuel illustratif local : produit smartphone.                                                             |
| `frontend/assets/images/product-soap.jpg`                | Visuel illustratif local : produit soap.                                                                   |
| `frontend/assets/images/product-standing-fan.jpg`        | Visuel illustratif local : produit standing fan.                                                           |
| `frontend/assets/images/product-tie.jpg`                 | Visuel illustratif local : produit tie.                                                                    |
| `frontend/assets/images/product-toys.jpg`                | Visuel illustratif local : produit toys.                                                                   |
| `frontend/assets/images/product-usb-c.jpg`               | Visuel illustratif local : produit usb c.                                                                  |
| `frontend/assets/images/product-watch.jpg`               | Visuel illustratif local : produit watch.                                                                  |
| `frontend/assets/images/product-womens-shoes.jpg`        | Visuel illustratif local : produit womens shoes.                                                           |
| `frontend/assets/images/sneakers.png`                    | Visuel illustratif local : sneakers.                                                                       |
| `frontend/pages/aide.html`                               | Centre d’aide.                                                                                             |
| `frontend/pages/confidentialite.html`                    | Informations de confidentialité.                                                                           |
| `frontend/pages/congo.html`                              | Page Congo et ordre des scripts classiques.                                                                |
| `frontend/pages/index.html`                              | Page RDC et ordre des scripts classiques.                                                                  |
| `frontend/pages/publicite.html`                          | Présentation publicitaire.                                                                                 |
| `frontend/src/account-verification-flows.js`             | Parcours d’inscription, documents et validation des comptes.                                               |
| `frontend/src/advertising.js`                            | Interactions de la page publicité.                                                                         |
| `frontend/src/app.js`                                    | Catalogue, panier, modales et interactions initiales.                                                      |
| `frontend/src/auth-independent.js`                       | Connexion YAVIYA, formulaire de compte, session et entrée Google.                                          |
| `frontend/src/commerce-guard.js`                         | Intercepte les anciennes actions avant le parcours partagé.                                                |
| `frontend/src/country-bootstrap.js`                      | Initialise le marché RDC ou Congo avant les autres scripts.                                                |
| `frontend/src/country-data.js`                           | Données de localisation et libellés des marchés.                                                           |
| `frontend/src/country-final.js`                          | Ajustements pays/langue après les composants de base.                                                      |
| `frontend/src/courier-reviews.js`                        | Notation après réception et affichage des avis.                                                            |
| `frontend/src/customer.js`                               | Profil client, consentement et identifiants.                                                               |
| `frontend/src/delivery-roles.js`                         | Composants des vues acheteur, vendeur, livreur et admin.                                                   |
| `frontend/src/enhancements.js`                           | Compléments des fiches et de navigation.                                                                   |
| `frontend/src/language-top.js`                           | Sélection de langue.                                                                                       |
| `frontend/src/marketplace.js`                            | Vues métier et outils du catalogue multi-vendeurs.                                                         |
| `frontend/src/mobile-nav.js`                             | Navigation adaptée aux petits écrans.                                                                      |
| `frontend/src/mvp-final.js`                              | Finitions des parcours et affichages MVP.                                                                  |
| `frontend/src/page-navigation.js`                        | Ouverture des fenêtres en haut, sans bouton Retour flottant.                                       |
| `frontend/src/partner-campaigns.js`                      | Campagnes partenaires illustratives.                                                                       |
| `frontend/src/popular-faq.js`                            | FAQ pliable et retours des utilisateurs.                                                                   |
| `frontend/src/pricing-benefits.js`                       | Présentation des tarifs, avantages et formules.                                                            |
| `frontend/src/product-gallery.js`                        | Upload multiple, ordre, couverture et galerie de huit photos.                                              |
| `frontend/src/profile-commerce.js`                       | Profil commercial et achat immédiat avec reprise après connexion.                                          |
| `frontend/src/promotions-dashboards.js`                  | Promotions et tableaux de bord.                                                                            |
| `frontend/src/registration-categories.js`                | Inscription par étapes et catégories ouvrant leurs produits.                                               |
| `frontend/src/search-photo-ratings.js`                   | Recherche photo approximative, tri et avis illustratifs.                                                   |
| `frontend/src/seller-markets.js`                         | Boutiques et gestion des marchés vendeurs.                                                                 |
| `frontend/src/seller-plans.js`                           | Formules et choix d’abonnement vendeur, sans débit.                                                        |
| `frontend/src/shared-commerce.js`                        | Commandes, missions, discussions et règlements multi-comptes.                                              |
| `frontend/src/shared-delivery.js`                        | Composants de suivi et compatibilité de l’ancien scénario.                                                 |
| `frontend/src/support.js`                                | Centre d’aide et chatbot à réponses guidées.                                                               |
| `frontend/src/yavicoins.js`                              | Interface de fidélité et récompenses fictives.                                                             |
| `frontend/styles/style.css`                              | Styles du site, composants, responsive et galeries produit.                                               |
| `legacy-vitrine/README.md`                               | Ancienne vitrine de huit produits : README.md. Conservée hors du build principal.                          |
| `legacy-vitrine/app.js`                                  | Ancienne vitrine de huit produits : app.js. Conservée hors du build principal.                             |
| `legacy-vitrine/catalog/catalog.js`                      | Ancienne vitrine de huit produits : catalog.js. Conservée hors du build principal.                         |
| `legacy-vitrine/catalog/products.js`                     | Ancienne vitrine de huit produits : products.js. Conservée hors du build principal.                        |
| `legacy-vitrine/index.html`                              | Ancienne vitrine de huit produits : index.html. Conservée hors du build principal.                         |
| `legacy-vitrine/package-lock.json`                       | Ancienne vitrine de huit produits : package-lock.json. Conservée hors du build principal.                  |
| `legacy-vitrine/package.json`                            | Ancienne vitrine de huit produits : package.json. Conservée hors du build principal.                       |
| `legacy-vitrine/scripts/build.mjs`                       | Ancienne vitrine de huit produits : build.mjs. Conservée hors du build principal.                          |
| `legacy-vitrine/scripts/check.mjs`                       | Ancienne vitrine de huit produits : check.mjs. Conservée hors du build principal.                          |
| `legacy-vitrine/scripts/dev.mjs`                         | Ancienne vitrine de huit produits : dev.mjs. Conservée hors du build principal.                            |
| `legacy-vitrine/styles.css`                              | Ancienne vitrine de huit produits : styles.css. Conservée hors du build principal.                         |
| `legacy-vitrine/tests/catalog.test.mjs`                  | Ancienne vitrine de huit produits : catalog.test.mjs. Conservée hors du build principal.                   |
| `legacy-vitrine/vercel.json`                             | Ancienne vitrine de huit produits : vercel.json. Conservée hors du build principal.                        |
| `package-lock.json`                                      | Versions exactes utilisées par npm ci.                                                                     |
| `package.json`                                           | Commandes npm, dépendances et version 1.4.0.                                                               |
| `scripts/build.mjs`                                      | Assemble les sources frontend classées en fichiers publics plats dans dist.                                |
| `scripts/check.mjs`                                      | Syntaxe des sources et présence des assets référencés.                                                     |
| `scripts/create-owner.mjs`                               | Crée le propriétaire admin dans un terminal de confiance.                                                  |
| `scripts/dev.mjs`                                        | Serveur local et initialisation des migrations.                                                            |
| `scripts/migrate.mjs`                                    | Applique une seule fois les migrations dans l’ordre.                                                       |
| `tests/independent.test.mjs`                             | Tests sessions, permissions, quatre comptes et parcours partagé.                                           |
| `tests/purchase.test.mjs`                                | Tests photos, achat immédiat et Google non configuré.                                                      |
| `vercel.json`                                            | Build, routage API et fonction Vercel.                                                                     |

Fichiers ajoutés en version 1.3.0 :

| Fichier | Rôle |
| --- | --- |
| `backend/two-factor.js` | Enrôlement TOTP, chiffrement, challenges, codes de secours et mutations protégées. |
| `database/migrations/0014_two_factor_auth.sql` | Tables 2FA, générations des facteurs et date des sessions. |
| `frontend/src/two-factor-settings.js` | Activation par QR, gestion et téléchargement des codes. |
| `tests/two-factor.test.mjs` | Vérification des garanties de sécurité et parcours API. |
| `tests/two-factor-ui.test.mjs` | Parcours des formulaires frontend reliés au backend local. |
| `docs/TWO_FACTOR.md` | Configuration serveur et parcours utilisateur 2FA. |

Fichiers ajoutés en version 1.3.0 :

| Fichier | Rôle |
| --- | --- |
| `backend/data/market-config.json` | Source unique des catégories, villes de RDC et villes ouvertes aux commandes. |
| `tests/checkout-flow.test.mjs` | Parcours des pages complètes et API réelle : clic, profil, commande, catégories et zones fermées. |
| `docs/CATALOGUE_COVERAGE.md` | Comportement, données géographiques, sources et diagnostic du déploiement. |

Le build génère `dist/market-config.js` depuis le JSON ; ce fichier généré n’est pas une source à modifier.

Fichiers ajoutés en version 1.3.1 : `docs/PRODUCT_PHOTOS.md` (provenance et usage des vues), et les 30 fichiers `frontend/assets/images/*-angle-2.webp` (vues alternatives illustratives). Mapping commun dans `backend/data/market-config.json` ; galerie vérifiée avec le backend par `tests/checkout-flow.test.mjs`.

Fichiers ajoutés en version 1.4.0 :

| Fichier | Rôle |
| --- | --- |
| `backend/worker/product-insights.js` | Comptage des vues et achats ; rapports vendeur/admin avec droits côté serveur. |
| `database/migrations/0015_product_insights.sql` | Événements de consultation persistants et index. |
| `frontend/src/product-insights.js` | Compteurs produits, chatbot sur les fiches et statistiques centralisées. |
| `tests/product-insights.test.mjs` | Déduplication, isolation des boutiques, marchés et agrégats. |

Fichiers de la version 1.5.0 : `frontend/src/demo-catalogue.js` initialise les nouvelles références avant connexion ; `backend/data/market-config.json` contient le catalogue supplémentaire et les nombres fictifs annotés ; les 42 fichiers `frontend/assets/images/catalogue-*.webp` alimentent les galeries. Le suivi après confirmation est dans `frontend/src/shared-commerce.js`. Les statistiques réelles restent dans `backend/worker/product-insights.js`.

Version 1.6.0 : `database/migrations/0016_identity_issuing_country.sql` ajoute pays et format du document ; `backend/worker/identity-complete.js` contrôle les dossiers approuvés complets ; `docs/IDENTITY_DELIVERY.md` décrit tarifs, inscription et validation.
