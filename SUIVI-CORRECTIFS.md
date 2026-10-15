# Suivi des correctifs et bugfix — Fil de Sable

Journal de tous les petits correctifs et bugfix faits dans la conversation dédiée.
Le plus récent en haut. Chaque entrée : date, problème, cause, correctif, fichiers touchés, vérification, statut de déploiement.

**Légende des statuts :** 🟡 en cours · ✅ corrigé (local) · 🚀 déployé sur fil-de-sable.wasmer.app · ⏸️ en attente / bloqué

---

## À faire / signalés

_(bugs remontés mais pas encore traités)_

- …

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
