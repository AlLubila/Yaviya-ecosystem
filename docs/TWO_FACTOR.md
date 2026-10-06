# Double authentification YAVIYA (1.2.0)

## Configuration de l'installation

1. Générer une clé aléatoire de 32 octets dans un terminal de confiance :

   ```bash
   node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex")+"\n")'
   ```

2. Placer cette valeur hexadécimale de 64 caractères dans `MFA_ENCRYPTION_KEY`, côté serveur uniquement : `.env` pour le local, paramètres du projet Vercel pour le déploiement. Ne pas la copier dans GitHub, une variable frontend, un ticket ou des journaux. La conserver dans un gestionnaire de secrets avec une sauvegarde sécurisée. Chaque environnement et sa base doivent utiliser leur propre clé stable.
3. Exécuter `npm run db:migrate` sur la base cible avant de déployer cette version ; la migration `0014_two_factor_auth.sql` ajoute les tables et colonnes nécessaires. Le serveur local applique les migrations au démarrage.
4. Déployer le code, ouvrir le site et cliquer sur **Sécurité · 2FA** dans l'en-tête. Sans la clé, l'activation est indisponible ; aucun secret n'est enregistré en clair. Si la clé est perdue ou incorrecte, les codes de l’application ne peuvent plus être validés. Un code de secours valide reste utilisable après le premier facteur pour accéder au compte et désactiver la 2FA.

La clé doit rester identique pour déchiffrer les secrets existants. Une rotation exige un outil de migration sécurisé déchiffrant avec l'ancienne clé puis rechiffrant avec la nouvelle ; changer simplement la variable verrouillerait les utilisateurs. Cet outil n'est pas inclus.

## Parcours utilisateur

- Se connecter, ouvrir **Sécurité · 2FA**, confirmer son mot de passe, puis activer. Pour Google, confirmer une connexion Google récente (moins de 5 minutes).
- Scanner le QR code avec Google Authenticator, Microsoft Authenticator ou une application TOTP compatible. Une clé manuelle est aussi disponible. Le QR code est généré localement côté serveur, sans service tiers.
- Saisir un code à 6 chiffres pour terminer l'activation sous 10 minutes. Avant cette validation, la 2FA reste désactivée. La fermeture permet de recommencer.
- Télécharger les **8 codes de secours**, affichés une seule fois. Chaque code est utilisable une fois et remplace le second facteur après le mot de passe ou Google.
- Lors des connexions suivantes, fournir le mot de passe ou Google, puis un code de l'application ou un code de secours. Aucune session complète n'est délivrée avant cette seconde étape. Un code TOTP déjà utilisé exige d'attendre le prochain code (30 secondes).
- Renouveler les codes ou désactiver exige à nouveau le mot de passe (ou Google récent) et un second facteur valide. Les anciens codes, sessions et connexions en attente sont invalidés. Le navigateur courant reçoit une nouvelle session.

Le choix est individuel pour les comptes acheteur, vendeur, livreur et administrateur. La 2FA n'est pas automatiquement obligatoire pour un rôle. Aucun SMS, e-mail ou service de paiement n'est requis.

## API

Toutes les réponses d'authentification portent `Cache-Control: no-store`. Les mutations exigent une origine identique et du JSON.

| Route sous `/api/auth/` | Méthode | Données / résultat |
| --- | --- | --- |
| `mfa-status` | GET | Session requise ; état, disponibilité, nombre de codes restants et type de compte Google. Jamais le secret. |
| `mfa-setup` | POST | Session + `password` si compte classique ; retourne clé manuelle et QR PNG, configuration valable 10 minutes. |
| `mfa-enable` | POST | Session + `password` si classique + `code` TOTP ; active, invalide les anciennes sessions et retourne 8 codes. |
| `mfa-challenge` | GET | Indique si le cookie de connexion contient une étape 2FA en attente, sans identité ni secret. |
| `mfa-verify` | POST | Cookie de challenge + `code` ; retourne une session uniquement après validation. |
| `mfa-recovery` | POST | Session + confirmation du premier facteur + `code` ; remplace les 8 codes et renouvelle la session. |
| `mfa-disable` | POST | Session + confirmation du premier facteur + `code` ; désactive et renouvelle la session. |

`login` renvoie `{ "requiresTwoFactor": true }` et un cookie temporaire `yaviya_mfa` pour un compte protégé, sans cookie de session utilisable. Après Google, le callback redirige vers `?mfa=1` et le frontend ouvre la même vérification. Les cookies sont HttpOnly, SameSite=Lax et Secure en HTTPS. Le challenge expire après 5 minutes, accepte au plus 5 essais et n'est utilisable qu'une fois. Les tentatives de facteur et de gestion sont limitées à 10 par compte et par IP sur 15 minutes, même en recréant un challenge.

## Conservation et garanties testées

TOTP RFC 6238 : SHA1, 6 chiffres, période de 30 secondes et tolérance d'une période. Le secret aléatoire de 160 bits est chiffré avec AES-256-GCM et associé à l'identifiant du compte. Les codes de secours aléatoires de 80 bits sont hachés avec SHA-256 et associés au compte. Les codes TOTP et de secours sont consommés par SQL conditionnel atomique ; les modifications des facteurs utilisent des générations et des transactions afin de rejeter les opérations concurrentes devenues obsolètes.

Les anciennes sessions restent rejetées si leur génération ne correspond plus au facteur actif, même lors d'une course avec l'activation. Les sessions et codes d'un compte ne donnent pas accès à un autre compte. La déconnexion annule aussi le challenge du navigateur. Les secrets et codes ne sont jamais écrits dans les journaux de l'application.

`npm test` couvre les vecteurs officiels RFC, l'enrôlement, le chiffrement, les connexions, le rejeu, la concurrence, les codes de secours, la rotation, la désactivation, l'expiration et les limitations. La validation de Google réelle nécessite les identifiants OAuth sur l'environnement cible. Le code livré ne prouve pas la configuration du projet Vercel existant.

En cas de perte du téléphone, utiliser un code de secours puis renouveler les codes ou désactiver avec la confirmation requise. Il n'existe pas de réinitialisation automatique contournant le second facteur ; si tous les facteurs sont perdus, une procédure de vérification d'identité administrative reste à définir avant une ouverture publique.

Références : [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238.html), [OTPAuth](https://github.com/hectorm/otpauth), [OWASP MFA](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html).
