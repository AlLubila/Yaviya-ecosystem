# Mise à jour complète YAVIYA

Site original v31 avec ses 34 images, deux marchés et espaces acheteur, vendeur, livreur et administrateur.

Fichiers concernés : frontend/ (site et photos originales), backend/worker/ (catalogue et métier), backend/database.js, backend/auth.js, backend/google-auth.js, frontend/auth-independent.js, frontend/profile-commerce.js, api/handler.js, database/migrations/, scripts/, tests/, package.json, package-lock.json, vercel.json, .env.example, README.md.

Acheter maintenant : authentification indépendante, synchronisation explicite, sélection du seul produit et reprise après le formulaire client. Aucun compte ChatGPT requis. Le formulaire reste visible sans connexion ; son enregistrement demande un accès YAVIYA par formulaire ou Google.

Intégrations : base Turso persistante et migrations ; identifiants OAuth Google et URI de rappel ; compte administrateur via db:owner ; futurs prestataires de paiement, notifications et livraison. Catalogue isolé dans backend/worker/catalogue-seeds.js et accès via /api/marketplace.

Validation : tests automatisés, compilation et présence de toutes les photos du catalogue. Connexion Google réelle et déploiement Vercel non vérifiés faute de configuration et d’accès autorisé au projet. Aucun paiement électronique activé.

Navigation produit : flèche Retour visible sur ordinateur et mobile. Pendant la comparaison, retour à la fiche produit ou à la boutique précédente sans fermer la fenêtre ; galerie et boutons conservés. Retour en haut de chaque vue. Fichiers : frontend/page-navigation.js et frontend/style.css.
