// Identité de la boutique : change le nom ici, il est repris partout.
export const site = {
  name: "Fil de Sable",
  tagline: "Bijoux en macramé noués à la main",
  description:
    "Bracelets, bagues et colliers en micro-macramé, noués à la main sur commande dans un petit atelier. Fil ciré, perles et pierres, zéro métal.",
  email: "bonjour@fildesable.fr",
  instagram: "fildesable",
  orderPrefix: "FDS",
  // Le bracelet sur mesure (configurateur) est mis de côté le temps d'avoir le stock et le débit
  // pour le proposer. Repasser à true pour le rouvrir : nav, accueil, page et panier suivent.
  customEnabled: false,
  currency: "EUR",
  locale: "fr-FR",
} as const;
