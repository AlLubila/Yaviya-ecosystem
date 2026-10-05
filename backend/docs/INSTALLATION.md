# Installation et intégration

## Préparer le code

Depuis la racine du dossier extrait :

```sh
npm ci
npm run build
```

`npm ci` installe les dépendances Drizzle selon le lockfile. Le script de build nécessite seulement Node.js avec prise en charge des modules ESM. Le résultat est `dist/server/index.js`, exportant un objet avec `fetch(request, env)`.

Cette commande prépare le code ; elle ne démarre pas de serveur, ne crée pas de ressources cloud et ne déploie pas le site.

## Ressources nécessaires

| Nom dans `env` | Ressource attendue |
| --- | --- |
| `DB` | Base D1 compatible avec `prepare`, `bind`, `first`, `all`, `run`, `batch` |
| `IDENTITY_FILES` | Stockage R2 compatible avec `put`, `get`, `delete` et métadonnées HTTP |
| `OWNER_ACCOUNT_EMAIL` | E-mail du propriétaire utilisé pour initialiser l’administrateur |

Créer les ressources dans l’environnement cible, puis appliquer les onze migrations SQL du dossier `drizzle/` dans l’ordre, de `0000` à `0010`, une seule fois. Utiliser un suivi de migrations. Ne pas réappliquer l’ensemble sur une base existante. Les métadonnées Drizzle sont fournies pour poursuivre les évolutions du schéma.

`db/schema.ts` décrit les tables mais ne crée pas automatiquement la base. `.env.example` donne les noms des variables ; le Worker ne charge pas de fichier `.env` lui-même.

## Authentification : intégration obligatoire hors de l’hébergement actuel

Le code lit `oai-authenticated-user-id` et, pour le bootstrap propriétaire, `oai-authenticated-user-email`. Sur le site actuel, l’hébergement authentifié fournit ces en-têtes.

Sur un autre hébergement, le développeur doit vérifier la session ou le jeton côté serveur, supprimer tout en-tête d’identité fourni directement par le visiteur, puis construire une identité de confiance pour les handlers. Ne pas considérer un simple en-tête envoyé par le navigateur comme une preuve d’identité. Ne pas placer l’identifiant d’un administrateur dans le JavaScript public.

Le Worker livré ne crée ni mot de passe ni session et ne valide pas de JWT autonome. Publier le code tel quel sur un nouvel hébergement sans cette couche d’authentification ne fournit pas un système de connexion sûr.

Initialiser l’administration avec `POST /api/verification/bootstrap` depuis une session dont l’e-mail vérifié correspond à `OWNER_ACCOUNT_EMAIL`. Le résultat est enregistré dans `admin_access` avec l’id `owner`. Une fois cet enregistrement présent, le bootstrap ne réattribue pas l’administration.

## Ajouter le frontend déjà fourni

Copier le contenu du dossier `frontend/` du ZIP frontend dans un dossier `frontend/` à la racine de ce backend, puis relancer `npm run build`. Le script intègre les fichiers publics au Worker.

Sans ce dossier, les API restent présentes, mais les pages et images statiques répondent 404. Avec le dossier, le routeur peut servir à la fois l’interface et les API.

Le frontend appelle `/api/...` sur sa propre origine. Le servir avec le backend sur une origine commune. Les mutations vérifient que l’en-tête `Origin` correspond à l’origine de la requête ; aucune politique CORS entre domaines distincts n’est implémentée.

## Deux pays

Le paramètre `country=CG` est traité par le routeur en préfixant l’identité interne avec `cg:`. Sans ce paramètre, les API utilisent la RDC (`CD`). Le backend sépare les catalogues et commandes par pays. Les identifiants des boutiques enregistrées exposés au frontend sont l’id SQLite + 10000.

## Limites actuelles

- Paiements Mobile Money, cartes et escrow : à intégrer à un prestataire.
- Abonnements : choix de formule enregistré, sans facturation automatique.
- Transport : suivi et preuve photo ; aucune connexion à une flotte externe.
- Yavicoins : endpoint de démonstration, montant d’achat fourni par le client ; à recalculer depuis les commandes côté serveur avant utilisation commerciale.
- Notifications : l’interface utilise notamment des actualisations périodiques ; aucun service de push mobile n’est livré.
- Les anciens endpoints `/api/demo-delivery` conservent des scénarios individuels, distincts des commandes partagées.
