# Fil de Sable

Boutique en ligne de bijoux en macramé (bracelets, bagues, colliers), noués à la main **sur commande**.

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma 6 (sans moteur natif, adapter `pg`) · PostgreSQL · Stripe Checkout · hébergé sur Wasmer Edge.

## Démarrer

Prérequis : Node 24, PostgreSQL 16+ en local (Windows : `winget install PostgreSQL.PostgreSQL.17`).
Crée le rôle et la base avec le mot de passe de `DATABASE_URL` (fichier `.env`) :

```sql
CREATE ROLE fildesable LOGIN PASSWORD 'le-mot-de-passe-de-DATABASE_URL' CREATEDB;
CREATE DATABASE fildesable OWNER fildesable;
```

```bash
corepack enable       # active pnpm
pnpm install          # génère aussi le client Prisma
cp .env.example .env  # puis renseigne DATABASE_URL, SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD
pnpm db:migrate       # applique les migrations et lance le seed
pnpm dev              # http://localhost:3000
```

`CREATEDB` sert à `prisma migrate dev`, qui crée une base temporaire (shadow database) pour comparer les schémas.

Le seed crée un compte administrateur (e-mail et mot de passe dans `.env`), trois catégories,
dix produits et trois modes de livraison. Relance-le à tout moment avec `pnpm db:seed` (idempotent).
Il refuse un mot de passe admin faible (moins de 14 caractères, valeur connue) ; relancé, il remplace
le mot de passe admin par celui de `.env` et ferme ses sessions ouvertes.

## Sécurité

- **Authentification** : scrypt + sel, comparaison en temps constant, sessions opaques en base (cookie `httpOnly`, `SameSite=Lax`), jeton renouvelé à chaque connexion.
- **Limitation de débit** (`src/lib/security/rate-limit.ts`) : connexion 5/min par IP et verrouillage 15 min après 5 échecs sur un e-mail, inscription 5/15 min par IP, commandes 10/10 min par compte, ajouts au panier 30/min par IP. Le store est en mémoire : en multi-instances ou serverless, le remplacer par Redis (ex. `@upstash/ratelimit`). L'IP provient de `X-Forwarded-For` : l'app doit tourner derrière un proxy qui écrase cet en-tête (Vercel, Nginx…).
- **Paiement simulé** : page et Server Action désactivées dès que `NODE_ENV=production` ou `PAYMENT_PROVIDER` ≠ `mock`.
- **Stripe** : seule la route `/api/webhooks/stripe`, après vérification de la signature (`STRIPE_WEBHOOK_SECRET`) et du montant encaissé, passe une commande en « payée ». Le retour navigateur (`success_url`) n'est jamais une preuve de paiement. Les URLs de retour viennent de `APP_URL`, pas de l'en-tête `Host`.
- **Panier** : un panier rattaché à un compte n'est lisible, modifiable ou fusionnable que par ce compte.
- **Commandes** : numéros à suffixe aléatoire (`FDS-2026-X8K9MQ`), non énumérables.
- **Photos produit** : uniquement des chemins locaux `/images/…` (jpg, png, webp, avif).
- **En-têtes** : CSP stricte (hors `'unsafe-inline'` pour les scripts d'hydratation), HSTS en production, COOP/CORP, `X-Frame-Options: DENY`, pas de `X-Powered-By`.

## Ce que fait la v1

- **Accueil** : hero, sélection, catégories, « comment ça marche », accès au configurateur et au quiz.
- **Boutique** : filtres par catégorie, tri, fiches produit avec options (taille, fermoir, perle…) et prix dynamique.
- **Configurateur** : jusqu'à trois fils, une perle, un motif, une taille, aperçu SVG en direct, ajout au panier.
- **Quiz** : trois questions, recommandations par affinité de couleurs et de catégorie.
- **Panier** : invité ou connecté (rattaché au compte à la connexion), quantités, estimation de livraison.
- **Commande** : adresse, mode de livraison (franco dès 60 €), note pour l'atelier, numéro `FDS-AAAA-XXXXXX` (suffixe aléatoire).
- **Paiement** : abstraction `PaymentProvider` : `mock` (page de simulation, dev uniquement) et `stripe` (Checkout + webhook signé). Paiement relançable depuis le suivi de commande.
- **Compte** : profil, adresse retenue, commandes, suivi de fabrication (payée → en confection → prête → expédiée → livrée).
- **Admin** (`/admin`, rôle `admin`) : tableau de bord, commandes avec changement de statut + note client, produits (CRUD, options en texte).

## Structure

```
prisma/            schéma, migrations, seed
src/app/           routes (App Router)
src/components/    composants UI (serveur et client)
src/lib/           métier : auth, panier, produits, commandes, paiement, admin, configurateur
src/config/        identité de la boutique (nom, e-mail, préfixe des commandes)
public/images/     photos produits
```

## Scripts

| Commande | Rôle |
| --- | --- |
| `pnpm dev` | serveur de développement |
| `pnpm build` / `pnpm start` | build et serveur de production |
| `pnpm typecheck` | `tsc --noEmit` (lance `pnpm next typegen` avant, la première fois) |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | migration Prisma (dev) + seed |
| `pnpm db:deploy` | applique les migrations existantes (production) |
| `pnpm db:seed` | seed seul |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:reset` | remet la base à zéro |

## Tester Stripe en local

1. Crée un compte Stripe et reste en **mode test**. Copie la clé secrète `sk_test_…` dans `STRIPE_SECRET_KEY` (`.env`).
2. Installe la [Stripe CLI](https://docs.stripe.com/stripe-cli), puis `stripe login` et
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. Copie le `whsec_…` affiché dans `STRIPE_WEBHOOK_SECRET`.
3. `PAYMENT_PROVIDER="stripe"`, relance `pnpm dev`, commande et paie avec la carte de test `4242 4242 4242 4242` (date future, CVC quelconque).

## Déployer sur Wasmer Edge

La configuration est dans [`app.yaml`](app.yaml) : base PostgreSQL managée en région `fr-roub1`, `PAYMENT_PROVIDER=stripe`.
Le support Node.js de Wasmer Edge (Edge.js) est en **bêta** : teste chaque étape sur l'URL `*.wasmer.app` avant d'ouvrir la boutique.

1. **CLI** (PowerShell) : `iwr https://win.wasmer.io -useb | iex`, puis `wasmer login`.
2. **Premier déploiement** : `wasmer deploy` à la racine du projet. Choisis ton espace ; Wasmer détecte Next.js, build et crée la base Postgres.
   `wasmer app info` donne l'URL publique : ajoute-la dans `app.yaml` (`env:` → `APP_URL: https://…`).
3. **Base de production** : récupère les identifiants avec `wasmer app database list --with-password`, puis depuis ton poste :

   ```powershell
   $env:DATABASE_URL = "postgresql://UTILISATEUR:MOTDEPASSE@HOTE:PORT/BASE?sslmode=require"
   $env:SEED_ADMIN_EMAIL = "ton-adresse@exemple.fr"
   $env:SEED_ADMIN_PASSWORD = "un-mot-de-passe-de-prod-different-du-dev"
   pnpm db:deploy
   pnpm db:seed
   Remove-Item Env:DATABASE_URL, Env:SEED_ADMIN_PASSWORD
   ```

4. **Stripe** : dans le tableau de bord Stripe (mode test d'abord), **Développeurs → Webhooks → Ajouter un endpoint** :
   `https://TON-URL/api/webhooks/stripe`, événements `checkout.session.completed`,
   `checkout.session.async_payment_succeeded` et `checkout.session.async_payment_failed`. Puis :

   ```powershell
   wasmer app secrets create STRIPE_SECRET_KEY "sk_test_..."
   wasmer app secrets create STRIPE_WEBHOOK_SECRET "whsec_..."
   ```

5. **Redéploie** (`wasmer deploy`) pour prendre en compte `APP_URL` et les secrets, puis passe une commande test avec la carte `4242…`.
6. **Passage en réel** : refais l'étape 4 avec les clés `sk_live_…` et un endpoint webhook en mode live.

Limites connues : le limiteur de débit est en mémoire, propre à chaque instance (passer à Redis si l'app monte en charge) ;
la connexion à la base Wasmer est chiffrée mais sans vérification du certificat (autorité privée de Wasmer).
