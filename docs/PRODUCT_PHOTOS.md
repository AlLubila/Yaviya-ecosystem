# Photos de démonstration

Les 30 nouvelles vues sont dans `frontend/assets/images/*-angle-2.webp`. Elles complètent les photos originales pour les 39 références de chacun des deux marchés. Le mapping est dans `backend/data/market-config.json` (`productGalleries`). Les variantes sont signalées comme illustratives sur les fiches ; elles ne prouvent ni l’état ni les caractéristiques d’un article réel.

Création : outil intégré ImageGen, une génération par modèle, depuis sa photo locale originale. Consigne utilisée : une photographie catalogue du même produit depuis l’angle trois-quarts opposé (dos pour les vêtements), préserver couleur, matière, proportions et nombre de pièces, fond studio gris clair, produit entier, sans texte ni filigrane. Conversion en WebP pour le chargement, sans modifier la composition.

Les galeries personnalisées et photos téléversées ne sont pas remplacées. Le vendeur peut ajouter jusqu’à 8 photos, les réordonner et choisir la couverture. Pour un catalogue réel, demander des photos du produit réellement proposé : face, profil, arrière, détails, état et accessoires.

## Catalogue étendu (1.5.0)

Les fichiers `frontend/assets/images/catalogue-*.webp` sont les nouveaux visuels de démonstration. Chaque référence a une photo principale et une deuxième vue (`-angle-2.webp`), reliées dans `backend/data/market-config.json`. Les photos téléversées par un vendeur ne sont pas remplacées.

Visuels créés avec l’outil de génération d’images intégré. Prompts : photographie de catalogue réaliste, produit entier sur fond crème uni, lumière douce de studio, sans marque, texte ni filigrane. Sujets : batterie acoustique cinq fûts ; bague solitaire ; paire d’alliances ; micro cravate ; micro filaire avec câble ; deux micros sans fil avec récepteur ; parfum ambre ; six cuillères inox ; survêtement ; haltères et tapis ; ballon et cône ; sac scolaire bleu ; sac étudiant gris ; trois bols blancs ; pneu ; disque et plaquettes de frein ; robe en pagne ; ensemble homme en pagne ; ring light compact ; grand ring light sur pied ; panneau LED.

Pour les secondes vues, la photo principale sert de référence : conserver modèle, couleur, matière, composants et motifs ; déplacer la caméra vers l’autre côté, l’arrière (sacs et habits) ou au-dessus (bols), en gardant tout le produit visible.
