# Lancer et tester la version complète

Node.js 24 : `npm ci`, puis `npm run dev`. Le serveur crée une base SQLite locale et ouvre le site sur http://127.0.0.1:3000. Aucune connexion ChatGPT n'est requise. Créer les accès YAVIYA avec un e-mail ou téléphone et un mot de passe de 12 à 128 caractères ; les données utilisées pendant les essais doivent être fictives.

## Comptes distincts et administration

Pour tester acheteur, vendeur et livreur simultanément, utiliser des profils de navigateur distincts. Chaque navigateur a sa propre session YAVIYA. Les boutons de rôle changent la vue ; ils n'accordent pas de droits supplémentaires.

Le propriétaire admin doit être créé dans un terminal de confiance avec `npm run db:owner`. Renseigner d'abord `OWNER_LOGIN` et `OWNER_PASSWORD` dans `.env` à partir de `.env.example`, puis retirer ces deux valeurs après la création. Le script refuse de remplacer un admin existant. Ne jamais mettre de vrais identifiants dans GitHub.

1. Inscrire un vendeur ; compléter son profil, son document fictif et sa formule. Dans l'administration, contrôler et approuver sa demande.
2. Ajouter un produit dans sa boutique, avec jusqu'à huit photos. Choisir l'ordre et la couverture. L'admin approuve le produit pour qu'il apparaisse aux acheteurs.
3. Inscrire et faire approuver un livreur. Son inscription comprend profil, identité, avantages, abonnement et coordonnées de règlement. Activer sa disponibilité.
4. Depuis le compte acheteur, ouvrir le produit puis utiliser Acheter maintenant. Compléter le formulaire client si nécessaire et choisir livraison à domicile avec espèces à réception. Le même numéro de commande apparaît chez le vendeur.
5. Le vendeur accepte et prépare ; le livreur accepte la mission et confirme la récupération. Après livraison, il ajoute une photo fictive et déclare l'encaissement.
6. L'acheteur confirme la réception et son paiement déclaré, puis évalue le vendeur et le livreur affecté. Le livreur voit sa note, ses gains, dépenses et bénéfice net.
7. L'admin suit les échanges et peut enregistrer un règlement manuel avec une référence fictive. Aucun transfert n'est exécuté.

Le catalogue initial appartient au propriétaire admin et reste illustratif. Pour un essai entre un vrai compte vendeur et un acheteur distinct, utiliser le produit créé à l'étape 2. Une révision devenue ancienne peut provoquer un conflit 409 : recharger la vue avant de réessayer.

## Navigation et autres écrans

Ouvrir une fiche produit et comparer des produits. Ouvrir les catégories, la FAQ pliable, l'aide et le chatbot à réponses guidées. Les communes de Kinshasa, Lubumbashi, Kolwezi, Matadi et Boma sont disponibles dans les formulaires. Le portail Congo utilise `/congo.html?country=CG` avec ses données séparées.

## Validation et activation distante

`npm test` vérifie les sessions, l'origine des requêtes, l'isolation des comptes, le parcours partagé complet, les preuves privées, les notes, les photos, l'achat immédiat et le refus des connexions Google non configurées. `npm run build` génère 71 fichiers publics dans `dist/`. Les sources restent dans `frontend/` et `backend/` ; ne pas modifier le build généré.

Sur Vercel, activer Turso/libSQL, ses variables et les migrations selon le README. Google exige ses trois variables OAuth et un URI de retour autorisé. Aucun paiement électronique, escrow ni abonnement facturé n'est activé. Ces tests locaux ne valident pas les services distants ni le rendu visuel dans tous les navigateurs.
