import { z } from "zod";
import type { CustomConfig } from "./types";

// Les fils proposés viennent du stock de l'atelier (table ThreadColor, /admin/fils).
// Ancienne palette fixe : ne sert plus qu'à nommer les fils des paniers et commandes passés avant le stock.
const LEGACY_THREADS = [
  { code: "ardoise", name: "Bleu ardoise", hex: "#4F6478" },
  { code: "taupe", name: "Taupe", hex: "#5E4B4F" },
  { code: "sable", name: "Sable", hex: "#E8D5B5" },
  { code: "ecru", name: "Écru", hex: "#F3EBDD" },
  { code: "terracotta", name: "Terracotta", hex: "#C96F4A" },
  { code: "ocre", name: "Ocre", hex: "#D9A441" },
  { code: "sauge", name: "Sauge", hex: "#8A9A7B" },
  { code: "foret", name: "Vert forêt", hex: "#4F6B4E" },
  { code: "brun", name: "Brun", hex: "#6B4F3A" },
  { code: "bleu", name: "Bleu délavé", hex: "#7E9BB0" },
  { code: "rose", name: "Rose poudré", hex: "#D8A49B" },
  { code: "noir", name: "Noir", hex: "#2B2B2B" },
] as const;

export type BeadMetal = "or" | "argent";

// metal : perles métal des modèles 3D (couleur fixe, jamais teintée par le fil).
export const BEADS = [
  { code: "argent", name: "Perles argentées", hex: "#D9DCE1", priceDeltaCents: 0, metal: "argent" },
  { code: "or", name: "Perles dorées", hex: "#E2B65A", priceDeltaCents: 0, metal: "or" },
  { code: "aucune", name: "Sans perle", hex: null, priceDeltaCents: 0, metal: null },
  { code: "nacre", name: "Perle nacrée", hex: "#F2EFE6", priceDeltaCents: 200, metal: null },
  { code: "quartz-rose", name: "Quartz rose", hex: "#E8C4D0", priceDeltaCents: 300, metal: null },
  { code: "bois", name: "Perle en bois", hex: "#A67B5B", priceDeltaCents: 200, metal: null },
  { code: "lave", name: "Pierre de lave", hex: "#2B2B2B", priceDeltaCents: 400, metal: null },
  { code: "turquoise", name: "Turquoise", hex: "#5FB8B0", priceDeltaCents: 300, metal: null },
] as const;

// Modèles 3D par motif (GLB produit par scripts/build-bracelet-model.mjs).
// Un motif en 3D ne propose que les perles or ou argent ; les autres motifs gardent le croquis et toutes les perles.
export const PATTERN_MODELS: Partial<Record<string, string>> = {
  arabesques: "/models/bracelet-perle-d-ecume.glb",
  vagues: "/models/quartz-rose/bracelet.gltf", // modèle Meshy texturé (scripts/build-textured-model.mjs)
};

// Photos recolorables par motif : le masque (scripts/build-photo-masks.mjs) dit où est le fil ; seul le fil
// change de couleur, les perles et le décor restent ceux de la photo. refLum et contrast sont affichés par le script.
export type PatternPhoto = { src: string; mask: string; refLum: number; contrast: number; beads: string };

export const PATTERN_PHOTOS: Partial<Record<string, PatternPhoto>> = {
  arabesques: {
    src: "/images/produits/bracelet-atelier-1.jpg",
    mask: "/images/produits/bracelet-atelier-1.masque.png",
    refLum: 0.0289,
    contrast: 0.8,
    beads: "perles nacrées",
  },
  vagues: {
    src: "/images/produits/bracelet-atelier-2.jpg",
    mask: "/images/produits/bracelet-atelier-2.masque.png",
    refLum: 0.0108,
    contrast: 0.55,
    beads: "perles de quartz rose",
  },
};

export function beadsForPattern(pattern: string) {
  return PATTERN_MODELS[pattern] ? BEADS.filter((b) => b.metal) : BEADS;
}

export const PATTERNS = [
  { code: "vagues", name: "Vagues", description: "Lignes souples qui ondulent" },
  { code: "arabesques", name: "Arabesques", description: "Boucles entrelacées autour des perles" },
  { code: "tresse", name: "Tresse", description: "Tressage serré et régulier" },
] as const;

export const SIZES = [
  { code: "S", label: "S · 14 à 15 cm" },
  { code: "M", label: "M · 15 à 17 cm" },
  { code: "L", label: "L · 17 à 19 cm" },
] as const;

export const EXTRA_THREAD_CENTS = 100; // chaque couleur de fil supplémentaire

const hexRegex = /^#[0-9a-f]{6}$/i;

// Forme seulement : le serveur vérifie ensuite que chaque code est une bobine en stock
// et remplace threads / threadLabels par les valeurs de la base (src/lib/cart/actions.ts).
export const customConfigSchema = z
  .object({
    threads: z.array(z.string().regex(hexRegex)).max(3),
    threadCodes: z
      .array(z.string().regex(/^[a-z0-9-]{1,60}$/))
      .min(1, "Choisis au moins une couleur de fil.")
      .max(3, "Trois couleurs maximum.")
      .refine((arr) => new Set(arr).size === arr.length, "Chaque fil ne compte qu'une fois."),
    threadLabels: z.array(z.string().max(120)).max(3).optional(),
    bead: z.enum(BEADS.map((b) => b.code) as [string, ...string[]]),
    size: z.enum(SIZES.map((s) => s.code) as [string, ...string[]]),
    pattern: z.enum(PATTERNS.map((p) => p.code) as [string, ...string[]]),
  })
  .strict()
  .refine((c) => beadsForPattern(c.pattern).some((b) => b.code === c.bead), {
    message: "Ce motif se fait avec des perles dorées ou argentées.",
    path: ["bead"],
  })
  .refine((c) => !PATTERN_MODELS[c.pattern] || c.threadCodes.length === 1, {
    message: "Ce motif se noue d'un seul fil.",
    path: ["threads"],
  });

export function customPriceCents(basePriceCents: number, config: CustomConfig): number {
  const bead = BEADS.find((b) => b.code === config.bead);
  const extraThreads = Math.max(0, config.threads.length - 1);
  return basePriceCents + (bead?.priceDeltaCents ?? 0) + extraThreads * EXTRA_THREAD_CENTS;
}

function legacyThreadName(hex: string): string {
  return LEGACY_THREADS.find((t) => t.hex.toLowerCase() === hex.toLowerCase())?.name ?? hex;
}

export function describeConfig(config: CustomConfig): string[] {
  const bead = BEADS.find((b) => b.code === config.bead);
  const pattern = PATTERNS.find((p) => p.code === config.pattern);
  const size = SIZES.find((s) => s.code === config.size);
  const threads = config.threadLabels?.length ? config.threadLabels : config.threads.map(legacyThreadName);
  return [
    `Fils : ${threads.join(", ")}`,
    `Perle : ${bead?.name ?? config.bead}`,
    `Motif : ${pattern?.name ?? config.pattern}`,
    `Taille : ${size?.label ?? config.size}`,
  ];
}

// Sans fil : le configurateur présélectionne la première bobine en stock.
export const DEFAULT_CONFIG: CustomConfig = {
  threads: [],
  threadCodes: [],
  threadLabels: [],
  bead: "argent",
  size: "M",
  pattern: "arabesques",
};
