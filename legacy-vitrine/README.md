# YAVIYA Market

Nouvelle vitrine e-commerce responsive pour **YAVIYA**, pensée comme une marketplace locale premium pour la RDC. L'interface met en avant les créateurs, les produits locaux et les garanties de confiance, avec recherche, filtres, favoris et panier interactifs.

## Lancer le site

Prérequis : Node.js 22 ou supérieur.

```bash
npm install
npm run dev
```

Ouvrir ensuite [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Commandes

```bash
npm run check  # vérifications statiques
npm test       # contrôles statiques et tests catalogue/parcours
npm run build  # copie la version publiable dans dist/
npm start      # sert la version construite
```

## Fonctionnalités

- Accueil éditorial responsive et navigation mobile.
- Catalogue filtrable par sélection et catégorie.
- Recherche instantanée, favoris et panier latéral.
- Bloc d'impact dédié aux vendeurs et artisans locaux.
- Inscription newsletter avec confirmation visuelle.
- Accessibilité de base : libellés, focus, textes alternatifs et régions dynamiques.

Les images de démonstration sont chargées depuis Unsplash. Pour une mise en production, remplacez-les par les visuels officiels des vendeurs YAVIYA et connectez le catalogue ainsi que le panier aux API métier.

## Architecture du catalogue

| Fichier | Rôle |
| --- | --- |
| `catalog/products.js` | Les huit produits de démonstration, conservés dans leur ordre original. |
| `catalog/catalog.js` | Contrat asynchrone `listProducts()`, création d'un catalogue avec un fournisseur et choix du fournisseur local. |
| `app.js` | Charge le catalogue une fois, puis gère l'affichage, la recherche, les filtres, les favoris et le panier. |
| `scripts/build.mjs` | Copie aussi le dossier `catalog/` dans `dist/`. |
| `scripts/check.mjs` | Vérifie les fichiers JavaScript et le raccordement de l'adaptateur. |
| `tests/catalog.test.mjs` | Vérifie les données, le remplacement du fournisseur et les parcours recherche/panier. |

`index.html` charge déjà `app.js` comme module. `package.json` déclare également les modules ES pour permettre aux tests Node d'importer les mêmes sources. Aucun outil de compilation ni dépendance supplémentaire n'est nécessaire.

## Futurs points d'intégration

Le point de remplacement se trouve dans `catalog/catalog.js` : substituer un fournisseur API à `localSource` dans `createCatalog(localSource)`. Le fournisseur peut être synchrone ou asynchrone ; `app.js` attend toujours `catalog.listProducts()` et reçoit des copies des produits.

Exemple de fournisseur à ajouter lorsque l'API sera disponible (l'URL et le format ci-dessous sont illustratifs) :

```js
const apiSource = {
  async listProducts() {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error(`Catalogue : HTTP ${response.status}`);
    const payload = await response.json();
    return payload.products.map(mapApiProduct);
  }
};
export const catalog = createCatalog(apiSource);
```

- **Transport et mapping** : implémenter `mapApiProduct` dans le fournisseur pour retourner `{ id, name, shop, price, tag, category, image }`. Les ID doivent rester des nombres uniques et stables ; `price` est un nombre en FC. Les filtres actuels utilisent les libellés exacts `Nouveau`, `Populaire`, `Mode`, `Beauté`, `Maison`, `Tech`. Conserver l'ordre fourni pour conserver l'ordre d'affichage.
- **Chargement et erreurs** : les erreurs du fournisseur sont propagées. Avant d'activer une API réelle, ajouter les états chargement/erreur et la relance autour du chargement dans `app.js`. Le fournisseur local actuel ne dépend d'aucun réseau.
- **Données externes** : valider les réponses et adapter le rendu par `innerHTML` à du contenu non fiable avant de brancher des champs vendeur sur une API. Les données de démonstration actuelles restent identiques.
- **Recherche et pagination serveur** : la recherche reste locale, sur le nom et la boutique, avec les règles existantes. Une pagination ou un filtrage distant nécessitera un contrat de requête supplémentaire ; `listProducts()` doit actuellement fournir la sélection complète.
- **Panier et commande** : le panier conserve ses objets produits en mémoire, y compris les ajouts multiples du même article. La persistance et la commande constituent une intégration distincte ; le backend devra vérifier prix et disponibilité au moment de commander.

Ce refactoring n'active aucune API ni paiement. Les favoris restent liés au rendu actuel et le bouton « Voir plus » conserve sa notification existante.
