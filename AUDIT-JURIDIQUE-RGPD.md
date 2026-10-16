# Audit juridique et RGPD — Fil du Sable (France)

Date : 2026-10-15 · Périmètre : code du dépôt (pages, formulaires, schéma Prisma, cookies, paiement, hébergement) confronté au droit français et européen applicable à une boutique en ligne de bijoux faits main vendue à des particuliers.

> Ce document est une analyse technique et réglementaire, pas un avis juridique. Les points marqués 🔎 sont à faire valider (CMA/CCI, expert-comptable, avocat ou DGCCRF) avant l'ouverture. Les textes cités sont ceux que je connais à la date de l'audit : à revérifier sur Légifrance et cnil.fr.

Légende : ✔️ conforme · ⛔ bloquant avant la première vente réelle · ⚠️ important · 🔜 recommandé

## Verdict

**Techniquement le site est solide** (sécurité, minimisation, aucun traceur). **Juridiquement il n'est pas prêt pour de vraies ventes** : il n'y a aucune page légale, aucune acceptation des CGV, aucun e-mail de confirmation de commande, et l'identité du vendeur n'est pas indiquée. Rien de tout cela n'est difficile, mais c'est de la rédaction et de la paperasse, pas du code seulement.

## 1. Statut du vendeur (hors code, à faire en premier)

- ⛔ **Existence légale.** Vendre régulièrement des bijoux faits main est une activité professionnelle : il faut un SIRET. Pour un artisan en micro-entreprise, l'immatriculation se fait via le guichet unique (formalites.entreprises.gouv.fr) et passe par la Chambre de métiers (CMA) 🔎. Sans SIRET, ni mentions légales conformes, ni facturation, ni déclaration de chiffre d'affaires.
- ⚠️ **TVA** : en micro-entreprise, franchise en base tant que les seuils ne sont pas dépassés ; mention obligatoire « TVA non applicable, art. 293 B du CGI » sur les factures et dans les CGV 🔎 (vérifier le seuil en vigueur en 2026).
- ⚠️ **Cumul avec l'emploi** : la page « L'atelier » indique près de quarante ans comme assistante dentaire. Si l'activité d'assistante dentaire est toujours exercée comme salariée, vérifier le contrat de travail (exclusivité, loyauté) 🔎.
- 🔜 **Marque** : vérifier la disponibilité de « Fil du Sable » à l'INPI (base marques) avant de dépenser en communication.
- 🔜 **Assurance** : une RC professionnelle couvre les dommages causés par un bijou (allergie, blessure) ; à demander à un assureur.

## 2. Pages et mentions obligatoires — rien n'existe

Recherche dans `src/` : aucune occurrence de « mentions légales », « CGV », « confidentialité », « cookies », « rétractation », « médiateur », « SIRET ». Le pied de page (`src/components/site-footer.tsx`) ne pointe vers aucune page légale.

| # | Élément | Base | Statut |
| --- | --- | --- | --- |
| 1 | **Mentions légales** : nom et prénom (ou raison sociale), adresse, e-mail et téléphone, SIRET, directeur de publication, **hébergeur** (nom, adresse, téléphone) | LCEN art. 6-III | ⛔ |
| 2 | **CGV** : produits, prix TTC, paiement, délais, livraison, rétractation, garanties légales, médiation, loi applicable | C. consom. L111-1, L221-5 | ⛔ |
| 3 | **Politique de confidentialité** | RGPD art. 12-14 | ⛔ |
| 4 | **Droit de rétractation** : information claire + formulaire type | L221-5, L221-18 | ⛔ |
| 5 | **Médiateur de la consommation** : coordonnées dans les CGV et sur le site | L612-1, L616-1 | ⛔ |
| 6 | **Garanties légales** de conformité (2 ans) et des vices cachés, reproduites dans les CGV | L217-3 s., C. civ. 1641 | ⛔ |
| 7 | **Page contact / SAV** avec coordonnées réelles | L111-1 | ✔️ e-mail dans le pied de page, 🔜 ajouter le téléphone ou un formulaire |

Notes :
- Le vendeur étant professionnel, il **ne peut pas** rester anonyme derrière l'hébergeur (l'exception LCEN ne vaut que pour les non-professionnels). Son nom, son adresse et son SIRET doivent figurer. Le lien Facebook du pied de page renvoie vers un profil personnel : à remplacer par une page dédiée à la boutique.
- Hébergeur à citer : Render (la base est chez Supabase, à citer aussi dans la politique de confidentialité). Reprendre l'adresse exacte depuis le site de Render 🔎.
- La plateforme européenne de règlement en ligne des litiges (RLL) a, à ma connaissance, été arrêtée en juillet 2025 : le lien vers elle n'est plus requis, mais le médiateur reste obligatoire 🔎. Choisir un médiateur référencé par la CECMC (liste sur economie.gouv.fr) et adhérer avant l'ouverture.

## 3. Parcours de commande

Fichiers : `src/components/checkout-form.tsx`, `src/lib/orders/actions.ts`, `src/lib/payment/stripe.ts`.

- ⛔ **Pas de case ni de mention d'acceptation des CGV** avant la commande. Ajouter une case obligatoire (côté formulaire **et** vérifiée dans l'action serveur) renvoyant vers les CGV, et conserver la preuve (date, version) sur la commande.
- ⛔ **Bouton de commande** : il doit indiquer sans ambiguïté l'obligation de paiement (« Commande avec obligation de paiement » ou équivalent, L221-14). Aujourd'hui : « Continuer vers le paiement » sur une page qui crée la commande puis redirige vers Stripe. À corriger, et à vérifier que la dernière étape avant paiement porte bien ce libellé.
- ⛔ **Texte de développement visible** : `checkout-form.tsx:131` affiche « Paiement simulé pendant la phase de développement ». À supprimer pour la production (pratique trompeuse sinon).
- ⛔ **Confirmation de commande par e-mail** (support durable, L221-13) : le site n'envoie **aucun e-mail** (aucune infrastructure d'envoi dans `src/` ni `package.json`). Il faut un service d'envoi transactionnel (avec contrat de sous-traitance RGPD), et un e-mail contenant récapitulatif, CGV, formulaire de rétractation, coordonnées. Le reçu Stripe ne remplace pas cette obligation.
- ⚠️ **Prix** : `formatPrice` affiche le prix, il faut qu'il soit TTC (ou « TVA non applicable, art. 293 B du CGI »), frais de port indiqués avant validation ✔️ (ils le sont déjà dans le récapitulatif).
- ⚠️ **Délai de livraison** : le site indique le délai de confection (`leadTimeDays`) mais pas la date ou le délai maximal de livraison (L111-1). Sans indication, le délai légal est de 30 jours maximum (L216-1). Indiquer « confection X jours + expédition Y jours ».
- ⚠️ **Transfert des risques** : mentionner qui supporte la perte/avarie pendant le transport (L216-4, le risque reste au vendeur jusqu'à la remise au consommateur). Point sensible pour la « lettre suivie » (peu ou pas d'indemnisation) : préférer un mode avec assurance ou assumer le risque.
- 🔜 **Facture** : la remettre sur demande, conserver les pièces 10 ans (C. com. L123-22). Pour tout contrat ≥ 120 €, le vendeur doit conserver l'écrit 10 ans (C. consom. L213-1) : cohérent avec la rétention des commandes (voir §5).

### Droit de rétractation (14 jours) et produits « sur commande »

La boutique indique que tout est fait « sur commande » (`src/app/atelier/page.tsx`). Attention : fabriquer à la demande **n'exclut pas** le droit de rétractation. L'exception (L221-28 3°) vise les biens « confectionnés selon les spécifications du consommateur ou nettement personnalisés ».
- Bracelet du **configurateur** (fils, perle, motif et taille choisis) : exception plausible 🔎.
- Produits du **catalogue**, même fabriqués après commande, avec seulement le choix d'une taille ou d'une couleur de fil parmi une liste : l'exception est discutable. Prudent : leur accorder la rétractation, ou faire valider la rédaction par la DGCCRF/un juriste 🔎.
- Dans tous les cas, informer **avant** l'achat de l'application ou non de l'exception, et conserver l'accord de l'acheteur (case dédiée pour les créations sur mesure).

## 4. Allégations commerciales et sécurité des produits

- ⚠️ **« Certifié résistant à l'eau et à l'usure »** (`src/app/page.tsx:23`, `src/app/boutique/[slug]/page.tsx:64`, `src/app/atelier/page.tsx:34`) : « certifié » suppose une certification réelle. Conserver la fiche du fournisseur de fil (Linhasita) comme preuve ou reformuler (« fil ciré, conçu pour résister à l'eau »). Sinon : pratique commerciale trompeuse (L121-2, jusqu'à 2 ans de prison et 300 000 € d'amende).
- ⚠️ **« Perles en acier inoxydable, laiton, pierres naturelles »** : exactitude des matières à garantir. Éviter « hypoallergénique » ou « sans nickel » sans preuve. Le règlement REACH limite la libération de nickel (annexe XVII, entrée 27) et le plomb dans les bijoux (entrée 63), ce qui concerne notamment le laiton : demander une attestation au fournisseur des perles 🔎.
- ⚠️ **Règlement sur la sécurité générale des produits (GPSR, en vigueur depuis le 13/12/2024)** : en vendant en ligne un produit que l'on fabrique soi-même, afficher sur chaque fiche le nom, l'adresse postale et l'e-mail du fabricant, un moyen d'identifier le produit (référence/lot), et les consignes de sécurité éventuelles (petites pièces, etc.).
- ⚠️ **Modèle 3D du bracelet** (`public/models/*.glb`) généré avec Meshy : selon l'offre, la licence peut imposer une attribution (offre gratuite) ou autoriser l'usage commercial (offre payante). Vérifier l'offre utilisée 🔎. Idem : toute photo ou image du site doit être celle de Nathalie ou libre de droits.
- ✔️ Polices (Bricolage Grotesque, Caveat : licence OFL), `three`, `lucide-react` : usages commerciaux libres.
- 🔜 « Fait main en Alsace » : conforme tant que c'est vrai. Conserver la facture des matières premières.

## 5. RGPD

### Données traitées (d'après `prisma/schema.prisma` et les formulaires)

| Donnée | Où | Finalité | Base légale (art. 6) |
| --- | --- | --- | --- |
| Nom, prénom, e-mail, mot de passe haché | `User` | Compte client, authentification | Contrat (6.1.b) |
| Nom complet, adresse, code postal, ville, téléphone (facultatif) | `Address`, `Order.ship*` | Livraison | Contrat |
| Note libre « un mot pour l'atelier » (500 car.) | `Order.customerNote` | Confection | Contrat |
| Contenu de la commande, montant, statut | `Order`, `OrderItem`, `OrderEvent` | Exécution, comptabilité | Contrat + obligation légale (6.1.c) |
| Jeton de session (haché), panier invité | `Session`, `Cart`, cookies | Fonctionnement du site | Intérêt légitime / strictement nécessaire |
| IP (en mémoire uniquement, limiteur de débit) | `rate-limit.ts` | Sécurité, anti brute-force | Intérêt légitime (6.1.f) |
| Paiement : traité par **Stripe** (aucune donnée de carte chez Fil du Sable) | Stripe | Paiement | Contrat |

### Ce qui est déjà bon ✔️

- **Aucun traceur** : pas d'analytics, pas de pixel, pas de script tiers, polices Google servies localement par `next/font` (CSP en `font-src 'self'`), lien Facebook simple sans widget.
- **Cookies** : seuls `__Host-fds_session` et `__Host-fds_cart` (httpOnly, Secure, SameSite=Lax). Ils sont **strictement nécessaires** : selon les lignes directrices de la CNIL, ils sont dispensés de consentement. **Pas de bannière cookies nécessaire**, à condition de ne rien ajouter (analytics, Meta Pixel, vidéo YouTube, widget Facebook…). Les citer dans la politique de confidentialité.
- **Minimisation** : téléphone facultatif, aucune date de naissance, pas de profilage, pas de newsletter.
- **Sécurité (art. 32)** : voir `AUDIT-SECURITE.md` (scrypt, sessions hachées, CSP à nonce, RLS Supabase, TLS, limitation de débit).
- **Hébergement dans l'UE** : base Supabase `eu-west-1` (Irlande), Render région Francfort. Stripe Payments Europe (Irlande).

### À faire

- ⛔ **Politique de confidentialité** (art. 13), contenu minimal : identité et contact du responsable (Nathalie, nom commercial, SIRET), finalités et bases légales (tableau ci-dessus), destinataires (Render, Supabase, Stripe, transporteurs Colissimo / Mondial Relay / La Poste, prestataire d'e-mails), **transferts hors UE** (Render, Supabase et Stripe sont des sociétés américaines : s'appuyer sur leurs clauses contractuelles types / le Data Privacy Framework, à indiquer), durées de conservation, droits (accès, rectification, effacement, limitation, portabilité, opposition), droit de réclamation auprès de la CNIL (cnil.fr/plaintes), absence de décision automatisée, cookies strictement nécessaires.
- ⛔ **Information au point de collecte** : un lien vers cette politique sous les formulaires d'inscription (`src/components/auth-forms.tsx`) et de commande (`src/components/checkout-form.tsx`). Aucune case de consentement n'est nécessaire pour le contrat ; ne pas cocher « consentement » à la place d'un contrat.
- ⛔ **Exercice des droits** : aujourd'hui, aucun moyen de modifier son profil, d'exporter ses données ou de supprimer son compte (déjà noté dans `AUDIT-SECURITE.md`, couche 12). Obligation : répondre sous **1 mois**. Au minimum, une adresse e-mail dédiée et une procédure interne ; idéalement, un bouton « Supprimer mon compte » et « Exporter mes données » dans `/compte`.
  - **Piège technique** : `Order.userId` est obligatoire et sans `onDelete` (`schema.prisma:153`), donc `delete user` échoue dès qu'il existe une commande. Et les commandes doivent rester 10 ans (obligation comptable). La bonne approche est l'**anonymisation** : supprimer sessions, paniers, adresses enregistrées, remplacer e-mail, nom et prénom du `User` par des valeurs neutres, et garder les commandes en accès restreint (archivage intermédiaire) jusqu'à l'échéance des 10 ans, puis purger.
- ⚠️ **Durées de conservation** (rien n'est purgé aujourd'hui) à définir et automatiser :
  - commandes et pièces comptables : 10 ans (archivage restreint) ;
  - compte client inactif : suppression après une durée à fixer (3 ans d'inactivité est un repère courant de la CNIL pour la prospection) ;
  - paniers invités : purge après quelques semaines (le cookie dure `CART_DAYS`, voir `src/lib/cart/cart.ts`) ;
  - sessions expirées : déjà purgées ✔️.
- ⚠️ **Contrats de sous-traitance (art. 28)** : accepter/signer les DPA de Render, Supabase, Stripe, et du futur prestataire d'e-mails. Ils sont généralement disponibles en ligne dans les paramètres du compte.
- ⚠️ **Sauvegardes** : l'offre gratuite de Supabase n'inclut pas de sauvegarde quotidienne ou à la demande ; la disponibilité et la restauration des données relèvent de l'art. 32. Planifier un export régulier (`pg_dump`) chiffré et stocké dans l'UE, ou passer à une offre avec sauvegardes. L'offre gratuite de Render s'endort après 15 minutes : acceptable pour tester, pas pour une boutique réelle.
- ⚠️ **Note de commande libre** : ajouter sous le champ « Un mot pour l'atelier » : « N'indique pas de données sensibles (santé, etc.) ».
- ⚠️ **Violation de données** : prévoir une procédure (notifier la CNIL sous 72 h si risque pour les personnes, informer les clients si risque élevé). Un simple document d'une page suffit.
- 🔜 **Registre des traitements (art. 30)** : un tableau (celui ci-dessus convient) tenu à jour. Pas de DPO, pas d'analyse d'impact à ce niveau.
- 🔜 **Prospection** : aucune newsletter aujourd'hui. Si elle est ajoutée : consentement explicite à l'inscription, lien de désinscription, service dédié (Brevo, par exemple), mention dans la politique. Pour des clients, la prospection par e-mail pour des produits analogues est possible sans consentement préalable (opt-out), mais seulement avec une case de refus à la collecte (CPCE L34-5).
- 🔜 **Pas d'inscription forcée** : le site impose un compte pour commander. Légal, mais le commerce sans compte (invité) réduit les données conservées et les droits à gérer.

## 6. Autres obligations à connaître

- **Accessibilité** : les obligations RGAA et la directive européenne d'accessibilité (en vigueur depuis le 28/06/2025) exemptent en principe les microentreprises 🔎. Une bonne pratique reste de garder les contrastes, les labels et la navigation clavier (les formulaires ont déjà des `label`).
- **Droit d'auteur** : publication de photos de personnes (avec accord écrit), photos de bijoux : droits de Nathalie.
- **Avis clients** : si ajoutés plus tard, l'information sur leur traitement et leur authenticité devient obligatoire.
- **Déclaration de revenus** : le chiffre d'affaires est à déclarer chaque mois ou trimestre (URSSAF).

## 7. Plan d'action (ordre recommandé)

1. ⛔ Créer l'activité (SIRET, CMA, régime micro, TVA) et ouvrir un compte bancaire professionnel (ou compte séparé) pour Stripe en mode **live** (le compte Stripe demande ces informations).
2. ⛔ Choisir et adhérer à un **médiateur de la consommation**.
3. ⛔ Rédiger et publier : mentions légales, CGV (avec rétractation, garanties, médiation), politique de confidentialité, formulaire de rétractation.
4. ⛔ Code : liens dans le pied de page, case CGV obligatoire à la commande (avec preuve), libellé « Commande avec obligation de paiement », suppression du texte « Paiement simulé », lien vers la politique de confidentialité sous les formulaires, information sur l'exception de rétractation pour les créations sur mesure.
5. ⛔ Envoi d'**e-mails transactionnels** (confirmation de commande, expédition) avec contrat de sous-traitance.
6. ⛔ Droits RGPD : adresse dédiée + procédure ; puis suppression/anonymisation et export depuis `/compte`.
7. ⚠️ Preuves des allégations (« certifié », matières), fiche GPSR (fabricant, référence), licence du modèle 3D.
8. ⚠️ Sauvegardes de la base, durées de conservation automatisées, DPA signés, procédure de violation.
9. 🔜 Tester une commande réelle de bout en bout en mode live (carte à soi-même, puis remboursement), vérifier les e-mails et le webhook, puis ouvrir.

## 8. Limites de cet audit

- Aucune vérification en ligne : l'état déployé du site n'a pas été contrôlé.
- Les sociétés, adresses, seuils (TVA) et exigences des prestataires (Render, Supabase, Stripe) sont à confirmer à la source.
- L'exception de rétractation pour produits sur commande est le point d'interprétation le plus risqué : à faire valider.
