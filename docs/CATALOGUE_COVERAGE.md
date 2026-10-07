# Catalogue et couverture des commandes — version 1.3.0

## Acheter maintenant

Le bouton attend une synchronisation déjà lancée au lieu de l'interpréter comme un échec. Après la connexion YAVIYA, le profil est relu explicitement et le produit est vérifié à nouveau dans le catalogue serveur. L'achat immédiat porte sur une quantité de 1 du seul produit choisi et conserve le panier existant. Un nouveau client remplit son profil puis revient au produit sélectionné. Les doubles clics sont bloqués pendant l'opération.

Si le service de compte ou de commande ne répond pas, une erreur persistante et un bouton de reprise sont affichés. Aucune commande n'est inventée ou enregistrée uniquement dans le navigateur. Il faut une base configurée, les migrations appliquées et un propriétaire créé pour le catalogue illustratif initial.

## Familles et sous-catégories

19 familles et 72 sous-catégories, présentées dans 20 sections (la Mode distingue homme et femme) : High-tech, Mode, Maison, Beauté, Enfants, Épicerie, Création, Musique, Électroménager, Bricolage, Jardin, Sport, Automobile, Bureau, Livres, Animaux, Agriculture, Professionnel et Santé.

Les familles élargies suivent une organisation de marketplace généraliste, inspirée de la [carte des catégories Allegro](https://allegro.pl/mapa-strony/kategorie) et du [répertoire Alibaba](https://sale.alibaba.com/category/products/index.html). Les intitulés français/anglais et le classement YAVIYA sont propres à ce projet.

Les vendeurs peuvent choisir toutes ces familles et une sous-catégorie dans l'éditeur avec photos multiples. Le serveur valide et conserve le classement, puis les pages de sous-catégorie ouvrent les produits correspondants. Les produits historiques sans sous-catégorie explicite restent classés par leurs catégories et titres ; les nouveaux produits non classés dans une sous-catégorie apparaissent à la racine de leur famille. Les catégories sans articles affichent un état vide ; aucun faux stock ni nouveau vendeur n'est créé.

## Villes affichées et commandes autorisées

Le répertoire comprend **96 villes et agglomérations de RDC**. Les choix sont divisés en deux groupes :

- **Commandes ouvertes : Kinshasa et Lubumbashi**. Les 24 et 7 communes existantes et leurs règles de tarifs sont conservées.
- **Extension à venir : les 94 autres destinations**. Elles sont visibles, désactivées et marquées « bientôt disponible ».

Le serveur refuse toute ville hors de la liste des deux villes ouvertes, même si une requête est construite manuellement. Cela vaut pour domicile, express, retrait chez le vendeur et point relais. Ajouter une ville au répertoire ne l'ouvre pas aux commandes. Une extension exige aussi des communes, tarifs et paramètres opérationnels valides.

Le portail République du Congo conserve Brazzaville et Pointe-Noire ; cette nouvelle restriction RDC ne lui est pas appliquée.

Les noms du répertoire rapprochent la [liste des villes](https://fr.wikipedia.org/wiki/Liste_des_villes_de_la_r%C3%A9publique_d%C3%A9mocratique_du_Congo) et les agglomérations citées aux articles 1 des décrets du Journal officiel du 20 juin 2013 ([original](https://www.leganet.cd/Legislation/JO/2013/JOS.20.06.2013.pdf), [copie consultable](https://device.report/m/ee52e10a0cec112cab1ce4e7d5fea958b8bc083e2dace25c241833e4a9ff5c75)). Les variantes courantes sont normalisées, notamment Mbuji-Mayi, Mbanza-Ngungu, Mongbwalu et Yangambi. Ce répertoire commercial ne certifie pas le statut administratif actuel de chaque agglomération : les statuts issus de 2013 ont connu des suspensions et évolutions. Il ne prétend pas recenser chaque village ou localité de RDC.

## Source unique et build

`backend/data/market-config.json` contient le répertoire, la liste des villes ouvertes et l'arbre des catégories. Le backend lit directement ce fichier. Le build génère `dist/market-config.js` à partir de la même source ; les deux pages principales le chargent avant les autres scripts. Modifier le JSON, puis reconstruire ; ne pas éditer le fichier généré.

Aucune migration SQL supplémentaire n'est requise pour les catégories et villes : le classement produit est conservé dans les données JSON existantes. Les migrations antérieures, notamment 0014 pour la 2FA, restent obligatoires sur le serveur cible.

## Vérification

`tests/checkout-flow.test.mjs` charge tous les scripts des vraies pages HTML avec jsdom, les relie aux gestionnaires API réels et à SQLite, puis teste les clics, les formulaires et les commandes enregistrées. Ce test complète les autres tests de comptes, 2FA et livraison partagée ; il n'est pas un test visuel de navigateur complet.

Il couvre la synchronisation concurrente, la reprise après le profil, l'erreur d'hébergement, le refus des destinations fermées dans les quatre modes et le classement produit administré. L'enregistrement et le suivi de commande sont validés avec une installation locale complète. Cela ne prouve pas la configuration du serveur Vercel existant.

Constat sur le déploiement consulté : `/api/auth/session` répondait HTTP 503. L'accès Vercel disponible ne renvoyait ni le projet YAVIYA ni une équipe contenant ce projet. Il faut reconnecter le compte/équipe disposant de ce projet, lire ses journaux et vérifier la connexion à la base, les migrations et le propriétaire. Le message HTTP seul ne permet pas d'attribuer précisément le problème à une variable ou une migration.

### Extension 1.5.0

Le catalogue contient 60 références par marché, dont 21 nouvelles réparties dans les boutiques existantes. Les sous-catégories des produits ajoutés ouvrent directement leur sélection. Les anciennes bases reçoivent les références manquantes sans écraser les modifications des vendeurs. Les guitares, laits de beauté et soins déjà présents restent accessibles.

Les nombres d’acheteurs du catalogue initial sont fictifs et portent la mention « démo ». Ils servent uniquement à présenter l’interface. L’API de statistiques, les tableaux de bord vendeur/admin et les commandes restent fondés sur les enregistrements réels de l’application.
