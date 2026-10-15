# Fil du Sable

Boutique en ligne de bijoux en macramé (bracelets, bagues, colliers), noués à la main **sur commande**.

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma 6 (sans moteur natif, adapter `pg`) · PostgreSQL (Supabase) · Stripe Checkout · hébergé sur Render.

## Démarrer

Prérequis : Node 24, PostgreSQL 16+ en local (Windows : `winget install PostgreSQL.PostgreSQL.17`).
Crée le rôle et la base avec le mot de passe de `DATABASE_URL` (fichier `.env`) :

```sql
CREATE ROLE fildesable LOGIN PASSWORD 'le-mot-de-passe-de-DATABASE_URL' CREATEDB;
CREATE DATABASE fildesable OWNER fildesable;
```

```bash
npm install           # le client Prisma est généré par dev/build/typecheck (pas de postinstall)
cp .env.example .env  # puis renseigne DATABASE_URL, SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD
npm run db:migrate       # applique les migrations et lance le seed
npm run dev           # http://localhost:3000
```

`CREATEDB` sert à `prisma migrate dev`, qui crée une base temporaire (shadow database) pour comparer les schémas.

Le seed crée un compte administrateur (e-mail et mot de passe dans `.env`), trois catégories,
dix produits et trois modes de livraison. Relance-le à tout moment avec `npm run db:seed` (idempotent).
Il refuse un mot de passe admin faible (moins de 14 caractères, valeur connue) ; relancé, il remplace
le mot de passe admin par celui de `.env` et ferme ses sessions ouvertes.

## Sécurité

Le détail de l'audit (couche par couche, risques acceptés, suites) est dans [`AUDIT-SECURITE.md`](AUDIT-SECURITE.md).

- **Authentification** : scrypt + sel, comparaison en temps constant, mots de passe courants refusés (`src/lib/auth/password-policy.ts`), sessions opaques en base : le cookie porte le jeton, la base n'en garde que l'empreinte SHA-256. Cookies `httpOnly`, `SameSite=Lax`, `Secure` et préfixe `__Host-` en production (`src/lib/security/cookies.ts`), jeton renouvelé à chaque connexion.
- **Limitation de débit** (`src/lib/security/rate-limit.ts`) : connexion 5/min par IP et verrouillage 15 min après 5 échecs sur un e-mail, inscription 5/15 min par IP, commandes 10/10 min par compte, ajouts au panier 30/min par IP. Le store est en mémoire : en multi-instances ou serverless, le remplacer par Redis (ex. `@upstash/ratelimit`). L'IP provient de `X-Forwarded-For` : l'app doit tourner derrière un proxy qui écrase cet en-tête (Vercel, Nginx…).
- **Paiement simulé** : page et Server Action désactivées dès que `NODE_ENV=production` ou `PAYMENT_PROVIDER` ≠ `mock`.
- **Stripe** : seule la route `/api/webhooks/stripe`, après vérification de la signature (`STRIPE_WEBHOOK_SECRET`) et du montant encaissé, passe une commande en « payée ». Corps lu en flux et plafonné à 512 Ko. Le retour navigateur (`success_url`) n'est jamais une preuve de paiement. Les URLs de retour viennent de `APP_URL`, pas de l'en-tête `Host`.
- **Server Actions** : authentification et propriété revérifiées dans chaque action, corps limité à 200 Ko (`experimental.serverActions.bodySizeLimit`), modules d'accès aux données marqués `server-only`.
- **Panier** : un panier rattaché à un compte n'est lisible, modifiable ou fusionnable que par ce compte.
- **Commandes** : numéros à suffixe aléatoire (`FDS-2026-X8K9MQ`), non énumérables.
- **Photos produit** : uniquement des chemins locaux `/images/…` (jpg, png, webp, avif) ; l'optimiseur d'images (`/_next/image`) n'accepte que ces chemins (`images.localPatterns`), jamais de SVG ni d'URL externe.
- **En-têtes** : CSP à nonce posée par `src/middleware.ts` (runtime edge) : un nonce aléatoire par requête remplace `'unsafe-inline'` dans `script-src` (`'strict-dynamic'`, `script-src-attr 'none'`) ; toutes les pages sont rendues à la demande, condition du nonce. Les directives sont dans `src/lib/security/csp.ts`. `next.config.ts` garde une CSP de repli (avec `'unsafe-inline'`) pour les chemins et hébergeurs où le middleware ne s'exécute pas ; quand il s'exécute, son en-tête remplace celui de la config (une seule CSP envoyée). La convention `middleware.ts` est dépréciée dans Next 16 (avertissement au build) : migration vers `proxy.ts` à prévoir. HSTS en production, COOP/CORP, `X-Frame-Options: DENY`, `Permissions-Policy`, pas de `X-Powered-By`.
- **Dépendances** : `npm audit` et `npm outdated` avant chaque mise en ligne ; les scripts d'installation des paquets sont filtrés par `allowScripts` (`package.json`). Next.js doit rester ≥ 16.4.1 (avis de sécurité du 14/10/2026 : RCE dans l'optimisation d'images, DoS des Server Actions).
- **Base de données** : connexion TLS ; `DB_SSL_CA` (certificat racine PEM) active la vérification de la chaîne quand l'hébergeur la fournit.
- **Divers** : `public/robots.txt` exclut les pages privées des moteurs ; `public/.well-known/security.txt` indique le contact sécurité.

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
| `npm run dev` | serveur de développement |
| `npm run build` / `npm run start` | build et serveur de production |
| `npm run typecheck` | `tsc --noEmit` (lance `npx next typegen` avant, la première fois) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | migration Prisma (dev) + seed |
| `npm run db:deploy` | applique les migrations existantes (production) |
| `npm run db:seed` | seed seul |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | remet la base à zéro |

## Tester Stripe en local

1. Crée un compte Stripe et reste en **mode test**. Copie la clé secrète `sk_test_…` dans `STRIPE_SECRET_KEY` (`.env`).
2. Installe la [Stripe CLI](https://docs.stripe.com/stripe-cli), puis `stripe login` et
   `stripe listen --forward-to localhost:3000/api/webhooks/stripe`. Copie le `whsec_…` affiché dans `STRIPE_WEBHOOK_SECRET`.
3. `PAYMENT_PROVIDER="stripe"`, relance `npm run dev`, commande et paie avec la carte de test `4242 4242 4242 4242` (date future, CVC quelconque).

## Héberger sur Render (avec Supabase)

La configuration est dans [`render.yaml`](render.yaml) : service web Node, offre gratuite, région Francfort,
`npm ci --include=dev && npm run build` puis `npm run start`. Render redéploie à chaque push sur `main`.

1. **Base** : migrations appliquées sur Supabase depuis ton poste (voir « Base Supabase » ci-dessous).
   L'offre gratuite de Render n'a pas d'étape de pré-déploiement : `npm run db:deploy` reste à lancer à la main
   avec `DATABASE_URL` = `PROD_MIGRATE_URL` avant de pousser une nouvelle migration.
2. **Blueprint** : Render → **New → Blueprint**, choisis le dépôt GitHub. Render lit `render.yaml` et demande les variables :
   `DATABASE_URL` (= `PROD_DATABASE_URL`, pooler port 6543), `APP_URL` (ex. `https://fil-de-sable.onrender.com`),
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, et `DB_SSL_CA` (facultatif).
3. **Stripe** : dans le tableau de bord Stripe (mode test d'abord), **Développeurs → Webhooks → Ajouter un endpoint** :
   `https://TON-URL/api/webhooks/stripe`, événements `checkout.session.completed`,
   `checkout.session.async_payment_succeeded` et `checkout.session.async_payment_failed`. Copie la clé `sk_test_…` et le
   `whsec_…` dans les variables Render. Sans clés Stripe, le site s'affiche mais le paiement échoue (le paiement simulé
   est désactivé en production). Passage en réel : clés `sk_live_…` et endpoint webhook en mode live.

Limites de l'offre gratuite : le service s'endort après 15 min sans visite (réveil d'environ 30 à 60 s) ; le limiteur de
débit en mémoire est remis à zéro à chaque réveil.

## Base Supabase

L'app est du Postgres standard : `src/lib/db.ts` se connecte via `DATABASE_URL`.

1. **Projet** : Supabase, projet `opieomqlhsqviteiqxtb` (région `eu-west-1`). Le MCP Supabase est déclaré dans
   [`.mcp.json`](.mcp.json) (connexion OAuth à la première utilisation).
2. **Chaînes de connexion** (Supabase → *Connect*), avec `?sslmode=require`, dans `.env.production.local` (jamais versionné) :
   - `PROD_DATABASE_URL` : pooler en mode **transaction**, port **6543** (l'app, variable Render `DATABASE_URL`) ;
   - `PROD_MIGRATE_URL` : connexion directe `db.REF.supabase.co` (IPv6) ou pooler en mode **session**, port **5432**
     (`prisma migrate`, qui ne marche pas en mode transaction).
3. **Schéma et données** :

   ```powershell
   $env:DATABASE_URL = "<PROD_MIGRATE_URL>"
   $env:SEED_ADMIN_EMAIL = "ton-adresse@exemple.fr"
   $env:SEED_ADMIN_PASSWORD = "un-mot-de-passe-de-prod-different-du-dev"
   npm run db:deploy
   npm run db:seed
   Remove-Item Env:DATABASE_URL, Env:SEED_ADMIN_PASSWORD
   ```

4. **RLS** : la migration `20261015160000_enable_rls` active le RLS, sans politique, sur toutes les tables : l'API Data
   de Supabase (clé `anon`, que l'app n'utilise pas) n'y lit plus rien. Prisma se connecte avec le rôle propriétaire
   des tables, non soumis au RLS. Toute nouvelle table doit recevoir le même `ENABLE ROW LEVEL SECURITY`.
5. **TLS** : pour vérifier le certificat, télécharge le certificat racine (*Database Settings → SSL*) et mets-le dans `DB_SSL_CA`.

Limites connues : le limiteur de débit est en mémoire, propre à chaque instance (passer à Redis si l'app monte en charge) ;
la connexion à Supabase est chiffrée mais sans vérification du certificat tant que `DB_SSL_CA` n'est pas renseigné ;
la CSP à nonce est dans `src/middleware.ts`, convention dépréciée dans Next 16 (à migrer vers `proxy.ts`).
