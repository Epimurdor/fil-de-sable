// Identité de la boutique : change le nom ici, il est repris partout.
export const site = {
  name: "Fil du Sable",
  tagline: "Bijoux en macramé noués à la main",
  description:
    "Bracelets, bagues et colliers en micro-macramé, noués à la main sur commande dans un petit atelier. Fil ciré, perles en acier inoxydable, en laiton et pierres naturelles.",
  email: "fildesable@gmail.com",
  facebook: "https://www.facebook.com/schweitzer.nathalie.9",
  orderPrefix: "FDS",
  currency: "EUR",
  locale: "fr-FR",
} as const;

// Informations légales : BROUILLON. Chaque valeur « [À COMPLÉTER … ] » doit être remplacée par la donnée
// réelle avant la mise en ligne (voir AUDIT-JURIDIQUE-RGPD.md). Tant qu'il en reste, les pages légales
// affichent le marqueur tel quel.
export const legal = {
  // Incrémenter à chaque modification des CGV : la version acceptée est consignée sur la commande.
  cgvVersion: "2026-10-brouillon",
  updatedAt: "15 octobre 2026",
  seller: {
    publisher: "[À COMPLÉTER : prénom et nom de l'exploitante]",
    status: "Entrepreneur individuel (micro-entreprise), artisan",
    address: "[À COMPLÉTER : adresse postale professionnelle]",
    phone: "[À COMPLÉTER : téléphone]",
    siret: "[À COMPLÉTER : n° SIRET]",
    rm: "[À COMPLÉTER : n° d'immatriculation au répertoire des métiers, si applicable]",
    vat: "TVA non applicable, art. 293 B du CGI", // à confirmer avec l'expert-comptable
  },
  host: {
    name: "Render Services, Inc.",
    address: "[À COMPLÉTER : adresse du siège, voir render.com]",
    note: "Base de données hébergée par Supabase (région UE, Irlande).",
  },
  mediator: {
    name: "[À COMPLÉTER : nom du médiateur de la consommation]",
    address: "[À COMPLÉTER : adresse postale du médiateur]",
    website: "[À COMPLÉTER : site web du médiateur]",
  },
  privacyEmail: "fildesable@gmail.com", // adresse dédiée aux demandes RGPD : à remplacer si besoin
  shippingDays: "[À COMPLÉTER : délai d'expédition en jours ouvrés après confection]",
} as const;
