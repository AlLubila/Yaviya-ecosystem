# Base de données

SQLite / Cloudflare D1. Les migrations `0000` à `0010` sont fournies ; leur application dans une base SQLite vide a été vérifiée lors de cet export.

| Table | Fonction |
| --- | --- |
| `customers` | Identité applicative, coordonnées, type de compte, consentement, favoris |
| `identity_checks` | Dossier vendeur / livreur, référence du document et décision |
| `owned_stores` | Boutiques rattachées à leur titulaire |
| `admin_access` | Administrateur initial désigné |
| `market_products` | Catalogue par pays, propriétaire, stock, révision |
| `market_orders` | Commande, acheteur, livreur, snapshot, révision, clé de requête unique |
| `market_participants` | Participation acheteur, vendeur et livreur à chaque commande |
| `market_couriers` | Disponibilité et coordonnées de règlement |
| `market_messages` | Discussion partagée de la commande |
| `seller_messages` | Conversation privée vendeur–admin |
| `courier_messages` | Conversation privée livreur–admin |
| `delivery_reviews` | Notes de chaque vendeur et du livreur affecté |
| `product_photos` | Métadonnées et référence R2 des photos |
| `coin_events` | Journal des crédits / dépenses de démonstration |
| `faq_feedback` | Retours sur l’aide |
| `delivery_scenarios` | Ancien scénario individuel de démonstration |

Les champs `snapshot`, `data`, favoris et scores contiennent du JSON sérialisé. Les dates sont généralement des timestamps en millisecondes. Les fichiers ne sont pas stockés dans les tables : elles conservent les références au stockage objet.

Relations principales : commandes ↔ participants ↔ comptes ; commande ↔ acheteur / livreur ; compte vendeur ↔ boutiques ↔ produits. Le schéma fourni n’impose pas toutes ces relations par des clés étrangères ; les handlers appliquent les règles d’accès et de transition.

Les écritures de commande utilisent des batches D1 et des révisions pour gérer les accès concurrents. Les notes de commandes partagées portent un id `shared:<orderId>`. Les identifiants de boutique publiés des vendeurs enregistrés sont construits avec `owned_stores.id + 10000`.

Les snapshots individuels ne constituent pas une base commune aux utilisateurs. Le parcours partagé actuel utilise les tables `market_*`.
