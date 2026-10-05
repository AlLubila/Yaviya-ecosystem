# YAVIYA — Backend et documentation, v30

Code backend correspondant au frontend v30 déjà fourni. Source publiée : `abdf4fbee5a2fbab0387cd0ce2435498b64073fc` (3 octobre 2026).

## Démarrage

1. Lire [Installation](docs/INSTALLATION.md), notamment la partie authentification.
2. Lire [API](docs/API.md) pour connecter une application web ou mobile.
3. Consulter [Base de données](docs/BASE-DE-DONNEES.md) et [Parcours métier](docs/PARCOURS.md).
4. Suivre [Vérifications](docs/VERIFICATIONS.md) avant utilisation.

## Fichiers

| Dossier / fichier | Contenu |
| --- | --- |
| `worker/index.js` | Routeur HTTP, profil client, réponses des pages publiques |
| `worker/commerce.js` | Catalogue partagé, commandes, participants, missions, encaissements et règlements |
| `worker/verification.js` | Dossiers d’identité et validation administrative |
| `worker/product-photos.js` | Ajout, lecture et suppression de photos produit |
| `worker/courier-messages.js` | Conversations livreur–administration |
| `worker/seller-messages.js` | Conversations vendeur–administration |
| `worker/delivery-reviews.js` | Notes rattachées aux participants de la commande |
| `worker/coins.js` | Yavicoins de démonstration |
| `worker/feedback.js` | Retours sur les questions fréquentes |
| `worker/delivery.js` | Anciens scénarios individuels de démonstration |
| `worker/catalogue-seeds.js` | Catalogue, boutiques et tarifs illustratifs |
| `db/schema.ts` | Schéma Drizzle / SQLite |
| `drizzle/` | Migrations SQL et métadonnées |
| `scripts/build-backend.mjs` | Préparation du Worker ; intégration facultative du frontend |
| `docs/` | Documentation française |

Le code métier est celui du site. L’export ajoute un module `assets.js` vide et un script de préparation spécifique pour fonctionner sans le ZIP frontend. Il ne modifie pas le site publié.

Ce backend utilise les API de Cloudflare Workers, D1 et R2. Ce n’est pas un serveur Express autonome. Il nécessite ces services, ou des adaptateurs équivalents, et une authentification de confiance.

Les paiements électroniques et l’escrow ne sont pas activés. Les règlements manuels sont des déclarations enregistrées ; ils n’exécutent aucun transfert.

Aucune donnée privée, document d’identité, base de production ou valeur secrète n’est livré.
