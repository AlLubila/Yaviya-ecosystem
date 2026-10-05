# Parcours métier

## Compte livreur

1. Créer le profil avec le type `courier`.
2. Déposer la pièce d’identité, accepter les modalités du pilote et indiquer les coordonnées de règlement.
3. L’admin examine le dossier et valide manuellement.
4. Le livreur enregistre sa disponibilité.
5. Les commandes à domicile / express acceptées par tous leurs vendeurs deviennent proposées aux livreurs disponibles du pays. Il n’y a pas de filtre de proximité ou de ville du livreur dans le code actuel.
6. Un livreur accepte la mission ; son identité devient un participant de la commande.
7. La récupération devient possible une fois tous les colis prêts.
8. Le livreur ajoute une photo et confirme la livraison ; il peut déclarer l’encaissement des espèces.
9. L’acheteur confirme la réception, le paiement et les notes.
10. Après confirmations requises, l’admin peut enregistrer un règlement manuel déjà effectué hors plateforme.

## Statuts

| Champ | Valeurs principales |
| --- | --- |
| Dossier | `pending`, `approved`, `rejected` |
| `step` commande | 0 : acceptation ; 1 : préparation ; 2 : livraison ; 3 : remise terminée |
| `courierStatus` | `unassigned`, `accepted`, `collected`, `delivered` |
| `paymentStatus` | `cash_due`, `cash_confirmed` |
| `courierPayout.status` | `awaiting_delivery`, `awaiting_receipt`, `due`, `paid_manual` |

Pour une commande multivendeur, les validations et étapes individuelles restent dans `sellerAccepted` et `sellerSteps`. La réception est une confirmation distincte de la photo de livraison.

## Rémunération

Le pilote affecte au livreur 100 % des frais de livraison. `courierNet = courierEarnings - courierExpenses`. Les frais renseignés sont déclaratifs et ne réduisent pas le montant brut affiché comme règlement dû. La référence de règlement enregistrée par l’admin ne déclenche pas de transfert bancaire ou Mobile Money.

## Vendeur et acheteur

Le vendeur peut accepter, refuser et préparer uniquement les commandes de ses boutiques. Les produits, quantités et prix sont figés à la création de la commande ; le stock est décrémenté côté serveur. Un refus restaure le stock lorsque la transition est autorisée.

L’acheteur accède uniquement aux commandes auxquelles son compte participe. Le livreur accède aux commandes qui lui sont affectées. L’admin dispose d’une vue globale du marché sélectionné.

Pour `hand` ou `relay`, le code ne crée pas de mission coursier : la remise se fait par le vendeur. Le relais n’est actuellement qu’un libellé à confirmer, sans opérateur logistique connecté.
