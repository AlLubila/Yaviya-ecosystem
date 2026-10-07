# Livraison et identité — 1.6.0

Les tarifs sont centralisés dans backend/data/market-config.json. Montants par colis vendeur, livraison standard. Express : supplément existant de 7 500 FC par colis ; retrait gratuit ; relais 3 500 FC par colis. Les autres villes RDC restent fermées aux commandes.

| Commune de Kinshasa | FC |
| --- | ---: |
| Barumbu | 8 000 |
| Gombe | 10 000 |
| Kinshasa | 8 000 |
| Kintambo | 10 000 |
| Lingwala | 8 000 |
| Mont-Ngafula | 7 500 |
| Ngaliema | 10 000 |
| Bandalungwa | 9 000 |
| Bumbu | 9 000 |
| Kalamu | 9 000 |
| Kasa-Vubu | 8 000 |
| Makala | 9 000 |
| Ngiri-Ngiri | 9 000 |
| Selembao | 9 000 |
| Kisenso | 10 000 |
| Lemba | 10 000 |
| Limete | 10 000 |
| Matete | 10 000 |
| Ngaba | 10 000 |
| Kimbanseke | 12 500 |
| Maluku | 12 500 |
| Masina | 12 500 |
| N’Djili | 12 500 |
| N’Sele | 12 500 |

Lubumbashi : 7 500 FC pour les sept communes, tarif pilote conservé en attendant un barème validé.

Une inscription pendant un achat produit un profil acheteur. Le choix vendeur/livreur est désactivé dans ce formulaire ; une démarche professionnelle distincte permet de soumettre le dossier. Les droits sont contrôlés sur le serveur, pas seulement par des boutons masqués.

Le pays d’émission de l’identité est distinct du pays de la boutique. La liste comprend 249 pays/territoires et le Kosovo, libellés français/anglais issus d’Intl/CLDR. Une photo JPG/PNG de moins de 8 Mo est requise. Un document déjà accepté au même format peut être réutilisé ; les PDF antérieurs doivent être remplacés par une photo. Le permis C est un type de document réservé aux livreurs, pas une obligation universelle pour tous les modes de livraison. Les pièces restent privées, accessibles au titulaire et à l’admin.

Appliquer npm run db:migrate sur la base cible pour la migration 0016. Les dossiers antérieurs incomplets perdent leurs droits professionnels jusqu’à mise à jour et nouvelle approbation manuelle. Le déploiement frontend seul ne rétablit pas une API indisponible.
