# Suivi des correctifs et bugfix — Fil de Sable

Journal de tous les petits correctifs et bugfix faits dans la conversation dédiée.
Le plus récent en haut. Chaque entrée : date, problème, cause, correctif, fichiers touchés, vérification, statut de déploiement.

**Légende des statuts :** 🟡 en cours · ✅ corrigé (local) · 🚀 déployé sur fil-de-sable.wasmer.app · ⏸️ en attente / bloqué

---

## À faire / signalés

_(bugs remontés mais pas encore traités)_

- [2026-10-15] En ligne (Wasmer), la Server Action « Ajouter au panier » met ~45 s et son `POST` répond 500 avant que le navigateur recharge `/panier` (l'article est bien ajouté) ; constaté aussi avec la version précédente sans middleware (v13), donc sans rapport avec la CSP. À diagnostiquer avec `debug.ps1` (runtime Edge.js) : rendu de `/panier` dans la réponse de l'action ?
- [2026-10-15] `/configurateur` reste sur « On noue la page… » en production : erreur `WebAssembly.Module compilation failed` (digest 345036456) au rendu, déjà présente sur 8d6cf66 (avant 309b66f). Cause non identifiée ; seul appel à la base de cette page : `getCustomizableProduct`. L'écran de chargement masque l'erreur.
- [2026-10-15] `/.well-known/security.txt` répond 404 en production : le paquet Wasmer ne contient pas le dossier `.well-known` et le routage l'exclut de l'application ; le fichier fonctionne en local avec `next start`. Piste : réécriture vers un chemin sans point.

---

## Journal

<!-- Modèle d'entrée :

### AAAA-MM-JJ — Titre court
- **Statut :** 🟡 / ✅ / 🚀 / ⏸️
- **Problème :** ce qui se passe (où, comment le reproduire)
- **Cause :** ce qui était faux
- **Correctif :** ce qui a été changé
- **Fichiers :** `src/...`
- **Vérification :** typecheck / build / test dans le navigateur / en prod
- **Notes :** points d'attention, suites éventuelles

-->

### 2026-10-15 — Suppression des produits et commandes fictifs (base locale)
- **Statut :** ✅
- **Problème :** la boutique contenait 7 fiches d'exemple et une commande de test qui ne correspondent à rien de réel.
- **Correctif :** base locale nettoyée en une transaction : produits `maree-basse`, `terre-cuite`, `nuit-d-ete`, `petite-dune`, `braise`, `horizon`, `soleil-couchant` ; commande `FDS-2026-W7GAJM` (paiement simulé) ; compte `client-test@example.test` ; 3 paniers vides. Conservés : Perle d'écume et Quartz rose (vrais bracelets, photos), Bracelet sur mesure (support du configurateur), compte admin, catégories et modes de livraison. Le seed ne recrée plus les fiches d'exemple (ni leurs options Fermoir, Perle, Tour de doigt, Longueur).
- **Fichiers :** `prisma/seed.ts` (base locale modifiée hors fichiers)
- **Vérification :** inventaire avant / après : 10 → 3 produits, 1 → 0 commande, 2 → 1 utilisateur, 0 panier · lint et typecheck OK · `/`, `/boutique`, catégories Bagues et Colliers (vides), `/boutique/perle-d-ecume`, `/quiz`, `/configurateur` répondent 200 sans erreur ni produit fictif ; `/boutique/maree-basse` → page introuvable.
- **Notes :** base de production non touchée (à nettoyer au prochain déploiement, sur accord). Les catégories Bagues et Colliers sont vides jusqu'à l'ajout de vrais articles. Non commité.

### 2026-10-15 — Aperçu photo : les perles suivent le choix argent / doré
- **Statut :** ✅
- **Problème :** dans le configurateur, en vue Photo, passer de « Perles argentées » à « Perles dorées » ne changeait rien : seules les couleurs du fil étaient repeintes.
- **Cause :** la photo ne recolorait que le fil (un seul masque) ; les perles restaient celles de la photo.
- **Correctif :** `build-photo-masks.mjs` produit aussi un masque des perles par photo (`*.perles.png` : zones claires serties dans le fil, plus quelques perles positionnées à la main), avec leur luminance de référence. `PhotoRecolor` repeint les perles en or ou en argent en gardant leur relief et leurs reflets (`PHOTO_METALS` : argent plus foncé et contrasté qu'en 3D, sinon il paraît blanc).
- **Fichiers :** `scripts/build-photo-masks.mjs`, `public/images/produits/bracelet-atelier-1.perles.png`, `public/images/produits/bracelet-atelier-2.perles.png`, `src/components/photo-recolor.tsx`, `src/lib/configurator.ts`, `src/components/configurator.tsx`
- **Vérification :** typecheck OK · lint OK · aperçus or / argent contrôlés à l'œil (18 perles photo 1, 3 perles photo 2) · navigateur : perle centrale Arabesques argent (220,224,231) → doré (250,204,112), Vagues doré (229,185,91) → argent (190,195,202), capture fil terracotta + perles dorées. Stock de test remis à zéro.
- **Notes :** non commité. Les deux petites perles dorées du fermoir (photo 1) ne sont pas repeintes. Une nouvelle photo demande de vérifier les perles détectées (aperçu `*-perles.jpg`) et d'ajouter les manquantes dans `extraBeads`.

### 2026-10-15 — Sur-mesure « revient très vite » : explication pour l'atelier
- **Statut :** ✅
- **Problème :** le sur-mesure affichait de nouveau « Le configurateur revient très vite » en local.
- **Cause :** aucune bobine en stock (stock local remis à zéro après les tests) : depuis le stock de fil, le configurateur ne s'ouvre qu'avec au moins une bobine cochée. Rien ne l'expliquait.
- **Correctif :** les visiteurs voient toujours « revient très vite » ; un admin connecté voit en plus la raison et le lien pour la régler (« coche tes bobines dans Stock de fil », ou aucun produit marqué « Produit du configurateur »).
- **Fichiers :** `src/app/configurateur/page.tsx`
- **Vérification :** typecheck OK · lint OK · en local, visiteur : message seul, sans l'indication admin. Vue admin non testée dans le navigateur (pas de session admin).
- **Notes :** pour rouvrir le sur-mesure : `/admin/fils` → cocher au moins une bobine → Enregistrer. Non commité.

### 2026-10-15 — Couleur du fil au choix sur chaque article, d'après le stock de bobines
- **Statut :** ✅
- **Problème :** chaque nouvel article devait avoir ses couleurs créées automatiquement à partir des fils disponibles (`LINHASITA_COULEURS.md` / Stock de fil), sans ressaisie.
- **Correctif :** champ `Product.threadChoice` (migration `20261015150000_product_thread_choice`, vrai par défaut, y compris pour les articles existants). Fiche produit admin : case « Couleur du fil au choix », cochée par défaut pour un nouvel article. Fiche article : choix « Couleur du fil » en pastilles, alimenté en direct par les bobines cochées dans `/admin/fils` (rien à ressaisir quand le stock change ; masqué si aucune bobine en stock). Ajout au panier : bobine obligatoire dès qu'il y en a en stock, refusée si elle a été retirée entre-temps ; le libellé (« Vert foncé · ciré n° 87 ») est enregistré dans les options de la ligne et s'affiche dans le panier, la commande et l'admin. Enregistrer le stock rafraîchit tout le site.
- **Fichiers :** `prisma/schema.prisma`, `prisma/migrations/20261015150000_product_thread_choice/migration.sql`, `src/lib/admin/actions.ts`, `src/components/admin/product-form.tsx`, `src/app/admin/produits/[id]/page.tsx`, `src/app/boutique/[slug]/page.tsx`, `src/components/add-to-cart-form.tsx`, `src/lib/cart/actions.ts`, `src/lib/threads/labels.ts`
- **Vérification :** typecheck OK · lint OK · migration appliquée en local, schéma sans écart · navigateur : `/boutique/perle-d-ecume` propose les 4 bobines de test, choix du n° 87 → panier « Couleur du fil : Vert foncé · ciré n° 87 » ; bobine retirée du stock pendant que la page est ouverte → « Cette couleur de fil n'est plus disponible ». Case admin non testée dans le navigateur (pas de session admin), couverte par le typecheck. Stock de test remis à zéro.
- **Notes :** commité et poussé sur GitHub (`73a652d`), pas encore déployé. Le serveur de dev doit être redémarré après une migration (client Prisma). La photo de l'article ne change pas encore de couleur (possible avec un masque comme pour le configurateur). Le prix ne dépend pas de la couleur. En prod : migrations à appliquer (`-Migrate`) puis cocher les bobines en ligne.

### 2026-10-15 — Configurateur : aperçu « Photo » dont seul le fil change de couleur
- **Statut :** ✅
- **Problème :** la cliente voulait proposer le vrai bracelet en photo (comme sur l'accueil) et en changer la couleur du fil depuis la photo, sans toucher aux perles.
- **Correctif :** `scripts/build-photo-masks.mjs` calcule pour chaque photo un masque du fil (teinte / saturation / luminosité propres à la photo, plus grandes zones connexes, +1 pixel pour les bords) : `bracelet-atelier-1.masque.png` (fil bleu-gris, perles nacrées) et `bracelet-atelier-2.masque.png` (fil prune, quartz rose). Composant `PhotoRecolor` (canvas) : chaque pixel du fil garde son ombre (luminance rapportée à celle du fil d'origine) et prend la couleur de la bobine choisie ; perles, coquillage et fond restent intacts. Dans le configurateur, Arabesques → photo 1 et Vagues → photo 2, avec un sélecteur **Photo / 3D** (photo par défaut) ; Tresse garde le croquis.
- **Fichiers :** `scripts/build-photo-masks.mjs`, `public/images/produits/bracelet-atelier-1.masque.png`, `public/images/produits/bracelet-atelier-2.masque.png`, `src/components/photo-recolor.tsx`, `src/lib/configurator.ts`, `src/components/configurator.tsx`
- **Vérification :** typecheck OK · lint OK · aperçus contrôlés à l'œil (corail, sable, vert) sur les deux photos · navigateur (`npm run dev`) : photo recolorée en direct au clic sur une bobine (n° 35 → fil terracotta, perles nacrées intactes), Vagues en photo, bascule 3D OK, Tresse sans sélecteur, aucune erreur console. Stock de test remis à zéro.
- **Notes :** commité et poussé sur GitHub (`73a652d`), pas encore déployé. Le choix « Perles argentées / dorées » ne change pas la photo (ce sont les perles de la photo) : sur Vagues, la photo montre du quartz rose alors que le motif 3D ne propose que or / argent, à harmoniser. Le cordon de serrage très fin de la photo 2 n'est que partiellement recoloré. Couleurs à l'écran approximatives (HEX mesurés sur photos de cartelles). Nouvelle photo = ajouter une entrée dans `PHOTOS` du script, le lancer, reporter `refLum` / `contrast` dans `PATTERN_PHOTOS`.

### 2026-10-15 — Aperçu 3D inaccessible en local : `npm run dev` ne démarrait plus
- **Statut :** ✅
- **Problème :** en local, le configurateur 3D n'était pas utilisable. `npm run dev` s'arrêtait au démarrage (« This build is using Turbopack, with a `webpack` config and no `turbopack` config »). De plus, depuis l'ajout du stock de fil, le configurateur est remplacé par « revient très vite » tant qu'aucune bobine n'est cochée.
- **Cause :** Next 16.4.1 (version installée ; `package.json` indique 16.4.0) refuse de lancer Turbopack quand `next.config.ts` contient une fonction `webpack()` (préfixe `c-` des chunks pour Wasmer). Le build de prod utilisait déjà `--webpack`, pas le dev.
- **Correctif :** script `dev` → `prisma generate && next dev --webpack` (même compilateur qu'en prod).
- **Fichiers :** `package.json`
- **Vérification :** `npm run dev` démarre (« Next.js 16.4.1 (webpack) ») ; `/configurateur` : modèles Arabesques (`bracelet-perle-d-ecume.glb`) et Vagues (`quartz-rose/bracelet.gltf` + textures) chargés en 200, rendu 3D affiché.
- **Notes :** commité et poussé sur GitHub (`73a652d`). Pour voir le configurateur en local, cocher au moins une bobine dans `/admin/fils`. Écart de version Next entre `package.json` (16.4.0) et `node_modules` (16.4.1) à surveiller. En prod, `/configurateur` a un autre problème (voir « À faire »).

### 2026-10-15 — Stock de fil Linhasita : bobines cochées dans l'admin, seules proposées au configurateur
- **Statut :** ✅
- **Problème :** le configurateur proposait une palette fixe de 12 couleurs inventées, sans lien avec les bobines réellement présentes à l'atelier.
- **Correctif :** nouvelle table `ThreadColor` avec les 333 coloris de `LINHASITA_COULEURS.md` (170 Encerado, 9 PE pailletés, 154 Bonderizado), insérés par la migration elle-même (générée par `scripts/import-linhasita.mjs`), tous « hors stock » au départ. Page admin **Stock de fil** (`/admin/fils`) : cases à cocher par gamme et famille, recherche par **code Linhasita** (`224`, plusieurs codes `224, 37, M19`, « 4 » trouve aussi « 04 ») ou par teinte / HEX, bouton « Cocher les N résultats », « Tout cocher » par famille, filtre « Seulement mes bobines », compteur et alerte de modifications non enregistrées. Le configurateur ne montre que les bobines en stock (teinte + référence, ex. « Turquoise · ciré n° 224 ») et affiche « Le configurateur revient très vite » s'il n'y en a aucune. À l'ajout au panier, le serveur refuse un fil retiré du stock entre-temps et enregistre la couleur et le libellé de la bobine depuis la base : panier, commande et admin indiquent quelle bobine utiliser. Les anciens paniers et commandes gardent leurs noms de couleurs.
- **Fichiers :** `prisma/schema.prisma`, `prisma/migrations/20261015140000_thread_stock/migration.sql`, `scripts/import-linhasita.mjs`, `src/lib/threads/labels.ts`, `src/lib/threads/queries.ts`, `src/lib/admin/actions.ts`, `src/app/admin/fils/page.tsx`, `src/app/admin/layout.tsx`, `src/components/admin/thread-stock-form.tsx`, `src/lib/configurator.ts`, `src/lib/types.ts`, `src/lib/cart/actions.ts`, `src/components/configurator.tsx`, `src/app/configurateur/page.tsx`
- **Vérification :** typecheck OK · lint OK · migration appliquée en local, schéma sans écart (`migrate diff` vide) · navigateur (dev local, admin de test temporaire supprimé ensuite) : recherche `224` → 2 bobines (ciré et polyamide), `218, 37 m19 4` → 7 bobines dans les 3 gammes, enregistrement puis rechargement conservent les cases, le configurateur affiche exactement les 8 bobines cochées ; 3 fils choisis → libellés et prix OK ; fil retiré du stock avant l'envoi → refusé avec message ; ajout au panier → « Fils : Beige · ciré Palha, Turquoise · ciré n° 224 » ; stock vide → message d'attente.
- **Notes :** commité et poussé sur GitHub (`73a652d`), pas encore déployé. Stock local remis à zéro : à cocher dans `/admin/fils`. Au déploiement, la migration doit passer en prod (`deploy.ps1 -Migrate`), puis cocher les bobines **sur le site en ligne**, sinon le configurateur y affichera « revient très vite ». Ajoute une requête à `/configurateur`, page qui a déjà un souci en prod (voir « À faire »). Le contrôle du stock se fait à l'ajout au panier, pas au paiement. L'ancien `src/data/linhasita-colors.json` (autre conversation) n'est pas utilisé.

### 2026-10-15 — Mention « fil de qualité premium, résistant à l'eau et à l'usure »
- **Statut :** ✅
- **Problème :** le site ne mettait pas en avant la qualité du fil.
- **Correctif :** ajout de « Tissé uniquement avec du fil de qualité premium, résistant à l'eau et à l'usure. » sous le titre de l'accueil ; sur les fiches produit, la ligne « Fil ciré, résiste à l'eau. Sans métal. » devient « Tissé uniquement avec du fil de qualité premium, résistant à l'eau et à l'usure. Sans métal. »
- **Fichiers :** `src/app/page.tsx`, `src/app/boutique/[slug]/page.tsx`
- **Vérification :** typecheck OK · en local (port 3000), texte présent sur `/` et `/boutique/perle-d-ecume`.
- **Notes :** commité et poussé sur GitHub (`73a652d`), pas encore déployé.

### 2026-10-15 — CSP à nonce : `'unsafe-inline'` retiré de `script-src` (middleware edge)
- **Statut :** 🚀
- **Problème :** la CSP gardait `'unsafe-inline'` dans `script-src` (scripts d'hydratation de Next sans nonce) : un script inline injecté dans une page serait exécuté. Dernier point ouvert de l'audit (couche 3).
- **Cause :** CSP statique dans `headers()` de `next.config.ts` : impossible d'y mettre un nonce différent à chaque requête.
- **Correctif :** `src/middleware.ts` (guide Next « Content Security Policy ») tire un nonce de 128 bits par requête (WebCrypto), pose `script-src 'self' 'nonce-…' 'strict-dynamic'` (`'unsafe-eval'` en dev seulement, autres directives inchangées) et transmet le nonce par les en-têtes de requête `x-nonce` et `Content-Security-Policy` ; matcher excluant `_next/static`, `_next/image`, `favicon.ico`, `robots.txt`, `.well-known`, `images/`, `api/webhooks` et les préchargements. Directives partagées dans `src/lib/security/csp.ts`. `next.config.ts` garde une CSP de repli (avec `'unsafe-inline'`) que le middleware remplace quand il s'exécute (une seule CSP envoyée). Convention `middleware.ts` (dépréciée dans Next 16) et non `proxy.ts` : le serveur de `next-bundle` 1.0.0 (Wasmer) n'exécute que les middlewares en runtime edge, un proxy Node est ignoré sans erreur (vérifié en reproduisant l'empaquetage en local). Config `fil-de-sable-prod-3002` ajoutée à `.claude/launch.json` (le port 3001 était occupé par un `next start` d'une autre conversation).
- **Fichiers :** `src/middleware.ts`, `src/lib/security/csp.ts`, `next.config.ts`, `.claude/launch.json`, `README.md`, `AUDIT-SECURITE.md`
- **Vérification :** typecheck OK · lint OK · build OK (toutes les routes en ƒ, « ƒ Proxy (Middleware) », chemins statiques Wasmer OK, avertissement de dépréciation attendu) · `next start` port 3002 : une seule CSP par réponse, avec nonce et sans `'unsafe-inline'` sur `/` et `/connexion`, CSP de repli sur `robots.txt` et les préchargements · navigateur : `/`, `/boutique`, `/boutique/perle-d-ecume`, `/configurateur`, `/quiz`, `/connexion`, `/panier`, 404 en flux : tous les scripts portent le nonce de l'en-tête, aucune violation en console (console testée : un `onclick` injecté est bien bloqué et journalisé), ajout au panier (Server Action) OK, navigation client OK, bracelet au survol OK · en prod : CSP à nonce sur `/`, `/connexion` et une fiche produit, CSP de repli sur un préchargement et sur le webhook Stripe ; accueil, boutique et fiche produit sans violation, navigation client et survol OK ; sondes du déploiement toutes vertes.
- **Notes :** déployé le 2026-10-15 (commit `8d6cf66`, version Wasmer `dav_R8EIJtWuW3dd`) depuis la branche `csp-nonce-middleware` = HEAD de `main` (`0adce62`) + ces 4 fichiers de code, créée dans un worktree temporaire pour ne pas embarquer les modifications non commitées de `main` (correctifs de l'audit, bracelet 3D en cours). `main` a ensuite été avancé en fast-forward sur ce commit (la branche `csp-nonce-middleware`, identique, peut être supprimée) ; les docs de ce correctif restent à commiter avec celles de l'audit. Retour en arrière immédiat si besoin : `wasmer app version activate dav_KgYIZtZuk0yx` (v13). Plus tard : renommer en `proxy.ts` quand `next-bundle` exécutera les proxys Node (voir `AUDIT-SECURITE.md`, suites).

### 2026-10-15 — Audit de sécurité : Next 16.4.1 et durcissement couche par couche
- **Statut :** ✅
- **Problème :** Next.js 16.4.0 est visé par trois avis de sécurité publiés le 14/10/2026 (DoS des Server Actions sans contournement, RCE de l'optimiseur d'images, RCE `use cache`). L'audit (skills `security-and-hardening` et `security-review`, guides Next.js, `npm audit`) a aussi relevé des jetons de session en clair en base, des cookies sans préfixe `__Host-` sur un domaine partagé, un webhook Stripe qui chargeait tout le corps avant de contrôler sa taille, un optimiseur d'images ouvert à tout `/public`, des Server Actions à 1 Mo et des mots de passe triviaux acceptés.
- **Cause :** version de Next antérieure aux correctifs ; durcissements jamais faits (le reste du code était déjà sain : contrôles d'accès, validation, paiement).
- **Correctif :** Next 16.4.1, React 19.3.1, `eslint-config-next` 16.4.1, zod 4.6.7 ; empreinte SHA-256 des jetons de session en base ; cookies `__Host-` en production via `src/lib/security/cookies.ts` ; corps du webhook lu en flux et plafonné à 512 Ko ; `images.localPatterns`, `serverActions.bodySizeLimit` 200 Ko, `script-src-attr 'none'`, `Permissions-Policy` complétée ; liste de mots de passe interdits ; `server-only` sur les modules de données ; `DB_SSL_CA` optionnel ; `robots.txt` et `security.txt`. Rapport complet dans `AUDIT-SECURITE.md`.
- **Fichiers :** `package.json`, `package-lock.json`, `next.config.ts`, `src/lib/security/cookies.ts`, `src/lib/auth/session.ts`, `src/lib/auth/actions.ts`, `src/lib/auth/password-policy.ts`, `src/lib/cart/cart.ts`, `src/lib/db.ts`, `src/app/api/webhooks/stripe/route.ts`, `src/lib/orders/queries.ts`, `src/lib/orders/checkout.ts`, `src/lib/products/queries.ts`, `src/lib/shipping.ts`, `src/lib/payment/provider.ts`, `src/lib/payment/stripe.ts`, `src/lib/payment/confirm.ts`, `src/lib/security/rate-limit.ts`, `public/robots.txt`, `public/.well-known/security.txt`, `.env.example`, `README.md`, `AUDIT-SECURITE.md`
- **Vérification :** typecheck OK · lint OK · build OK · `next start` local en production : en-têtes (CSP, HSTS, Permissions-Policy…), optimiseur d'images bloqué hors `/images/**`, `robots.txt` et `security.txt` servis, `/admin` anonyme sans fuite, inscription (mot de passe faible refusé, mot de passe fort accepté), connexion avec cookie `__Host-`, session stockée hachée en base (64 caractères), déconnexion ; webhook Stripe 413 sur 1 Mio (Content-Length et chunked), 400 sur signature fausse · non déployé.
- **Notes :** à la mise en ligne, tout le monde se reconnecte une fois (nouveaux cookies, jetons hachés) et les paniers invités sont perdus. `npm audit` garde 8 alertes « high » toutes en outillage de dev (`braces`, `deepmerge-ts`), sans correctif amont : acceptées, à revoir le 2026-11-15.

### 2026-10-15 — Classe CSS collée sur les liens de l'en-tête
- **Statut :** 🚀
- **Problème :** les liens de navigation de l'en-tête avaient la classe `shrink-0whitespace-nowrap` (espace manquant), introduite avec l'ajout de `vine` : ni `shrink-0` ni `whitespace-nowrap` ne s'appliquaient, les liens pouvaient se couper sur mobile.
- **Correctif :** espace rétabli (`vine shrink-0 whitespace-nowrap`).
- **Fichiers :** `src/components/site-header.tsx`
- **Vérification :** typecheck OK · lint OK · build OK · en prod, la classe collée n'apparaît plus dans le HTML.
- **Notes :** déployé le 2026-10-15 (`13f6e87`), avec le bracelet de macramé au survol (`vine-weave.tsx`, travail d'une autre conversation).

### 2026-10-15 — Déploiement : contrôles des pages protégées et des fichiers statiques
- **Statut :** ✅
- **Problème :** les sondes du skill `deploy-wasmer` ne vérifiaient que le code HTTP des pages : elles n'ont vu ni la navigation morte, ni la fuite de `/admin`, et signalaient à tort un 500 au premier appel d'une instance qui démarre.
- **Correctif :** après déploiement, le script vérifie chaque fichier JS/CSS de l'accueil, ouvre `/admin`, `/compte`, `/commande`… sans session et échoue si du contenu réservé apparaît, et retente une fois une page en 5xx.
- **Fichiers :** `.claude/skills/deploy-wasmer/scripts/deploy.ps1`, `.claude/skills/deploy-wasmer/SKILL.md`
- **Vérification :** contrôle des 6 pages protégées exécuté sur le site en ligne : 0 erreur ; déploiements `5435d47`, `cc6794e`, `ed9723b` passés par le script.

### 2026-10-15 — Fuite du tableau de bord admin vers les visiteurs non connectés
- **Statut :** 🚀
- **Problème :** `/admin` ouvert sans être connecté renvoyait le contenu du tableau de bord (compteurs, chiffre d'affaires, dernières commandes) avant de rediriger vers `/connexion`. Introduit par l'écran de chargement ci-dessous.
- **Cause :** avec `loading.tsx`, la page est envoyée en flux : la page se rend en parallèle de `admin/layout.tsx`, qui était le seul à appeler `requireAdmin()`.
- **Correctif :** `requireAdmin()` en première ligne de chaque page admin, et dans `getAdminOrders`, `getAdminOrder`, `getAdminStats`.
- **Fichiers :** `src/app/admin/page.tsx`, `src/app/admin/commandes/page.tsx`, `src/app/admin/commandes/[id]/page.tsx`, `src/app/admin/produits/page.tsx`, `src/app/admin/produits/[id]/page.tsx`, `src/app/admin/produits/nouveau/page.tsx`, `src/lib/orders/queries.ts`
- **Vérification :** typecheck OK · lint OK · build OK · en prod, les 6 pages protégées ouvertes en anonyme ne contiennent aucun contenu réservé.
- **Notes :** déployé le 2026-10-15 (`ed9723b`). Exposition d'environ 8 min entre `cc6794e` et `ed9723b` ; la base de production ne contenait alors aucune commande ni aucun client (seulement le compte admin).

### 2026-10-15 — Écran de chargement immédiat au clic sur un lien
- **Statut :** 🚀
- **Problème :** après un clic, rien ne bougeait pendant 2 à 10 s (rendu lent chez Wasmer) : les boutons semblaient ne pas fonctionner.
- **Correctif :** `loading.tsx` à la racine affiche « On noue la page… » avec le fil animé (animation coupée si l'utilisateur réduit les animations).
- **Fichiers :** `src/app/loading.tsx`, `src/app/loading.module.css`
- **Vérification :** build OK · en prod, l'écran s'affiche dès le clic sur « Voir la boutique » puis la page arrive.
- **Notes :** déployé le 2026-10-15 (`cc6794e`). Effet de bord : les pages protégées et les produits inexistants répondent 200 (redirection / « introuvable » dans le flux) au lieu de 307 / 404.

### 2026-10-15 — Liens du site inopérants hors page d'accueil
- **Statut :** 🚀
- **Problème :** en ligne, un clic sur un lien (Boutique, L'atelier…) ne menait nulle part ; console : `ChunkLoadError: Loading chunk 500 failed`.
- **Cause :** `next-bundle` (empaquetage Wasmer) applique ses routes d'erreur `/500` et `/404/?` sans ancrage, donc à tout chemin qui *contient* `/500` : le fichier `/_next/static/chunks/500-<hash>.js` était servi en erreur 500.
- **Correctif :** tous les chunks JS côté navigateur sont préfixés `c-` (modèles de nom fixes dans `next.config.ts`) ; `scripts/check-static-paths.mjs`, lancé par `npm run build`, échoue si une URL statique contient `/404` ou `/500`.
- **Fichiers :** `next.config.ts`, `package.json`, `scripts/check-static-paths.mjs`
- **Vérification :** build OK · navigation testée en local (`next start`) sur 5 liens sans rechargement ni erreur · en prod, clic Accueil → Boutique sans rechargement, `c-500-….js` servi en 200.
- **Notes :** déployé le 2026-10-15 (`5435d47`, après un premier essai incomplet `aa02500`).

### 2026-10-15 — Lien Facebook à la place d'Instagram
- **Statut :** 🚀
- **Problème :** le pied de page et la page L'atelier renvoyaient vers Instagram (`instagram.com/fildesable`).
- **Correctif :** remplacé par un lien « Facebook » vers https://www.facebook.com/schweitzer.nathalie.9 ; le réglage `instagram` de la config devient `facebook` (URL complète).
- **Fichiers :** `src/config/site.ts`, `src/components/site-footer.tsx`, `src/app/atelier/page.tsx`
- **Vérification :** typecheck OK · `/` et `/atelier` chargées en local (port 3001) puis en prod : lien Facebook présent, plus aucune mention d'Instagram.
- **Notes :** déployé le 2026-10-15 (`13f6e87`).

### 2026-10-15 — Mention « Fait main en Alsace par Nathalie » en pied de page
- **Statut :** 🚀
- **Problème :** le bas de page affichait « © 2026 Fil de Sable. Fait main en France. »
- **Correctif :** texte remplacé par « © 2026 Fil de Sable. Fait main en Alsace par Nathalie » (l'année reste calculée automatiquement).
- **Fichiers :** `src/components/site-footer.tsx`
- **Vérification :** nouveau texte présent dans le HTML, en local (port 3001) puis en prod.
- **Notes :** déployé le 2026-10-15 (`13f6e87`).

### 2026-10-15 — Skill de remplissage automatique du suivi
- **Statut :** ✅
- **Correctif :** ajout du skill `suivi-correctifs`, qui met ce fichier à jour après chaque correctif, signalement ou déploiement.
- **Fichiers :** `.claude/skills/suivi-correctifs/SKILL.md`

### 2026-10-15 — Création du fichier de suivi
- **Statut :** ✅
- **Correctif :** création de `SUIVI-CORRECTIFS.md` pour tracer tous les correctifs à venir.

---

## Rappels utiles

- Stack : Next.js 16.4 (lire `node_modules/next/dist/docs/` avant de coder), React 19.3, Prisma 6 + Postgres, Stripe, Tailwind 4.
- Vérifs avant déploiement : `npm run typecheck`, `npm run lint`, `npm run build` (build en `--webpack`).
- Postgres local portable : à démarrer manuellement après un redémarrage.
- Déploiement : skill `deploy-wasmer` → fil-de-sable.wasmer.app.
- Pages protégées : appeler `requireAdmin()` / `requireUser()` dans **chaque page**, pas seulement dans le layout (rendu en flux à cause de `loading.tsx`).
- Ne pas défaire le préfixe `c-` des chunks dans `next.config.ts` : `next-bundle` sert en erreur toute URL contenant `/500` ou `/404`.
- `next-bundle` 1.0.0 (Wasmer) n'exécute que les middlewares en runtime edge : la CSP à nonce vit dans `src/middleware.ts` (convention dépréciée) ; un `proxy.ts` Next 16 (toujours Node) serait ignoré en ligne, les `headers()` de `next.config.ts` s'appliquent bien. Reproduire l'empaquetage en local : `npx next-bundle@1.0.0 . --skip-build` puis `node .next-bundle/server.mjs` (sous Windows les pages répondent 500, traces non retrouvées, mais les en-têtes et le routage restent observables) ; supprimer `.next-bundle/` ensuite avec `cmd /c rmdir /s /q .next-bundle` (liens symboliques, non suivi par git).
- Retour en arrière instantané d'un déploiement, sans rebuild : `wasmer app version list sharsstech/fil-de-sable` puis `wasmer app version activate <id>`.
