// Exécuté par `pnpm db:seed` (Node 24 lit le TypeScript nativement). Idempotent : upserts partout.
import { hashPassword } from "../src/lib/auth/password.ts";
// Même client que l'app (driver adapter Postgres, DATABASE_URL).
import { prisma } from "../src/lib/db.ts";

// Palette de fils (hex) utilisée par le visuel généré et le configurateur.
const P = {
  ardoise: "#4F6478",
  nacre: "#F2EFE6",
  or: "#C9A227",
  taupe: "#5E4B4F",
  quartz: "#E8C4D0",
  sable: "#E8D5B5",
  ecru: "#F3EBDD",
  terracotta: "#C96F4A",
  ocre: "#D9A441",
  sauge: "#8A9A7B",
  foret: "#4F6B4E",
  brun: "#6B4F3A",
  bleu: "#7E9BB0",
  rose: "#D8A49B",
  noir: "#2B2B2B",
  bordeaux: "#7A3B3B",
};

type OptionValue = { value: string; label: string; priceDeltaCents: number };
type OptionSeed = { name: string; values: OptionValue[]; required?: boolean };
type ProductSeed = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  priceCents: number;
  leadTimeDays: number;
  colors: string[];
  category: string;
  imageUrl?: string;
  isFeatured?: boolean;
  isCustomizable?: boolean;
  options: OptionSeed[];
};

const wrist: OptionSeed = {
  name: "Taille de poignet",
  values: [
    { value: "S", label: "S · 14 à 15 cm", priceDeltaCents: 0 },
    { value: "M", label: "M · 15 à 17 cm", priceDeltaCents: 0 },
    { value: "L", label: "L · 17 à 19 cm", priceDeltaCents: 0 },
  ],
};

const categories = [
  { slug: "bracelets", name: "Bracelets", description: "Fins, noués serré, à empiler sans compter.", sortOrder: 1 },
  { slug: "bagues", name: "Bagues", description: "Un fil, un nœud, une bague qui ne quitte plus le doigt.", sortOrder: 2 },
  { slug: "colliers", name: "Colliers", description: "Des longueurs à porter seules ou superposées.", sortOrder: 3 },
];

const products: ProductSeed[] = [
  // --- Les deux modèles réels de l'atelier (photos fournies) ---
  {
    slug: "perle-d-ecume",
    name: "Perle d'écume",
    tagline: "Bleu ardoise, perles nacrées, une grosse perle au centre",
    description:
      "Micro-macramé en fil ciré bleu ardoise, noué en arabesques autour de petites perles nacrées et d'une perle centrale irisée. Deux perles dorées ferment le nœud coulissant. Ajustable, il se porte seul ou empilé, et résiste à l'eau.",
    priceCents: 2200,
    leadTimeDays: 5,
    colors: [P.ardoise, P.nacre, P.or],
    category: "bracelets",
    imageUrl: "/images/produits/bracelet-atelier-1.jpg",
    isFeatured: true,
    options: [wrist],
  },
  {
    slug: "quartz-rose",
    name: "Quartz rose",
    tagline: "Fil taupe, trois perles de quartz rose",
    description:
      "Micro-macramé en fil ciré taupe, entrelacs serrés et trois perles de quartz rose, la plus grosse au centre. Fermeture par nœud coulissant, taille ajustable. Doux, discret, à porter tous les jours.",
    priceCents: 2200,
    leadTimeDays: 5,
    colors: [P.taupe, P.quartz],
    category: "bracelets",
    imageUrl: "/images/produits/bracelet-atelier-2.jpg",
    isFeatured: true,
    options: [wrist],
  },
  {
    slug: "bracelet-sur-mesure",
    name: "Bracelet sur mesure",
    tagline: "Compose le tien, fil par fil",
    description:
      "Tu choisis les couleurs de fil, la perle et la taille dans le configurateur, on le noue à la main dans la semaine. Chaque pièce est unique, parce que c'est toi qui l'as dessinée.",
    priceCents: 2900,
    leadTimeDays: 7,
    colors: [P.terracotta, P.sauge, P.sable],
    category: "bracelets",
    isCustomizable: true,
    options: [],
  },
];

const shippingMethods = [
  {
    code: "lettre-suivie",
    name: "Lettre suivie",
    description: "2 à 4 jours ouvrés, suivi en ligne. Idéale pour les bijoux.",
    priceCents: 290,
    freeAboveCents: 6000,
    sortOrder: 1,
  },
  {
    code: "mondial-relay",
    name: "Mondial Relay",
    description: "3 à 5 jours ouvrés, retrait en point relais.",
    priceCents: 450,
    freeAboveCents: 6000,
    sortOrder: 2,
  },
  {
    code: "colissimo",
    name: "Colissimo domicile",
    description: "2 à 3 jours ouvrés, remis en main propre ou en boîte aux lettres.",
    priceCents: 590,
    freeAboveCents: 6000,
    sortOrder: 3,
  },
];

// Mots de passe publiés (anciens exemples, valeurs triviales) : jamais acceptés pour l'admin.
const FORBIDDEN_ADMIN_PASSWORDS = new Set(["atelier-2026", "admin", "password", "motdepasse", "changeme", "fildesable"]);

function assertStrongAdminPassword(password: string | undefined): asserts password is string {
  const problems: string[] = [];
  if (!password) problems.push("SEED_ADMIN_PASSWORD manquant dans .env");
  else {
    if (password.length < 14) problems.push("14 caractères minimum");
    if (FORBIDDEN_ADMIN_PASSWORDS.has(password.toLowerCase())) problems.push("mot de passe connu publiquement");
    const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
    if (classes < 3) problems.push("au moins 3 types de caractères parmi minuscules, majuscules, chiffres, symboles");
  }
  if (problems.length) {
    throw new Error(
      `Sécurité : SEED_ADMIN_PASSWORD trop faible (${problems.join(", ")}).\n` +
        `Génère-en un, par ex. : node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"`,
    );
  }
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  if (!adminEmail) throw new Error("SEED_ADMIN_EMAIL manquant dans .env");
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  assertStrongAdminPassword(adminPassword);
  const adminPasswordHash = await hashPassword(adminPassword);

  // Le seed fait foi : relancer le seed remplace aussi un ancien mot de passe admin (ex. celui par défaut).
  await prisma.user.upsert({
    where: { email: adminEmail },
    // ...et révoque les sessions ouvertes avec l'ancien.
    update: { role: "admin", passwordHash: adminPasswordHash, sessions: { deleteMany: {} } },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      firstName: "Atelier",
      lastName: "Fil du Sable",
      role: "admin",
    },
  });

  const categoryIds = new Map<string, string>();
  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, sortOrder: c.sortOrder },
      create: c,
    });
    categoryIds.set(c.slug, row.id);
  }

  for (const [i, p] of products.entries()) {
    const categoryId = categoryIds.get(p.category);
    if (!categoryId) throw new Error(`Catégorie inconnue : ${p.category}`);
    const data = {
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      priceCents: p.priceCents,
      leadTimeDays: p.leadTimeDays,
      colors: JSON.stringify(p.colors),
      imageUrl: p.imageUrl ?? null,
      isFeatured: p.isFeatured ?? false,
      isCustomizable: p.isCustomizable ?? false,
      sortOrder: i,
      categoryId,
    };
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    });
    await prisma.productOption.deleteMany({ where: { productId: product.id } });
    for (const [j, o] of p.options.entries()) {
      await prisma.productOption.create({
        data: {
          productId: product.id,
          name: o.name,
          values: JSON.stringify(o.values),
          required: o.required ?? true,
          sortOrder: j,
        },
      });
    }
  }

  for (const s of shippingMethods) {
    await prisma.shippingMethod.upsert({ where: { code: s.code }, update: s, create: s });
  }

  console.log(
    `Seed OK : ${categories.length} catégories, ${products.length} produits, ${shippingMethods.length} modes de livraison, admin ${adminEmail}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
