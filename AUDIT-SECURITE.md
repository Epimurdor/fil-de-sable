# Audit de sécurité — Fil du Sable

Date : 2026-10-15 · Périmètre : tout le code du dépôt (Next.js 16 App Router, Prisma/PostgreSQL, Stripe), la configuration (`next.config.ts`, `.env*`) et les dépendances npm.

Méthode : lecture intégrale du code couche par couche, confrontée à trois référentiels :
- le skill **security-and-hardening** (Addy Osmani, 60 K installations) : menaces STRIDE, OWASP Top 10, triage des audits de dépendances ;
- le skill **security-review** (Sentry, 20 K installations) : fiches OWASP par thème (authentification, CSRF, XSS, configuration, chaîne d'approvisionnement, logique métier, cryptographie) ;
- les guides de sécurité de Next.js 16.4 livrés avec le paquet (`data-security`, `content-security-policy`, `serverActions`, `proxy`).
Plus `npm audit`, les avis de sécurité GitHub de Next.js et la vérification des versions publiées.

Légende : ✔️ déjà en place · ✅ corrigé dans cet audit · ⚠️ risque accepté ou point d'attention · 🔜 suite recommandée

## Résumé

| Gravité | Constat | Décision |
| --- | --- | --- |
| **Critique / Haute** | Next.js 16.4.0 concerné par les avis du 14/10/2026 (DoS des Server Actions sans contournement, RCE de l'optimiseur d'images) | ✅ Next 16.4.1, React 19.3.1, `eslint-config-next` 16.4.1 |
| Haute (outils de dev) | 8 alertes `npm audit` (`braces`, `deepmerge-ts`), toutes dans ESLint et la CLI Prisma, jamais embarquées en production, sans correctif amont | ⚠️ acceptées, revue le 2026-11-15 |
| Moyenne | Jetons de session stockés en clair en base | ✅ empreinte SHA-256 en base, jeton uniquement dans le cookie |
| Moyenne | Cookies sans préfixe `__Host-` sur un domaine partagé (`*.onrender.com`) | ✅ `__Host-fds_session` / `__Host-fds_cart` en production |
| Moyenne | Webhook Stripe : corps entièrement chargé en mémoire avant le contrôle de taille | ✅ lecture en flux plafonnée à 512 Ko, `Content-Length` contrôlé d'abord |
| Faible | Optimiseur d'images ouvert à tout fichier de `/public`, Server Actions à 1 Mo, CSP sans `script-src-attr`, mots de passe triviaux acceptés, modules de données sans garde `server-only` | ✅ corrigés |
| Faible | `'unsafe-inline'` dans `script-src` (scripts d'hydratation de Next sans nonce) | ✅ CSP à nonce via `src/middleware.ts` (runtime edge), vérifiée en local et en ligne (`8d6cf66`) · ⚠️ convention `middleware.ts` dépréciée dans Next 16, migration vers `proxy.ts` à faire |
| Info | Pas de `robots.txt` ni de `security.txt`, TLS base sans option de vérification | ✅ ajoutés (`DB_SSL_CA` optionnel) |

Rien de critique n'était exploitable dans le code applicatif lui-même : les contrôles d'accès, la validation des entrées, le paiement et le panier étaient déjà corrects. Le risque réel venait de la version de Next.js.

## Couche 1 — Dépendances et chaîne d'approvisionnement

- ✅ **Next.js 16.4.0 → 16.4.1.** Trois avis publiés le 14/10/2026 :
  - GHSA-p3m5-59mp-jv5r (Haute, CVSS 8.2) : déni de service par CPU via les Server Actions, « aucun contournement hormis la mise à jour ». Le site utilise l'App Router et des Server Actions : **concerné**.
  - GHSA-2464-fhr4-w9xw (Critique, CVSS 9.5, CVE-2026-96889) : exécution de code à distance dans l'optimisation d'images (bibliothèque `sharp`) sous Linux glibc. Le contournement (`sharp` ≥ 0.35.5) était déjà satisfait par le lockfile. Mise à jour faite par précaution.
  - GHSA-673q-mjm6-r5xr (Critique) : RCE dans les fonctions `use cache` renvoyant des tableaux typés. Le site n'utilise pas `use cache` : non concerné.
  - React 19.3.0 → 19.3.1 (publié le même jour, « Improve transport protocol » des Server Components), `zod` 4.6.5 → 4.6.7.
- ⚠️ **`npm audit` : 8 alertes « high », toutes en développement.** `braces` ≤ 3.0.3 (via `eslint-config-next` → `fast-glob` → `micromatch`) et `deepmerge-ts` < 8 (via `prisma` → `@prisma/config`) : épuisement de pile sur des motifs forgés. Ces paquets ne tournent que dans ESLint et la CLI Prisma sur le poste du développeur ou dans le build ; ils ne sont pas dans le bundle serveur. Aucun correctif amont : `braces` 3.0.3 est la dernière version publiée, et `deepmerge-ts` 8 n'arrive qu'avec Prisma 7 (migration majeure). **Décision : acceptées, à revérifier le 2026-11-15** (`npm audit`, `npm view prisma version`).
- ✔️ Lockfile `package-lock.json` versionné, versions exactes pour `next`, `react`, `react-dom`, `@prisma/adapter-pg`.
- ✔️ Scripts d'installation filtrés : le champ `allowScripts` de `package.json` n'autorise que `prisma` et `@prisma/engines` ; npm signale et bloque les autres (`@prisma/client`, `unrs-resolver`), ce qui est le comportement voulu.
- ✔️ Aucune dépendance exotique : `next`, `react`, `prisma`, `stripe`, `zod`, `lucide-react`, `tailwindcss`.
- 🔜 Lancer `npm audit` et `npm outdated` avant chaque mise en ligne (ajouté au README).

## Couche 2 — Secrets et configuration

- ✔️ `.env*` ignorés par git (`.gitignore`), seul `.env.example` est suivi ; vérifié avec `git ls-files` et `git check-ignore`. Aucun secret dans l'historique récent, aucune clé Stripe (`sk_`, `whsec_`) dans les fichiers locaux.
- ✔️ Les secrets (Stripe, base) passent par les variables d'environnement Render, jamais par un fichier versionné.
- ✔️ Aucune variable `NEXT_PUBLIC_*` : rien de serveur n'est inliné côté navigateur. `process.env` n'est lu que dans `src/lib` (base, Stripe, paiement) et `next.config.ts`.
- ✔️ Le seed refuse un mot de passe admin faible (14 caractères minimum, 3 classes, liste de valeurs connues) et révoque les sessions admin à chaque relance.
- ⚠️ **`.env.production.local` sur ce poste** contient l'e-mail et le mot de passe admin de production en clair (ignoré par git, jamais déployé). Next le charge aussi lors d'un `next build`/`next start` local. À supprimer ou à déplacer dans un gestionnaire de mots de passe après usage ; en cas de doute sur le poste, changer le mot de passe admin (relancer le seed en production avec un nouveau `SEED_ADMIN_PASSWORD`).
- ✅ `DB_SSL_CA` (optionnel) documenté dans `.env.example`.

## Couche 3 — Transport et en-têtes HTTP

- ✔️ HSTS 2 ans + `includeSubDomains` + `preload` en production, `upgrade-insecure-requests`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` + `frame-ancestors 'none'`, COOP/CORP `same-origin`, pas de `X-Powered-By`, `X-DNS-Prefetch-Control: off`, `X-Permitted-Cross-Domain-Policies: none`.
- ✔️ CSP : `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self' https://checkout.stripe.com`, images et polices locales uniquement, `'unsafe-eval'` seulement en développement.
- ✅ `script-src-attr 'none'` : un gestionnaire injecté dans un attribut (`<img onerror=…>`) est bloqué, y compris sous la CSP de repli qui garde `'unsafe-inline'`. React n'émet jamais d'attribut `on*`.
- ✅ `Permissions-Policy` complétée (`browsing-topics`, `interest-cohort`).
- ✅ **CSP à nonce** (`src/middleware.ts`, runtime edge, directives partagées dans `src/lib/security/csp.ts`, guide Next.js « Content Security Policy ») : un nonce de 128 bits est tiré à chaque requête (WebCrypto), `script-src 'self' 'nonce-…' 'strict-dynamic'` (`'unsafe-eval'` en développement seulement), nonce transmis par les en-têtes de requête `x-nonce` et `Content-Security-Policy`, où Next.js le lit pour le poser sur tous ses scripts (runtime, chunks, hydratation inline). Le middleware ne tourne pas sur `_next/static`, `_next/image`, `favicon.ico`, `robots.txt`, `.well-known`, `images/`, `api/webhooks` ni sur les préchargements de `next/link`. Toutes les routes sont en rendu dynamique (`ƒ` dans la sortie du build), condition du nonce.
- ⚠️ **Convention `middleware.ts` (dépréciée dans Next 16) plutôt que `proxy.ts`.** Le middleware tourne en runtime edge (APIs web uniquement), avec un avertissement de dépréciation à chaque build ; migration vers `proxy.ts` (export `proxy`) à faire. `next.config.ts` garde une CSP de repli identique à l'ancienne (`'unsafe-inline'`) pour les chemins exclus du matcher et pour tout hébergeur qui n'exécuterait pas le middleware ; quand il s'exécute, son en-tête remplace celui de la config : une seule CSP est envoyée dans tous les cas.
- ✔️ Cookies `Secure` en production, `SameSite=Lax`, `httpOnly`.

## Couche 4 — Authentification et sessions

- ✔️ scrypt (sel 16 octets, clé 64 octets) via `node:crypto`, comparaison en temps constant, hachage factice quand le compte n'existe pas (ni énumération par le temps, ni par le message).
- ✔️ Jeton de session de 256 bits (`randomBytes(32)`), rotation à chaque connexion (l'ancien jeton du navigateur est révoqué : pas de fixation), expiration 30 jours, sessions expirées purgées, déconnexion côté serveur.
- ✔️ Limitation de débit avant tout calcul scrypt : 5 connexions/min par IP, verrouillage 15 min après 5 échecs sur un e-mail (que le compte existe ou non), 5 inscriptions/15 min par IP.
- ✔️ Redirections `next=` assainies (`sanitizeNextUrl`) : chemins relatifs uniquement, `//`, `\`, retours à la ligne et origines étrangères rejetés. Testé mentalement contre `/\t/evil.com`, `/%2F%2Fevil.com`, `/@evil.com` : tous restent sur le site.
- ✅ **Empreinte des jetons en base** (`src/lib/auth/session.ts`) : la table `Session` ne contient plus que le SHA-256 du jeton. Une fuite de la base (sauvegarde, accès hébergeur, injection future) ne permet plus de rejouer une session. Effet de bord à la mise en ligne : les sessions ouvertes sont invalidées, chacun se reconnecte une fois.
- ✅ **Préfixe `__Host-`** (`src/lib/security/cookies.ts`) : le navigateur refuse tout cookie `__Host-fds_session` qui ne serait pas `Secure`, `Path=/` et sans `Domain`. Un autre site hébergé sur `*.onrender.com` ne peut donc pas imposer un cookie de session ou de panier à `fil-de-sable.onrender.com`. Effet à la mise en ligne : les paniers invités en cours sont perdus (nouveau nom de cookie).
- ✅ **Mots de passe courants refusés** à l'inscription (`password`, `motdepasse`, `12345678`, `azerty123`…, caractère répété, mot de passe égal à l'e-mail).
- ⚠️ scrypt utilise le coût par défaut de Node (N = 2^14). OWASP recommande 2^17. Le format stocké (`sel:clé`) ne porte pas les paramètres. 🔜 Format versionné + re-hachage à la connexion, après mesure du temps de connexion en production.
- ⚠️ Le verrouillage par e-mail protège contre la force brute mais permet de bloquer un compte précis (dont l'admin) 15 minutes en envoyant 5 mauvais mots de passe. Compromis assumé ; la parade complète est un CAPTCHA ou une seconde authentification (🔜).
- ⚠️ L'inscription indique qu'un compte existe déjà (« Un compte existe déjà avec cette adresse »). Faire autrement impose un envoi d'e-mail de confirmation, que le site n'a pas.
- ⚠️ L'IP vient de `X-Forwarded-For` (première valeur) : falsifiable si l'hébergeur n'écrase pas cet en-tête ; les limites par e-mail et par compte restent effectives dans tous les cas.
- 🔜 Pas de 2FA pour le compte admin, pas de changement ni de réinitialisation de mot de passe (pas d'infrastructure e-mail), pas de délai d'inactivité.

## Couche 5 — Autorisation et Server Actions

- ✔️ Chaque Server Action revérifie elle-même l'authentification et la propriété de la ressource (`requireUser`/`requireAdmin`, `findFirst({ id, userId })`), conformément au guide Next.js : `startPayment`, `confirmMockPayment`, `placeOrder`, `updateCartItem`, `removeCartItem`, `saveProduct`, `deleteProduct`, `updateOrderStatus`.
- ✔️ Chaque page protégée appelle `requireAdmin()`/`requireUser()` en première ligne (correctif du 15/10 : le rendu en flux de `loading.tsx` rend le contrôle dans le layout insuffisant), et les lectures admin (`getAdminOrders`, `getAdminOrder`, `getAdminStats`) revérifient le rôle.
- ✔️ CSRF : Server Actions en POST uniquement, en-tête `Origin` comparé à `Host` par Next.js, cookies `SameSite=Lax`. Déconnexion via un formulaire POST, pas un lien GET.
- ✔️ Aucun identifiant sensible exposé au client : `getCurrentUser` ne sélectionne que `id, email, firstName, lastName, role` ; `passwordHash` ne quitte jamais `login()`.
- ✔️ Paramètres d'URL (`[slug]`, `[number]`, `[id]`, `?categorie=`, `?statut=`) utilisés uniquement dans des requêtes Prisma paramétrées, jamais dans du HTML brut.
- ✅ `experimental.serverActions.bodySizeLimit = 200kb` (le plus gros formulaire, produit admin, pèse ~10 Ko).
- ✅ `import "server-only"` sur les modules d'accès aux données (`session`, `cart`, `orders/queries`, `orders/checkout`, `products/queries`, `shipping`, `payment/*`, `rate-limit`, `security/cookies`) : une importation accidentelle depuis un composant client fait échouer le build. `db.ts` et `password.ts` en sont exclus car le seed Prisma les exécute hors Next.

## Couche 6 — Validation des entrées et XSS

- ✔️ Toutes les entrées passent par Zod avec longueurs maximales (e-mail 254, mot de passe 128, adresse 200, note 500, description produit 3000, options 5000) ; quantités bornées à 10 ; configuration du bracelet validée contre les listes autorisées (`.strict()`, couleurs dans la palette, taille maximale 2 000 caractères) ; clés `__proto__`/`constructor`/`prototype` filtrées dans les options.
- ✔️ Aucun `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `$queryRaw`, `child_process` dans `src/`. Les couleurs injectées dans `style={{ backgroundColor }}` proviennent d'une liste fermée ou d'un hex validé par regex.
- ✔️ Photos produit : chemin local `/images/…` validé par regex (`isLocalImagePath`) côté admin et à l'affichage ; aucune URL externe, pas de pistage.
- ✅ `images.localPatterns: /images/**` : l'optimiseur `/_next/image` refuse tout autre chemin de `/public`, tout paramètre de requête et les SVG (`dangerouslyAllowSVG: false` explicite).
- ✔️ Pas de téléversement de fichiers (les photos sont déposées dans le dépôt).

## Couche 7 — Paiement

- ✔️ Prix recalculés côté serveur à la commande depuis le catalogue (jamais depuis le panier ni le formulaire), livraison recalculée, total vérifié ; aucune remise manipulable.
- ✔️ Stripe : seul le webhook signé (`constructEventAsync`, tolérance 5 min) passe une commande en « payée », après contrôle du montant **et** de la devise ; passage `pending → paid` atomique et idempotent (`updateMany` conditionnel dans une transaction) : un événement rejoué ne fait rien. Le retour navigateur `success_url` n'est jamais une preuve. `APP_URL` est imposé en `https` en production et jamais déduit de `Host`.
- ✔️ Paiement simulé impossible en production (`isMockPaymentEnabled` vérifie `NODE_ENV` et `PAYMENT_PROVIDER` dans l'action elle-même, pas seulement dans la page) ; une commande ne se paie qu'auprès du fournisseur avec lequel elle a été créée.
- ✅ Corps du webhook lu en flux et plafonné à 512 Ko (`Content-Length` d'abord, puis le flux lui-même pour les envois par morceaux) : un corps de 100 Mo n'est plus chargé en mémoire avant le 413.
- ✔️ Relance de paiement limitée à 10 par 10 min et par compte ; commandes limitées à 10 par 10 min.

## Couche 8 — Base de données

- ✔️ Prisma uniquement, requêtes paramétrées, pas de SQL brut ; pool de 5 connexions ; migrations versionnées ; contraintes d'unicité (`email`, `token`, `slug`, `number`, `code`) et suppressions en cascade cohérentes (les commandes gardent un instantané des produits).
- ✔️ Numéros de commande aléatoires (alphabet sans ambiguïté, 6 caractères, réessai sur collision) : ni énumération, ni estimation du volume de ventes.
- ⚠️ Connexion à la base Supabase chiffrée ; sans `DB_SSL_CA`, le certificat n'est pas vérifié. ✅ `DB_SSL_CA` permet la vérification complète avec le certificat racine fourni par Supabase.

## Couche 9 — Panier et logique métier

- ✔️ Un panier rattaché à un compte n'est lisible, modifiable ou fusionnable que par ce compte ; un cookie pointant vers le panier d'un autre client est ignoré puis effacé ; la fusion ne touche que les paniers invités (`userId: null`).
- ✔️ Quantités bornées (1 à 10), articles inactifs refusés à la commande, panier vidé dans la même transaction que la création de la commande.
- ✔️ Ajouts au panier limités à 30/min par IP (chaque ajout peut créer une ligne en base).
- Remarque (hors sécurité) : si une option produit disparaît après l'ajout au panier, le prix retombe silencieusement sur le prix de base du produit au moment de la commande. À surveiller si les options évoluent souvent.

## Couche 10 — Erreurs et journalisation

- ✔️ Next.js masque les piles d'appels en production ; les erreurs de paiement sont journalisées côté serveur (`console.error`) et l'utilisateur ne voit qu'un message générique.
- ✔️ Aucun mot de passe, jeton ou clé dans les journaux ; Prisma ne journalise que les erreurs en production.
- 🔜 Pas de journal d'audit des actions admin (changement de statut, suppression de produit) au-delà des `OrderEvent`. Suffisant pour une boutique à un seul administrateur.

## Couche 11 — Hébergement et déploiement

- ✅ `public/robots.txt` : pages privées (`/admin`, `/compte`, `/panier`, `/commande`, `/paiement`, `/connexion`, `/inscription`, `/api`) exclues des moteurs.
- ✅ `public/.well-known/security.txt` (RFC 9116) : contact `fildesable@gmail.com`, expiration 2027-10-14 (à renouveler).
- ⚠️ Limiteur de débit en mémoire : remis à zéro à chaque mise en veille de l'offre gratuite Render, et propre à chaque instance (si les instances se multiplient, les limites aussi). Passer à un store partagé (Redis) le jour où l'app monte en charge.
- ⚠️ Les skills installés pour cet audit se trouvent dans `.agents/skills/` (liens dans `.claude/skills/`). Le skill `security-review` de Sentry est noté « Critical Risk » par l'évaluateur automatique de skills.sh (1 alerte Socket) ; son contenu a été lu : uniquement des fiches de référence OWASP, aucun script. À garder comme documentation ou à supprimer (`npx skills remove`), au choix.

## Couche 12 — Données personnelles

- ✔️ Collecte minimale : nom, e-mail, adresse de livraison, téléphone facultatif, note de commande. Pas de données de paiement (portées par Stripe), pas d'analytics, pas de tiers.
- 🔜 Pas de suppression de compte ni d'export des données à la demande (droits RGPD) ; à prévoir avant une ouverture large : suppression du compte + anonymisation des commandes passées.

## Vérification (2026-10-15)

- `npm run typecheck` OK · `npm run lint` OK · `npm run build` OK (webpack, toutes les routes en rendu dynamique).
- `next start` local en mode production (port 3001) :
  - en-têtes sur `/` : CSP avec `script-src-attr 'none'`, `Permissions-Policy` complète, HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, COOP/CORP, `X-Permitted-Cross-Domain-Policies`, pas de `X-Powered-By`, `Cache-Control: private, no-store` ;
  - `/_next/image?url=/favicon.ico…` → 400, `/_next/image?url=/images/produits/bracelet-atelier-1.jpg…` → 200, la même image avec `?x=1` → 400 ;
  - `/robots.txt` et `/.well-known/security.txt` → 200 ;
  - `/admin` en visiteur anonyme : aucun contenu réservé dans la réponse, redirection vers `/connexion` dans le flux ;
  - inscription : `password1` refusé avec le message prévu ; mot de passe fort accepté → `/compte` affiché, donc cookie `__Host-fds_session` accepté par Chromium ; en base, la nouvelle session est stockée sur 64 caractères hexadécimaux (empreinte) là où l'ancienne en faisait 43 (jeton brut) ; déconnexion → en-tête « Connexion », puis `/compte` redirige vers `/connexion`.
- Webhook Stripe (second `next start` lancé avec un secret factice) : corps de 1 Mio avec `Content-Length` → 413 ; 1 Mio en transfert par morceaux → 413 ; petit corps à signature fausse → 400 « Signature invalide » ; sans signature → 400.
- `npm audit` final : 8 « high », toutes dans `eslint-config-next` (`braces`) et `prisma` (`deepmerge-ts`), outillage de développement uniquement.
- Non vérifié : le comportement en ligne (aucun déploiement dans cet audit), voir « Mise en ligne ».

## Vérification complémentaire (2026-10-15, CSP à nonce)

- `npm run typecheck` OK · `npm run lint` OK · `npm run build` OK (toutes les routes en `ƒ`, ligne « ƒ Proxy (Middleware) » ; deux avertissements attendus : dépréciation de `middleware.ts`, et `process.cwd` référencé par `next/server` dans le runtime edge, code non exécuté par le middleware). Les contrôles ci-dessous ont été faits d'abord avec un `proxy.ts` (Node), puis refaits avec `middleware.ts` (edge) : mêmes résultats.
- `next start` local (port 3002) : sur `/` et `/connexion`, un seul en-tête `Content-Security-Policy`, avec `'nonce-…' 'strict-dynamic'` et sans `'unsafe-inline'` dans `script-src` ; `robots.txt` et une requête de préchargement (`Next-Router-Prefetch: 1`) reçoivent la CSP de repli ; `x-nonce` n'apparaît pas dans les réponses.
- Navigateur (Chromium) sur `/`, `/boutique`, `/boutique/perle-d-ecume`, `/configurateur`, `/quiz`, `/connexion`, `/panier` et une fiche inexistante (404 en flux) : tous les scripts de chaque page (9 à 21, inline compris) portent le nonce de l'en-tête (comparé par `fetch` sur la même réponse), aucune violation en console. La console capture bien les violations : un `onclick` injecté pour le test est refusé par `script-src-attr 'none'` et journalisé.
- Server Action « Ajouter au panier » : redirection vers `/panier`, « Panier (1) » dans l'en-tête, puis « Retirer » OK ; navigation client Panier → Boutique sans rechargement (chunks chargés à la demande sous `'strict-dynamic'`) ; bracelet de macramé au survol (`vine-weave.tsx`, SVG construit par le DOM) intact.
- En ligne (déploiement `8d6cf66`, ancien hébergement) : sur `/`, `/connexion` et `/boutique/perle-d-ecume`, un seul en-tête CSP avec `'nonce-…' 'strict-dynamic'` ; une requête de préchargement et le webhook Stripe (`POST` sans signature → 400) reçoivent la CSP de repli ; dans Chromium, tous les scripts de l'accueil, de la boutique et d'une fiche produit portent le nonce de l'en-tête, aucune violation, navigation client sans rechargement, bracelet au survol OK.

## Mise en ligne

Après la mise en ligne (push sur `main`, Render) : tout le monde se reconnecte une fois (nouveaux cookies `__Host-`, jetons hachés), les paniers invités en cours sont perdus. Vérifier dans le navigateur que le cookie de session s'appelle `__Host-fds_session` et que `/_next/image?url=/favicon.ico&w=64&q=75` répond 400. Après chaque mise en ligne, contrôler que la CSP à nonce est bien servie (`curl -sI https://fil-de-sable.onrender.com/connexion` : `'nonce-'` dans `Content-Security-Policy`) ; si seule la CSP de repli (`'unsafe-inline'`) apparaît, le middleware n'a pas été exécuté.

## Suites recommandées (par priorité)

1. **CSP à nonce : migrer vers `proxy.ts`** : renommer le fichier, exporter `proxy` (`node:crypto` redevient possible), puis vérifier en ligne que `'nonce-'` est toujours dans la CSP.
2. **Admin** : seconde authentification (TOTP) ou au minimum une liste d'IP autorisées sur `/admin`, et réauthentification avant les actions sensibles.
3. **Comptes** : changement et réinitialisation de mot de passe (nécessite un envoi d'e-mail), suppression de compte (RGPD).
4. **scrypt** : format de hachage versionné et coût relevé après mesure en production.
5. **Dépendances** : revue mensuelle (`npm audit`, `npm outdated`) ; migration Prisma 7, qui résoudra `deepmerge-ts`.
