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

1. Le projet `yaviya-production` est créé dans l'organisation YAVIYA, en région Paris (`eu-west-3`), avec la référence `ngaoyevncsocyqmlmbdw`.
2. Relier le dépôt avec `supabase link --project-ref ngaoyevncsocyqmlmbdw` depuis un terminal de confiance.
3. Les trois migrations ont été appliquées le 8 octobre 2026 et contrôlées avec les outils d'audit Supabase.
4. Pour les changements futurs, vérifier d'abord une branche Supabase ou un projet de test, puis appliquer les nouvelles migrations.
5. Configurer uniquement côté serveur : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` et `DATABASE_URL`.
6. Créer deux projets distincts pour Preview et Production. Ne jamais employer la clé `service_role` dans le navigateur.
7. Adapter ensuite l'API YAVIYA de libSQL vers PostgreSQL/Supabase et lancer la recette à quatre comptes avant de modifier le domaine public.

## Paiements

Les écritures dans `payment_transactions`, `ledger_entries` et `payouts` sont interdites aux clients par RLS. Seuls les webhooks serveur, après vérification de leur signature, utilisent le rôle de service. Chaque appel financier possède une clé d'idempotence. Le schéma prépare l'encaissement, la commission, la dette envers le vendeur, le remboursement et le reversement, mais ne simule pas un agrément escrow : celui-ci doit être contractualisé avec la banque ou l'opérateur.

## État au 8 octobre 2026

La base hébergée est active à Paris : 26 tables publiques avec RLS, 12 catégories, 3 buckets et 44 politiques. L'audit de sécurité Supabase ne signale aucune anomalie. Les avis d'index inutilisés sont attendus sur une base vide. L'API hébergée existante reste sur Turso/libSQL jusqu'à la migration de l'adaptateur serveur ; la création de cette base ne suffit donc pas encore à supprimer l'erreur 503 du site.
