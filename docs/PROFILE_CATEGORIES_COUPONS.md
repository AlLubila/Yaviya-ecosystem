# Catégories, coupons et préférences — version 1.7.0

Le catalogue utilise exactement douze familles : alimentation & épicerie, automobile, beauté & soins, bébé & enfants, industrie & commerce, maison & cuisine, mode, musique & divertissement, santé & bien-être, sports & plein air, voyage & bagages et électronique. `backend/data/market-config.json` définit les familles, leurs sous-catégories et les alias historiques. Les produits déjà enregistrés sont normalisés à la lecture, sans remplacement des photos, prix ou stocks. Les modifications vendeur enregistrent le classement canonique. Les sacs à dos scolaires et étudiants appartiennent à Voyage & bagages.

Les libellés de fidélité deviennent « coupons ». `/api/coupons` utilise le portefeuille existant ; `/api/yavicoins` demeure un alias compatible. Les soldes et historiques existants sont conservés. Il s’agit toujours de coupons de démonstration sans valeur monétaire réelle et d’échanges simulés.

`GET/POST /api/customer` expose `residenceCountry` (code pays), `currency` (CDF, XAF, USD ou EUR) et `preferredLanguage` (fr ou en). La migration `0017_profile_preferences.sql` ajoute les colonnes. Les clients anciens qui omettent ces champs conservent leurs préférences enregistrées. Les valeurs non reconnues sont rejetées. Le formulaire propose les 250 pays et territoires du référentiel existant. La langue est appliquée à l’enregistrement et à la connexion ; le menu Mon Yaviya affiche les préférences.

Le pays de résidence est indépendant du marché et du pays d’émission de la pièce d’identité. La devise est une préférence enregistrée, sans conversion automatique : prix et commandes restent en FC pour la RDC, FCFA pour le Congo. Les restrictions de livraison existantes demeurent applicables.

Validation : tests d’intégration de classement et sous-catégories, formulaire vendeur à douze familles, ouverture des produits, sauvegarde et relecture du profil, validation des valeurs, compatibilité des anciens profils et route coupons. Exécuter `npm test` puis `npm run build`. Appliquer les migrations sur toute base hébergée avant d’utiliser les nouvelles colonnes.

Le déploiement frontend Vercel est automatique depuis GitHub. Le service de comptes hébergé renvoyait déjà HTTP 503 avant cette modification ; la configuration de sa base reste à rétablir pour enregistrer les préférences en ligne.
