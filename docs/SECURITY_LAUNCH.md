# YAVIYA — sécurité et services de lancement

## État appliqué

- RLS : 26 tables métier publiques et 27 tables internes protégées.
- Le schéma `runtime` est privé. Sa politique autorise uniquement le rôle serveur `yaviya_runtime`; les contrôles de propriétaire restent dans l’API existante. Ce n’est pas encore une isolation SQL par JWT pour cette API.
- Les accès d’un administrateur de production aux API métier sont refusés tant que sa 2FA TOTP n’est pas activée. L’écran Sécurité reste accessible pour l’activer. Les sessions sont invalidées par changement de génération MFA.
- Storage : `product-images` public, `identity-documents` et `delivery-proofs` privés.
- Upstash : limite atomique de 20 requêtes d’authentification par IP et minute, activée lorsque les deux secrets REST sont configurés. Si Redis configuré tombe en panne, les connexions sensibles sont refusées temporairement. Les limites PostgreSQL existantes sont conservées. Ce contrôle applicatif ne remplace pas un pare-feu DDoS.
- Connexion SMS : `/api/auth/phone-send` et `/api/auth/phone-verify` utilisent Supabase Auth. Seul un numéro confirmé par Supabase peut ouvrir une session YAVIYA. Les ID et comptes existants sont conservés. L’inscription e-mail et la connexion par mot de passe utilisent encore l’authentification existante.

## Activation fournisseur

1. Configurer un fournisseur SMS dans Supabase Auth (Twilio ou un Send SMS Hook pour fournisseur local), activer le téléphone, vérifier la livraison en RDC et République du Congo. Ne pas configurer de code OTP fixe en production.
2. Le projet Supabase et sa clé publique sont configurés dans `backend/data/supabase-public.json`. Les variables `SUPABASE_URL` et `SUPABASE_ANON_KEY` peuvent les remplacer côté serveur. Aucune clé de service n’est publiée. Le fournisseur SMS reste désactivé dans Supabase au contrôle du 8 octobre 2026.
3. Ajouter `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` comme secrets de production, puis redéployer.
4. Tester avec de vrais numéros autorisés, y compris expiration, mauvais code, renvoi et limites de débit.

## Sauvegardes renforcées

Le PITR est un module payant Supabase : son activation nécessite l’acceptation du coût et le dimensionnement compatible. Il n’est pas activé par ce changement.

Prévoir une rétention selon l’objectif métier, une copie chiffrée hors du projet, un stockage privé dédié et un test de restauration périodique. Les exports contiennent des données personnelles et ne doivent jamais être ajoutés au dépôt public.

Les sauvegardes PostgreSQL ne sauvegardent pas les fichiers de Storage. Sauvegarder séparément les photos, pièces d’identité et preuves de livraison, avec chiffrement et contrôle d’accès.

## Migration restante

Migrer progressivement les comptes e-mail et sessions existantes vers Supabase Auth/JWT, relier les profils métier aux identités Auth, puis adapter l’API au contexte JWT et aux politiques de propriétaire. Les Edge Functions de paiement, commissions et webhooks attendent les contrats et API des opérateurs; aucune somme réelle ne doit être transférée avant leur validation.

La réduction du temps de développement de 50 % est un objectif de planification, pas un résultat démontré.

## Pont JWT livré

L’API accepte une identité Supabase validée par `/auth/v1/user`. Une identité e-mail ou téléphone non confirmée est refusée. `/api/auth/supabase-session` associe cette identité au compte YAVIYA existant et déclenche son second facteur si nécessaire. Les JWT ne sont pas simplement décodés et aucune autorisation n’utilise les métadonnées modifiables par le client. Un token Supabase seul ne contourne pas une 2FA YAVIYA active.

Le formulaire e-mail/mot de passe et les comptes historiques ne sont pas encore remplacés par Supabase Auth. Ce pont prépare leur migration progressive; il ne constitue pas une migration complète.

Contrôle fournisseur : l’e-mail est activé avec confirmation, le téléphone et Google Supabase sont désactivés. Aucun SMS réel ne peut être envoyé sans activation et identifiants Twilio/fournisseur local. Aucun compte Upstash accessible n’a été trouvé.
