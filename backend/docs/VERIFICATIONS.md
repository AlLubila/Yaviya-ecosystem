# Vérifications et limites de validation

## Vérifications effectuées pour cet export

- Application des onze migrations sur une base SQLite vide.
- Vérification de la syntaxe des modules JavaScript.
- Préparation du Worker avec le script fourni.
- Import du point d’entrée généré et contrôle du refus d’une requête API sans identité.
- Vérification de l’intégrité du ZIP et des imports relatifs.

Ces contrôles ne constituent pas un essai intégral de production avec D1, R2, plusieurs comptes et des prestataires de paiement.

## Recette après configuration du nouvel environnement

1. Une requête sans session reçoit 401. Une identité injectée directement par le visiteur ne doit pas permettre une connexion.
2. Seul l’e-mail propriétaire vérifié peut initialiser l’administration.
3. Un vendeur ou livreur non validé ne peut pas accéder aux actions métier réservées.
4. Créer acheteur, vendeur et livreur distincts ; valider les dossiers requis.
5. Passer une commande, accepter et préparer les colis, activer la disponibilité et accepter la mission.
6. Deux livreurs tentant la même mission : une seule affectation doit réussir.
7. Une révision périmée doit provoquer 409 et permettre le rechargement.
8. Vérifier la preuve photo, la réception, les deux déclarations de paiement et les évaluations.
9. Un autre compte ne peut pas lire le document privé ni la discussion de la commande.
10. Vérifier les marchés CD / CG séparément.
11. Vérifier qu’un paiement électronique est refusé et qu’un règlement manuel ne déclenche aucun débit.

Avant exploitation commerciale, finaliser l’authentification indépendante si nécessaire, l’intégration du prestataire de paiement, la facturation des abonnements et les règles opérationnelles de livraison. Les données de catalogue et tarifs inclus sont illustratifs.
