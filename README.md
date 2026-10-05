# YAVIYA — Projet complet v30

Frontend de la version 30, réorganisé selon la structure demandée, et backend accompagné de sa documentation.

## Structure

| Fichier / dossier | Rôle |
| --- | --- |
| `index.html` | Page principale |
| `styles.css` | Styles et adaptation mobile |
| `script.js` | Point d’entrée JavaScript ; charge les modules dans leur ordre original |
| `assets/` | Toutes les images |
| `assets/js/` | Modules JavaScript détaillés, conservés pour préserver le fonctionnement |
| `aide.html`, `confidentialite.html`, `publicite.html`, `congo.html` | Pages complémentaires |
| `backend/` | Code serveur, schéma, migrations et documentation des API |

Le fichier `script.js` charge les fichiers de `assets/js/` : ils font partie du projet et doivent rester présents. Le bootstrap de pays se charge dans le head pour initialiser le marché avant les autres modules.

## Lancer le frontend en local

1. Décompresser tout le ZIP, sans déplacer les fichiers séparément.
2. Installer Python 3 si nécessaire.
3. Ouvrir un terminal dans le dossier contenant `index.html`.
4. Exécuter :

```sh
python -m http.server 8000
```

5. Ouvrir http://localhost:8000 dans le navigateur.

Sous certains systèmes, utiliser `python3` au lieu de `python`. Arrêter avec Ctrl+C. Ne pas ouvrir directement le fichier avec `file://`.

Ce serveur simple affiche le frontend et les images. Il ne fournit pas les API : les comptes enregistrés, commandes partagées, vérifications, missions et discussions nécessitent le backend configuré. Les messages d’indisponibilité de ces services sont attendus dans cette prévisualisation locale. Aucun faux backend n’est ajouté.

## Backend et documentation

Commencer par `backend/README.md`, puis `backend/docs/INSTALLATION.md` et `backend/docs/API.md`. Le backend utilise un Worker avec D1 et R2 ; ce n’est pas un serveur Node/Express à lancer avec `node index.js`. L’authentification de l’hébergement actuel doit être adaptée si le projet est déplacé.

Pour préparer le serveur seul :

```sh
cd backend
npm ci
npm run build
```

Pour intégrer les pages et images au Worker : créer `backend/frontend/` et y copier `index.html`, `styles.css`, `script.js`, toutes les autres pages HTML et le dossier `assets/`. Puis relancer le build depuis `backend/`. Les pages et API doivent être servies sur la même origine.

Le serveur exporté accepte les chemins `assets/` pour les images locales ; son catalogue illustratif et son script de build ont été ajustés à cette organisation. Ces changements concernent uniquement ce paquet, pas le site publié. Il n’inclut aucune donnée privée ni valeur secrète.

Paiements électroniques et escrow : non activés. Les règlements manuels restent déclaratifs. Voir les limites et la recette dans `backend/docs/VERIFICATIONS.md`.

## Version et vérifications

Base : version publiée 30, commit `abdf4fbee5a2fbab0387cd0ce2435498b64073fc`.
Les références de fichiers et la syntaxe JavaScript ont été vérifiées après réorganisation. Aucun test complet dans un navigateur n’a été réalisé pour cette nouvelle disposition.
