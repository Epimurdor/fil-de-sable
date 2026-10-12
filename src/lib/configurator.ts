import { z } from "zod";
import type { CustomConfig } from "./types";

// Fils disponibles dans le configurateur (coton ciré).
export const THREAD_PALETTE = [
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

export const BEADS = [
  { code: "aucune", name: "Sans perle", hex: null, priceDeltaCents: 0 },
  { code: "nacre", name: "Perle nacrée", hex: "#F2EFE6", priceDeltaCents: 200 },
  { code: "quartz-rose", name: "Quartz rose", hex: "#E8C4D0", priceDeltaCents: 300 },
  { code: "bois", name: "Perle en bois", hex: "#A67B5B", priceDeltaCents: 200 },
  { code: "lave", name: "Pierre de lave", hex: "#2B2B2B", priceDeltaCents: 400 },
  { code: "turquoise", name: "Turquoise", hex: "#5FB8B0", priceDeltaCents: 300 },
] as const;

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
const allowedHex = new Set<string>(THREAD_PALETTE.map((t) => t.hex.toLowerCase()));

export const customConfigSchema = z.object({
  threads: z
    .array(z.string().regex(hexRegex))
    .min(1, "Choisis au moins une couleur de fil.")
    .max(3, "Trois couleurs maximum.")
    .refine((arr) => arr.every((h) => allowedHex.has(h.toLowerCase())), "Couleur de fil inconnue."),
  bead: z.enum(BEADS.map((b) => b.code) as [string, ...string[]]),
  size: z.enum(SIZES.map((s) => s.code) as [string, ...string[]]),
  pattern: z.enum(PATTERNS.map((p) => p.code) as [string, ...string[]]),
});

export function customPriceCents(basePriceCents: number, config: CustomConfig): number {
  const bead = BEADS.find((b) => b.code === config.bead);
  const extraThreads = Math.max(0, config.threads.length - 1);
  return basePriceCents + (bead?.priceDeltaCents ?? 0) + extraThreads * EXTRA_THREAD_CENTS;
}

export function threadName(hex: string): string {
  return THREAD_PALETTE.find((t) => t.hex.toLowerCase() === hex.toLowerCase())?.name ?? hex;
}

export function describeConfig(config: CustomConfig): string[] {
  const bead = BEADS.find((b) => b.code === config.bead);
  const pattern = PATTERNS.find((p) => p.code === config.pattern);
  const size = SIZES.find((s) => s.code === config.size);
  return [
    `Fils : ${config.threads.map(threadName).join(", ")}`,
    `Perle : ${bead?.name ?? config.bead}`,
    `Motif : ${pattern?.name ?? config.pattern}`,
    `Taille : ${size?.label ?? config.size}`,
  ];
}

export const DEFAULT_CONFIG: CustomConfig = {
  threads: ["#4F6478", "#F3EBDD"],
  bead: "nacre",
  size: "M",
  pattern: "arabesques",
};
