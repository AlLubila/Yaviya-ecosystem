# Référence des API

Toutes les API nécessitent une identité authentifiée. Les mutations nécessitent un `Origin` correspondant à l’origine du service. Envoyer `Content-Type: application/json` pour JSON ; pour les fichiers, utiliser `multipart/form-data` avec la boundary générée par le client.

`country=CG` sélectionne le marché République du Congo. Le marché par défaut est CD. `view` sélectionne un espace mais n’accorde aucune permission.

## Routes

| Méthodes | Route | Fonction / paramètres principaux |
| --- | --- | --- |
| GET, POST | `/api/customer` | Profil, type de compte et favoris |
| GET | `/api/marketplace?view=buyer` | Etat partagé ; vues `buyer`, `seller`, `courier`, `admin` |
| POST | `/api/marketplace/catalogue` | Enregistrer un produit avec sa révision |
| POST | `/api/marketplace/orders` | Créer une commande ; clé d’idempotence `requestKey` |
| POST | `/api/marketplace/orders/action` | Action métier avec `orderId` et `revision` |
| POST | `/api/marketplace/courier` | Disponibilité, mode et coordonnées de règlement |
| GET | `/api/marketplace/messages?orderId=...` | Messages d’une commande accessible |
| POST | `/api/marketplace/messages` | `orderId`, `view`, `message` (1–2000 caractères) |
| GET | `/api/marketplace/proof?orderId=...` | Preuve de livraison, réservée aux participants / admin |
| POST | `/api/marketplace/proof` | FormData : `orderId`, `revision`, `photo`, `delivered=true`, `cashCollected` |
| GET | `/api/marketplace/payments` | Etat d’activation des paiements |
| GET, POST | `/api/verification` | Dossier courant ; dépôt d’identité |
| POST | `/api/verification/bootstrap` | Initialisation du propriétaire désigné |
| GET, POST | `/api/verification/reviews` | Admin : liste et décision de validation |
| GET | `/api/verification/document?userId=...` | Document privé, accessible au titulaire / admin |
| POST, DELETE | `/api/product-photos` | Ajouter une photo ; supprimer avec `photoId` |
| GET | `/api/product-photos/image?photoId=...` | Image autorisée ou publiée dans le catalogue |
| GET, POST | `/api/courier-messages` | Conversation livreur / admin ; `view=courier` pour agir comme livreur |
| GET, POST | `/api/seller-messages` | Conversation vendeur / admin ; `view=seller` pour agir comme vendeur |
| GET, POST | `/api/delivery-reviews` | Notes ; GET avec `view=buyer/seller/courier/admin` |
| GET, POST | `/api/yavicoins` | Portefeuille et opérations de démonstration |
| POST | `/api/faq-feedback` | `question`, `resolved` ; retour d’aide |
| GET, POST | `/api/demo-delivery` | Ancien snapshot de démonstration par compte |
| GET, POST | `/api/demo-delivery/proof` | Ancienne preuve liée au scénario individuel |

Les paiements électroniques sont indisponibles : la création de commande exige `paymentId: "cod"`. `/api/marketplace/payments` n’exécute pas de paiement.

## Profil

POST `/api/customer` :

```json
{"name":"Utilisateur Exemple","firstName":"Utilisateur","lastName":"Exemple","phone":"000000000","email":"","address":"Adresse de test","accountType":"buyer","privacyConsent":true,"privacyVersion":"2026-10-02"}
```

`accountType` : `buyer`, `seller`, `courier`. Modifier le type ne valide pas l’identité. Pour les favoris seulement : `{"wishlistOnly":true,"wishlist":[1,2]}`.

## Catalogue

POST `/api/marketplace/catalogue` attend notamment : `id`, `seller`, `title`, `category`, `price` entier positif, `stock` entier, `visible`, `approved`, `img`, `images`, `desc`, `revision` si le produit existe. Maximum huit images différentes. `img` doit correspondre au premier élément de `images` ou être `null` pour une galerie vide. Une photo téléversée doit appartenir au même vendeur et produit. Utiliser les chemins d’images locales ou les URL retournées par l’API photos ; les URL arbitraires ne sont pas acceptées.

## Commande

POST `/api/marketplace/orders` :

```json
{"requestKey":"11111111-1111-4111-8111-111111111111","items":[{"id":1,"q":1}],"city":"Kinshasa","commune":"Gombe","address":"Adresse de test","recipient":{"name":"Destinataire Exemple","phone":"000000000"},"paymentId":"cod","delivery":{"mode":"home"}}
```

Adapter les identifiants au catalogue réellement retourné. Réutiliser la même clé après une interruption pour éviter un doublon ; générer une nouvelle clé pour une nouvelle commande. Modes : `home`, `express`, `hand`, `relay`. Le serveur recalcule les prix, le stock et les frais ; ne pas envoyer de total comme source d’autorité.

## Actions

Payload commun : `{"orderId":"YV-...","revision":1,"action":"..."}`. Toujours utiliser la révision la plus récente retournée par l’API.

| Action | Acteur | Champs supplémentaires / condition |
| --- | --- | --- |
| `seller_accept` | Vendeur concerné | `sellerId` |
| `seller_decline` | Vendeur concerné | `sellerId`, avant livraison en cours |
| `seller_prepare` | Vendeur concerné | `sellerId`, tous les vendeurs ont accepté |
| `seller_handover` | Vendeur concerné | `sellerId`, `cashCollected`, commande sans coursier |
| `courier_claim` | Livreur validé et disponible | Mission non affectée, acceptée par tous les vendeurs |
| `courier_collect` | Livreur affecté | Tous les colis préparés |
| `buyer_receipt` | Acheteur de la commande | `cashPaid`, livraison terminée |
| `cash_confirm` | Acheteur / encaisseur | `side` : `buyer`, `courier`, `seller` ; `sellerId` pour vendeur |
| `courier_expenses` | Livreur affecté | `expenses` entier positif ou nul |
| `courier_payout` | Admin | `reference`, `channel` : `mobile_money`, `bank`, `cash` ; règlement dû |

La livraison du coursier passe par POST `/api/marketplace/proof` ; ne pas envoyer `courier_deliver` directement sans photo à l’endpoint actions.

## Inscription et identité

Après création du profil vendeur / livreur, déposer un FormData dans `/api/verification` : `documentType`, `document`, `identityConfirmed=true`, `sellerPlan`, `courierPlan=standard`. Pour un vendeur : `companyName`, `companyRcm` ou `unregistered=true`. Pour un livreur : `courierBenefitsAccepted=true`, `courierPayoutMethod`, `courierPayoutAccount`. Le numéro de règlement peut être vide uniquement pour `cash`. Documents acceptés : JPG, PNG, PDF, maximum 8 Mo. Types de document : `identity`, `passport`, `licence-b`, `voter`.

Décision admin : `userId`, `decision=approve/reject`, `identityChecked`, `companyChecked` pour vendeur, `note` (obligatoire en cas de refus).

## Disponibilité et fichiers

POST `/api/marketplace/courier` :

```json
{"available":true,"payoutMethod":"cash","payoutAccount":"","benefitsAccepted":true}
```

Photos produit : FormData `productId`, `sellerId`, `photo` ; JPG, PNG ou WebP, maximum 8 Mo. Preuve de livraison : JPG ou PNG, maximum 8 Mo. `delivered` et `cashCollected` sont transmis en chaînes `true` / `false` dans le FormData.

## Evaluation

POST `/api/delivery-reviews` :

```json
{"orderId":"YV-...","sellerScores":{"1":5},"courierScore":4,"comment":"Livraison conforme."}
```

Noter tous les vendeurs de la commande (entiers 1–5). `courierScore` doit être `null` si aucun livreur n’est affecté. Le backend rattache la note à l’identité du livreur réellement affecté ; la réception doit être confirmée. Une seule évaluation par commande.

## Discussions privées

Livreur : GET `/api/courier-messages?view=courier`, POST au même endpoint avec `{"message":"Bonjour YAVIYA"}`. Admin : GET avec `courierUserId` puis POST avec `courierUserId` et `message`. Pour vendeurs, même principe avec `sellerUserId`. Maximum 2000 caractères. Le serveur décide de l’expéditeur selon les permissions.

## Erreurs usuelles

| Code | Signification / réaction |
| --- | --- |
| 400 | Données invalides : corriger le formulaire |
| 401 | Identité absente : se connecter |
| 403 | Rôle ou origine non autorisé |
| 404 | Ressource absente ou inaccessible |
| 405 | Méthode HTTP non supportée |
| 409 | Etat / révision incompatible : recharger et réessayer |
| 413 | Téléversement déclaré trop volumineux |
| 503 | Service indisponible ou paiement non activé |

Les objets d’erreur utilisent généralement `{"error":"message"}`. Les réponses complètes peuvent varier par endpoint ; consulter le handler pour les champs secondaires.
