# Mise à jour complète YAVIYA

Site original v31 avec ses 34 images, deux marchés et espaces acheteur, vendeur, livreur et administrateur.

Fichiers concernés : frontend/ (site et photos originales), backend/worker/ (catalogue et métier), backend/database.js, backend/auth.js, backend/google-auth.js, frontend/auth-independent.js, frontend/profile-commerce.js, api/handler.js, database/migrations/, scripts/, tests/, package.json, package-lock.json, vercel.json, .env.example, README.md.

Acheter maintenant : authentification indépendante, synchronisation explicite, sélection du seul produit et reprise après le formulaire client. Aucun compte ChatGPT requis. Le formulaire reste visible sans connexion ; son enregistrement demande un accès YAVIYA par formulaire ou Google.

Intégrations : base Turso persistante et migrations ; identifiants OAuth Google et URI de rappel ; compte administrateur via db:owner ; futurs prestataires de paiement, notifications et livraison. Catalogue isolé dans backend/worker/catalogue-seeds.js et accès via /api/marketplace.

Validation : tests automatisés, compilation et présence de toutes les photos du catalogue. Connexion Google réelle et déploiement Vercel non vérifiés faute de configuration et d’accès autorisé au projet. Aucun paiement électronique activé.

Navigation produit : fenêtres sans bouton Retour flottant, fermeture par la croix et ouverture en haut de chaque vue.

## Version 1.2.0 — double authentification

Activation facultative par application TOTP avec QR code et clé manuelle, premier code obligatoire, 8 codes de secours à usage unique, connexion en deux étapes par mot de passe ou Google. Chiffrement des secrets, challenges courts, limitation des essais, protection contre le rejeu et invalidation des anciennes sessions. Configuration `MFA_ENCRYPTION_KEY` et migration 0014 nécessaires sur le serveur cible. Documentation : docs/TWO_FACTOR.md.

## Version 1.3.0 — achat immédiat, catégories et couverture

Le clic attend la synchronisation en cours et recharge explicitement le profil, puis vérifie le produit serveur. La reprise après inscription, une commande du seul article choisi et les erreurs persistantes sont testées avec les pages complètes et le backend SQLite. 19 familles, 72 sous-catégories, sélection dans l’éditeur vendeur et conservation côté serveur. Répertoire de 96 villes/agglomérations RDC ; seules Kinshasa et Lubumbashi sont ouvertes, avec refus des autres villes dans chaque mode, côté UI et serveur. Le répertoire est commercial et ne certifie pas les statuts administratifs actuels. Le backend du déploiement consulté répondait 503 et le projet n’était pas accessible par la connexion Vercel disponible.

## Version 1.3.1 — fenêtres, FAQ et vues produits

Suppression du bouton Retour flottant. 17 questions populaires bilingues, pliables, avec réponses pratiques et statut réel de la démonstration ; votes enregistrés pour les nouveaux sujets et réponses du chatbot associées. 30 vues alternatives générées à partir des photos originales : deux vues distinctes pour les 39 références de chaque marché, sans remplacer les galeries chargées par un vendeur. La configuration commune hydrate le catalogue initial et les anciennes données démo servies par l’API. Éditeur : jusqu’à 8 photos, couverture réordonnable, conseils face/profil/arrière/détails. Aucune garantie de conformité donnée par les images générées.

## Version 1.4.0 — chatbot et statistiques produits partagées

« Besoin d’aide » ouvre le chatbot ; un bouton est présent sur les fiches produits. Le chatbot est inséré dans le dialogue ouvert pour rester utilisable dans la couche modale du navigateur. Fermer le chat ou appuyer sur Échap revient au produit. Les raccourcis FAQ utilisent les réponses actuelles.

Chaque carte et fiche affiche les comptes acheteurs distincts avec réception confirmée, commandes annulées exclues. Les vues sont enregistrées à l’ouverture d’une fiche, dédupliquées par compte/navigateur et tranche de 30 minutes ; propriétaire et admin exclus. Migration 0015, routes `/api/product-insights`, rapport vendeur limité aux boutiques autorisées et rapport admin centralisé sur les deux marchés. Filtres période, marché et boutique. Totaux distincts dédupliqués entre produits et marchés. Le frontend ne fabrique pas de chiffres lorsque le backend est indisponible.

Validation : 23 tests, dont métriques persistantes, droits, agrégats, chatbot dans le dialogue, affichage des compteurs et tableau admin. Migration et configuration de base requises sur l’hébergement.

## Version 1.5.0 — catalogue élargi et suivi après commande

21 références supplémentaires par marché, réparties dans les boutiques existantes : batteries acoustiques, bijoux, microphones, parfums, couverts et bols, sport, sacs scolaires et étudiants, pièces automobiles, tenues traditionnelles et éclairages vidéo. Les guitares, laits et cosmétiques existants restent disponibles. Deux photos par référence. Configuration commune dans backend/data/market-config.json ; ajout idempotent des nouvelles références dans les bases déjà initialisées, sans écraser les produits modifiés.

Les fiches et cartes du catalogue de démonstration affichent un nombre fictif d’acheteurs, clairement identifié « démo ». Ces nombres sont indépendants des mesures réelles conservées par l’API et ne créent aucun faux compte, événement ou achat. Les produits ajoutés par les vendeurs utilisent les mesures serveur.

Après une commande effectivement enregistrée, une confirmation affiche la référence et un bouton « Suivre ma commande » pour accéder à l’article dans Mes commandes. Les étapes, événements et discussions restent partagés entre les participants autorisés. Une erreur serveur ne produit aucune fausse confirmation.

Validation 1.5.0 : 25 tests automatisés passent ; compilation de 147 fichiers frontend. Les tests couvrent les nouvelles sous-catégories, les galeries, les compteurs démo annotés, l’ajout aux bases existantes et l’accès au suivi après confirmation. La limite du backend hébergé (HTTP 503 au moment du contrôle) reste distincte de la validation locale.

## Version 1.6.0 — tarifs, compte acheteur et vérification

Barème de Kinshasa harmonisé dans la configuration commune avec les derniers tarifs convenus : Lukunga 7 500 FC, Funa 9 000 FC, Mont-Amba 10 000 FC, Tshangu 12 500 FC, avec exceptions par commune. Lubumbashi conserve le tarif pilote de 7 500 FC. Les montants affichés et enregistrés utilisent la même configuration.

L’inscription issue d’un achat sélectionne le compte acheteur et désactive vendeur/livreur dans ce parcours. Les espaces professionnels restent bloqués tant que le dossier n’est pas complet et approuvé. La démarche distincte « Devenir vendeur/livreur » est conservée.

Pays d’émission obligatoire (249 codes de pays/territoires plus Kosovo), photo JPG/PNG obligatoire pour vendeur et livreur, document privé, permis C réservé aux livreurs. Un changement de pièce ou de pays relance la validation manuelle. Les dossiers antérieurs sans pays ou photo identifiée doivent être complétés à la connexion ; ils n’ouvrent plus les espaces professionnels. Migration 0016 obligatoire. Voir docs/IDENTITY_DELIVERY.md.

Validation 1.6.0 : 27 tests passent (tarifs frontend/backend, création acheteur, autorisations professionnelles, pays et photo obligatoires, permis C, parcours partagés et double authentification). Compilation réussie. L’API hébergée doit être rétablie et la migration 0016 appliquée avant utilisation réelle.
