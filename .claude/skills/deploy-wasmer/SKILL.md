---
name: deploy-wasmer
description: Met en ligne une nouvelle version de la boutique Fil de Sable sur Wasmer Edge (fil-de-sable.wasmer.app) avec la CLI wasmer, puis vérifie le site. À utiliser quand l'utilisateur demande de déployer, publier, mettre en ligne, pousser en prod ou mettre à jour le site sur Wasmer, ou quand le site en ligne renvoie des erreurs 500 après un déploiement.
---

# Déployer Fil de Sable sur Wasmer Edge

Le script `scripts/deploy.ps1` fait tout le parcours : copie propre du dernier commit, contrôles,
migrations, `wasmer deploy --build-remote`, sondes. `scripts/debug.ps1` reproduit en local la
version en ligne quand une page répond 500.

## Avant de lancer

1. **Seul le dernier commit (HEAD) est déployé.** Regarde `git status` : s'il reste des modifications
   que l'utilisateur veut mettre en ligne, propose de les commiter d'abord. N'utilise `-AllowDirty`
   que si l'utilisateur veut explicitement déployer HEAD sans elles.
2. **Déployer publie le site** : n'enchaîne pas sur un déploiement que l'utilisateur n'a pas demandé
   dans ce tour (une demande de modification de code n'est pas une demande de mise en ligne).
3. Postgres local n'est **pas** nécessaire : les contrôles tournent dans une copie isolée et le build
   n'a pas besoin de base.

## Lancer

Depuis la racine du projet, dans PowerShell (prévoir 5 à 8 min de délai, ou lancer en arrière-plan) :

```powershell
& .\.claude\skills\deploy-wasmer\scripts\deploy.ps1
```

Options :
- `-Migrate` : applique les migrations Prisma en attente sur la base de production avant de
  déployer. Le script s'arrête sinon dès qu'une migration est en attente. Demande l'accord de
  l'utilisateur avant d'utiliser `-Migrate` : cela modifie la base de production.
- `-SkipChecks` : saute typecheck, lint et build locaux (le build distant a lieu quand même).
- `-AllowDirty` : déploie HEAD même s'il reste des modifications non commitées (elles sont ignorées).
- `-Paths '/', '/boutique'` : pages à sonder après le déploiement.

Code de sortie 0 : en ligne et aucune page en 5xx. Code 1 : le message dit quelle étape a échoué.

## Si une page répond 500

`wasmer app logs` ne montre pas les erreurs de Next.js. Lance :

```powershell
& .\.claude\skills\deploy-wasmer\scripts\debug.ps1
```

Il exécute localement le package actif avec le runtime Wasmer (Edge.js), branché sur la base de
production, et affiche la pile d'erreur réelle. `-NoDatabase` pour ne pas se connecter à la base.

## Contraintes du build Wasmer (ne pas défaire)

Le build distant fait `npm install` avec seulement `package.json` et le lockfile, puis
`next-bundle` (traçage des fichiers) et `node .next-bundle/server.mjs` sur Edge.js/QuickJS. Chacun
de ces points a corrigé une erreur 500 :

| Règle | Pourquoi |
| --- | --- |
| npm, pas pnpm | les liens symboliques de pnpm sont perdus dans le bundle (`@swc/helpers`, `@prisma/client` introuvables) |
| pas de `postinstall: prisma generate` | le schéma Prisma n'existe pas encore à l'installation ; la génération se fait dans `build` |
| `next build --webpack` | Turbopack référence Prisma sous un alias haché (`@prisma/client-<hash>`) que le bundle n'embarque pas |
| Tailwind via `@tailwindcss/postcss` | nécessaire pour que webpack traite le CSS |
| `outputFileTracingIncludes` sur `node_modules/.prisma/client/**` | Prisma lit `query_compiler_bg.wasm` sur le disque, invisible pour le traçage |
| pas de `health_checks` dans `app.yaml` | la CLI 7.5 rejette la syntaxe documentée |
| chunks numériques préfixés `c-` (`webpack()` dans `next.config.ts`) + `scripts/check-static-paths.mjs` dans `build` | next-bundle applique les routes `/500` et `/404/?` sans ancrage : un fichier dont l'URL contient `/500` ou `/404` (ex. `chunks/500-<hash>.js`) est servi en erreur et casse la navigation entre pages. Le build échoue si un tel chemin réapparaît (fichier de `public/` compris) |

Symptôme typique de ce dernier point : l'accueil s'affiche mais aucun lien ne mène nulle part, avec
`ChunkLoadError` dans la console du navigateur.

Si une nouvelle dépendance lit des fichiers à l'exécution (wasm, json, polices...), ajoute-les à
`outputFileTracingIncludes` dans `next.config.ts`.

## Sécurité

- N'envoie jamais le dossier de travail : il contient `.env`. Le script n'envoie qu'un `git archive` de HEAD.
- N'affiche jamais les identifiants de la base (`--with-password`) ni le lien Adminer (il contient
  un jeton de connexion) : le script ne les écrit que dans des variables d'environnement temporaires.
- Les secrets Stripe passent par `wasmer app secrets create`, jamais par `app.yaml` ni par git.

## Après le déploiement

Donne à l'utilisateur l'URL, le commit déployé et le tableau des sondes. Les pages qui lisent la
base mettent plusieurs secondes sur QuickJS (bêta Wasmer) : c'est attendu, pas une panne. Propose
de supprimer les copies de travail indiquées en fin de sortie si elles s'accumulent dans `%TEMP%`.
