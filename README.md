# Fil de Sable

Boutique en ligne de bijoux en macramé (bracelets, bagues, colliers), noués à la main **sur commande**.

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma 6 · SQLite en dev (PostgreSQL en prod).

## Démarrer

```bash
pnpm install          # génère aussi le client Prisma
cp .env.example .env  # puis ajuste si besoin
pnpm db:migrate       # crée la base SQLite et lance le seed
pnpm dev              # http://localhost:3000
```

Le seed crée un compte administrateur (e-mail et mot de passe dans `.env`), trois catégories,
dix produits et trois modes de livraison. Relance-le à tout moment avec `pnpm db:seed` (idempotent).

## Ce que fait la v1

- **Accueil** : hero, sélection, catégories, « comment ça marche », accès au configurateur et au quiz.
- **Boutique** : filtres par catégorie, tri, fiches produit avec options (taille, fermoir, perle…) et prix dynamique.
- **Configurateur** : jusqu'à trois fils, une perle, un motif, une taille, aperçu SVG en direct, ajout au panier.
- **Quiz** : trois questions, recommandations par affinité de couleurs et de catégorie.
- **Panier** : invité ou connecté (rattaché au compte à la connexion), quantités, estimation de livraison.
- **Commande** : adresse, mode de livraison (franco dès 60 €), note pour l'atelier, numéro `FDS-AAAA-0001`.
- **Paiement** : abstraction `PaymentProvider`, implémentation `mock` (page de simulation). Stripe à brancher.
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
| `pnpm db:migrate` | migration Prisma + seed |
| `pnpm db:seed` | seed seul |
| `pnpm db:studio` | Prisma Studio |
| `pnpm db:reset` | remet la base à zéro |

## Passer en production

1. `prisma/schema.prisma` : `provider = "postgresql"` et `DATABASE_URL` vers Postgres, puis `prisma migrate deploy`.
2. Brancher Stripe : nouvelle implémentation de `PaymentProvider` dans `src/lib/payment/`, webhook pour passer la commande en `paid`, `PAYMENT_PROVIDER=stripe`.
3. Déployer (Vercel ou équivalent) avec les variables d'environnement.
