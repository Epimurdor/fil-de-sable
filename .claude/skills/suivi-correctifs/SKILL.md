---
name: suivi-correctifs
description: Tient à jour SUIVI-CORRECTIFS.md, le journal des correctifs et bugfix de la boutique Fil de Sable. À utiliser après chaque correctif ou bugfix (même petit), quand un bug est signalé mais pas encore traité, quand un correctif est déployé sur Wasmer, ou quand l'utilisateur demande de noter, journaliser, tracer ou mettre à jour le suivi.
---

# Remplir SUIVI-CORRECTIFS.md

Le fichier `SUIVI-CORRECTIFS.md` (racine du projet) trace tous les correctifs. Il a trois sections :
**À faire / signalés**, **Journal** (le plus récent en haut) et **Rappels utiles**.
Tout est rédigé en français, de façon courte et factuelle.

## Quand l'utiliser

| Situation | Action |
|---|---|
| L'utilisateur signale un bug qu'on ne traite pas tout de suite | Ajouter une puce dans **À faire / signalés** |
| On commence à corriger un bug | Créer l'entrée du journal avec le statut 🟡 (et retirer la puce de « À faire » si elle existe) |
| Le correctif est fait et vérifié en local | Passer l'entrée en ✅ et remplir Cause / Correctif / Fichiers / Vérification |
| Le correctif est mis en ligne (skill `deploy-wasmer`) | Passer en 🚀 et ajouter la date de déploiement dans **Notes** |
| Le correctif est bloqué (info manquante, dépendance…) | Passer en ⏸️ et dire pourquoi dans **Notes** |

N'attends pas qu'on te le demande : mets le fichier à jour à la fin de chaque correctif, dans le même
tour que le correctif lui-même.

## Procédure

1. Lis `SUIVI-CORRECTIFS.md` en entier avant de le modifier, pour éviter les doublons. Si une entrée
   existe déjà pour ce bug, mets-la à jour au lieu d'en créer une nouvelle.
2. Récupère les faits plutôt que de les reconstruire de mémoire :
   - date du jour au format `AAAA-MM-JJ` ;
   - fichiers réellement modifiés : `git status --short` et `git diff --stat` (si `git` n'est pas dans
     le PATH, liste les fichiers que tu as édités pendant ce tour) ;
   - vérifications réellement lancées et leur résultat (`npm run typecheck`, `npm run lint`,
     `npm run build`, test dans le navigateur, sonde en prod).
3. Insère la nouvelle entrée **juste sous `## Journal`**, au-dessus des entrées existantes, avec ce
   format exact :

   ```markdown
   ### AAAA-MM-JJ — Titre court (ce qui est corrigé, pas ce qui était cassé)
   - **Statut :** ✅
   - **Problème :** ce que voyait l'utilisateur, où, comment reproduire
   - **Cause :** ce qui était faux dans le code ou la config
   - **Correctif :** ce qui a été changé, en une ou deux phrases
   - **Fichiers :** `src/chemin/fichier.tsx`, `prisma/schema.prisma`
   - **Vérification :** typecheck OK · build OK · page /panier testée dans le navigateur
   - **Notes :** suites éventuelles, points d'attention (ligne omise si rien à dire)
   ```

4. Pour une puce **À faire** : `- [AAAA-MM-JJ] Description courte du bug (où, symptôme)`.
   Quand la section n'a plus de puce, remets `- …`.
5. Si un correctif révèle un fait durable sur le projet (commande, piège, contrainte de build),
   ajoute une ligne dans **Rappels utiles**, sans dupliquer ce qui y est déjà.

## Règles

- **Honnêteté** : ne mets ✅ que si une vérification a vraiment été faite ; sinon laisse 🟡 et écris
  « non vérifié » dans **Vérification**. Ne mets 🚀 qu'après un déploiement réussi.
- Une entrée par bug. Plusieurs petits correctifs liés au même problème vont dans la même entrée.
- Ne touche pas aux anciennes entrées sauf pour changer leur statut ou compléter leurs notes.
- Ne supprime jamais l'entrée « Création du fichier de suivi » ni le modèle en commentaire HTML.
- N'écris ni secret, ni clé, ni contenu de `.env` dans le fichier.
- Après la mise à jour, dis-le en une ligne à l'utilisateur avec un lien vers
  [SUIVI-CORRECTIFS.md](SUIVI-CORRECTIFS.md).
