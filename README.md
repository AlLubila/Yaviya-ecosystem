# YAVIYA — nouvelle version complète (1.9.0)

Version 1.9.0 : adaptateur PostgreSQL activable sur Vercel, schéma d’exécution privé et rôle Supabase à privilèges minimaux. SQLite reste disponible uniquement pour le développement et les tests locaux.

Version 1.7.0 : [12 catégories, coupons et préférences de profil](docs/PROFILE_CATEGORIES_COUPONS.md). La devise préférée ne convertit pas les prix.

Version complète indépendante issue de la version 31 de YAVIYA « Votre marché, à portée de main », avec les corrections d’achat immédiat, la connexion indépendante, des fenêtres sans Retour flottant et des galeries sous plusieurs angles. Le catalogue comprend 60 références par marché, des nombres d’acheteurs marqués « démo » et une confirmation avec accès au suivi après commande. Frontend, backend, API, migrations, tests et photos sont accessibles comme fichiers séparés dans le dépôt public. L'ancienne vitrine de huit produits est conservée dans `legacy-vitrine/` ; le build principal utilise désormais la version complète.

[Catalogue et couverture](docs/CATALOGUE_COVERAGE.md) · [Double authentification](docs/TWO_FACTOR.md) · [Rôle de chaque fichier](docs/FILES.md) · [Lancer et tester les parcours](docs/DEMO.md)

La base PostgreSQL/Supabase de production est active et définie dans `supabase/` avec RLS, stockage privé, tables de paiements, commissions, remboursements et reversements. L’API sélectionne PostgreSQL dès que `POSTGRES_URL` est présent ; elle refuse le stockage local éphémère sur Vercel. Voir le [guide PostgreSQL/Supabase](docs/POSTGRESQL_SUPABASE.md).

## Ce qui est conservé

Catalogue multi-vendeurs, catégories, favoris, comparateur, galerie de photos, recherche, panier, deux marchés, français/anglais, communes de Kinshasa et Lubumbashi, FAQ, assistant local, inscriptions vendeur/livreur, vérification manuelle, commandes partagées, disponibilité et rémunération indicative du livreur, messages, preuve de livraison privée et évaluations. Les règles métier du backend original sont conservées.

## Installation locale

Node.js **24** est requis.

```bash
npm ci
npm run dev
```

Ouvrir http://127.0.0.1:3000. Les migrations sont appliquées automatiquement au démarrage local. La base SQLite se trouve dans `.local/`, exclue de Git. La connexion utilise un e-mail ou un téléphone et un mot de passe de 12 à 128 caractères. Le profil conserve son formulaire d'origine et ses identifiants YVC/YVYS/YVYC.

```bash
npm test
npm run build
npm start
```

## Activer l'installation Vercel

Le projet GitHub doit être relié au projet Vercel `yaviyaecosystem`, avec la racine du dépôt comme Root Directory. `vercel.json` configure `npm run build`, le dossier `dist` et la fonction API indépendante. Utiliser Node.js 24.

1. Utiliser le projet Supabase `yaviya-production` et sa connexion **Transaction pooler** sur le port 6543.
2. Ajouter `POSTGRES_URL` comme Secret Vercel côté serveur. La valeur utilise le rôle limité `yaviya_runtime` et ne doit jamais être préfixée par `NEXT_PUBLIC_`.
3. Les migrations Supabase sont versionnées dans `supabase/migrations/`. Les migrations SQLite de `database/migrations/` servent uniquement au démarrage local.
4. Pour créer le propriétaire administrateur, renseigner un identifiant distinct `OWNER_LOGIN` et un mot de passe choisi par le propriétaire dans `.env`, puis exécuter `npm run db:owner`. Cette opération ne peut pas être effectuée depuis le navigateur. Supprimer ensuite ces deux valeurs de `.env` ; elles ne sont pas nécessaires au serveur.
5. Déployer la branche validée, puis vérifier la connexion, le profil, les documents, commandes et messages sur la preview avant la fusion dans `main`.

**Sans la base et ses variables, la vitrine peut se charger mais les API répondent 503. Cela ne constitue pas une installation complète.** Aucun stockage temporaire en mémoire ou sur `/tmp` n'est utilisé comme base de production. Le build n'a pas besoin de secrets et ne modifie pas la base.

## Architecture

| Emplacement                  | Rôle                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| `frontend/pages/`            | Cinq pages HTML, dont les portails RDC et Congo                                           |
| `frontend/src/`              | Scripts classiques du catalogue, comptes et parcours métier                               |
| `frontend/styles/`           | Styles responsive                                                                         |
| `frontend/assets/images/`    | 34 images originales et 30 vues produits supplémentaires                                                           |
| `api/handler.js`             | Fonction Vercel : conversion HTTP vers les gestionnaires existants                        |
| `backend/application.js`     | Session indépendante et identité injectée côté serveur                                    |
| `backend/auth.js`            | Comptes, mots de passe scrypt, sessions serveur, déconnexion et limitation des tentatives |
| `backend/database.js`        | Adaptation D1 vers PostgreSQL en production et SQLite pour le développement local          |
| `backend/worker/`            | Gestionnaires métier de la version 31, avec identités YAVIYA indépendantes                |
| `database/migrations/`       | Migrations originales et tables des accès indépendants                                    |
| `scripts/`                   | Serveur local, build, migrations, création propriétaire et contrôles                      |
| `tests/independent.test.mjs` | Tests des accès privés et du parcours partagé à quatre comptes distincts                  |

Les documents privés sont enregistrés en BLOB dans la base, avec leurs types MIME. Ils ne sont pas copiés dans `dist`, ni exposés sous une URL publique ; les routes conservent les contrôles du backend original. Pour un volume important, un stockage de fichiers privé séparé devra remplacer cet adaptateur. Les limites de téléversement de la plateforme et de la base devront être vérifiées sur le projet actif avant l'ouverture publique ; les contrôles existants de 8 Mo et de signature des fichiers sont conservés.

## Limites de la version originale et de cette restauration

Cette installation est indépendante de ChatGPT : elle n'utilise ni sa connexion, ni sa base, ni ses fichiers privés, et n'appelle pas le site original. Elle démarre avec une **nouvelle base**. Les profils, commandes, messages et documents déjà enregistrés dans ChatGPT Sites ne sont pas exportés ni migrés par ce projet.

Les produits et boutiques initiaux sont illustratifs. Les paiements Mobile Money/carte, l'escrow financier, les reversements automatiques, les abonnements payants et l'envoi d'e-mails ne sont pas activés. Google est intégré au code, mais exige la configuration du client OAuth avant de fonctionner. La connexion indépendante n'ajoute pas de vérification e-mail/SMS ni de récupération automatique du mot de passe. Les paiements à réception et règlements manuels conservent leurs déclarations de suivi, sans transfert automatique de fonds. L'assistant reste celui du site original.

Validation locale : syntaxe des sources, fichiers référencés, migrations, transactions atomiques, session/CSRF, isolation des profils, refus d'identité falsifiée, pièces privées, validation manuelle vendeur/livreur, création de produit, commande idempotente, acceptation, préparation, affectation livreur, preuve privée, réception et notes vendeur/livreur. Les formulaires 2FA sont testés avec jsdom contre le backend réel. La connexion distante doit être vérifiée après chaque changement de Secret Vercel.

## Connexion Google / Gmail

Créer un client OAuth Google de type Web. Ajouter exactement GOOGLE_REDIRECT_URI aux URI autorisés, puis définir GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET et GOOGLE_REDIRECT_URI sur Vercel. Le secret reste côté serveur. Aucun accès Gmail ni lecture des messages : seuls openid, email et profile sont demandés. Les comptes Google sont séparés des comptes par mot de passe pour éviter un rattachement par e-mail non vérifié.

## Double authentification

Le bouton **Sécurité · 2FA** permet de configurer une application Authenticator, confirmer un premier code et télécharger 8 codes de secours. Les connexions par mot de passe et Google passent par le second facteur pour les comptes protégés. Configurer `MFA_ENCRYPTION_KEY` et appliquer la migration 0014 avant le déploiement. Les étapes, garanties et limites figurent dans [le guide 2FA](docs/TWO_FACTOR.md).

## Catalogue et couverture 1.3.0

19 familles et 72 sous-catégories, avec sélection vendeur et classement persistant. Le formulaire affiche 96 villes/agglomérations de RDC ; seules Kinshasa et Lubumbashi acceptent les commandes. Les autres restent désactivées jusqu’à l’extension, avec contrôle serveur dans les quatre modes. Le clic Acheter maintenant est testé à travers les vrais scripts, formulaires et API : synchronisation concurrente, profil et commande du produit choisi. Voir [le guide](docs/CATALOGUE_COVERAGE.md). Le site en ligne consulté répondait encore HTTP 503 sur son API de compte ; la configuration du projet cible reste à vérifier.

## Fenêtres, questions populaires et photos 1.3.1

17 questions populaires bilingues, réponses pliables et votes, sans doublons entre les scripts. Les 39 références de chaque marché disposent de deux photos distinctes : les vues alternatives sont générées et indiquées comme illustratives. Les galeries téléversées par les vendeurs sont conservées, avec jusqu’à 8 photos réordonnables. Voir [la documentation des photos](docs/PRODUCT_PHOTOS.md). Le bouton Retour flottant a été retiré ; la croix de fermeture reste accessible.

## Chatbot et statistiques produits 1.4.0

« Besoin d’aide » ouvre le chatbot, également depuis chaque fiche produit. Les cartes et fiches présentent le nombre de comptes acheteurs ayant confirmé la réception ; les annulations sont exclues. Les statistiques vendeur montrent les visiteurs distincts et les achats de ses boutiques ; l’admin centralise les deux marchés, avec filtres par période et boutique. Les données sont enregistrées sur le serveur, sans exemples chiffrés dans ce nouvel onglet. Voir [les endpoints et définitions](docs/API.md#statistiques-produits-140).

Avant l’activation sur l’hébergement : configurer la base persistante puis appliquer les migrations, notamment `0015_product_insights.sql`, avec `npm run db:migrate`. Tant que le service serveur est indisponible, les compteurs l’indiquent au lieu d’afficher zéro.
