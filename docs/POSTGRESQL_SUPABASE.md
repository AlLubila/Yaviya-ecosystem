# PostgreSQL/Supabase pour YAVIYA

Le dossier `supabase/` contient la base PostgreSQL de production préparée pour YAVIYA. Il est indépendant des migrations SQLite/libSQL actuelles : le site continue à utiliser Turso tant que l'adaptateur serveur Supabase et les secrets de production ne sont pas activés.

## Contenu

- profils acheteurs avec pays, devise et langue ;
- rôles acheteur, vendeur, livreur et administrateur ;
- identifiants courts YVC, YVYS et YVYC ;
- boutiques, 12 catégories, sous-catégories, produits et huit images par produit ;
- favoris, commandes multi-vendeurs, participants et messagerie ;
- livraison, preuve privée et note liée au livreur réellement affecté ;
- KYC vendeur/livreur et permis C réservé au parcours livreur par le backend ;
- paiements, remboursements, grand livre des commissions et reversements ;
- coupons, vues produits et votes FAQ ;
- RLS sur toutes les tables exposées et compartiments Storage séparés.

Les montants sont enregistrés comme entiers dans la plus petite unité monétaire. Les réponses brutes des prestataires de paiement ne doivent contenir ni code secret ni numéro complet de carte. Les comptes de reversement sont représentés par un jeton chiffré produit côté serveur.

## Déploiement

1. Créer un projet Supabase appartenant à l'organisation YAVIYA, idéalement dans la région Paris ou Francfort.
2. Relier le dépôt avec `supabase link --project-ref <REFERENCE>` depuis un terminal de confiance.
3. Vérifier la migration sur une branche Supabase ou un projet de test avec `supabase db push --dry-run`.
4. Appliquer avec `supabase db push`, puis contrôler les tables, les politiques RLS et les trois buckets.
5. Configurer uniquement côté serveur : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` et `DATABASE_URL`.
6. Créer deux projets distincts pour Preview et Production. Ne jamais employer la clé `service_role` dans le navigateur.
7. Adapter ensuite l'API YAVIYA de libSQL vers PostgreSQL/Supabase et lancer la recette à quatre comptes avant de modifier le domaine public.

## Paiements

Les écritures dans `payment_transactions`, `ledger_entries` et `payouts` sont interdites aux clients par RLS. Seuls les webhooks serveur, après vérification de leur signature, utilisent le rôle de service. Chaque appel financier possède une clé d'idempotence. Le schéma prépare l'encaissement, la commission, la dette envers le vendeur, le remboursement et le reversement, mais ne simule pas un agrément escrow : celui-ci doit être contractualisé avec la banque ou l'opérateur.

## Limite actuelle

La migration est prête dans GitHub, mais aucune base distante n'est créée sans connexion au compte Supabase du propriétaire. Après connexion de Supabase dans ChatGPT, la migration peut être appliquée et vérifiée directement. L'API hébergée existante reste sur Turso/libSQL jusqu'à la migration de l'adaptateur serveur.
