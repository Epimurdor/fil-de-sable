import { prisma } from "@/lib/db";
import { parseColors } from "@/lib/types";

// Une pièce est proposée tant que tous ses fils et toutes ses perles sont en stock. Dès qu'une
// fourniture manque, elle sort de la boutique sans qu'on ait à la masquer à la main, et revient
// quand le stock est remis à jour dans « Stock ».
export type StockSets = { fil: Set<string>; perle: Set<string> };

export async function getInStock(): Promise<StockSets> {
  const rows = await prisma.supply.findMany({ where: { quantity: { gt: 0 } }, select: { kind: true, hex: true } });
  const sets: StockSets = { fil: new Set(), perle: new Set() };
  for (const r of rows) (r.kind === "perle" ? sets.perle : sets.fil).add(r.hex.toLowerCase());
  return sets;
}

type Stockable = { colors: string; beads: string };

export function missingSupplies(product: Stockable, stock: StockSets): string[] {
  return [
    ...parseColors(product.colors).filter((c) => !stock.fil.has(c.toLowerCase())),
    ...parseColors(product.beads).filter((c) => !stock.perle.has(c.toLowerCase())),
  ];
}

export function isAvailable(product: Stockable, stock: StockSets): boolean {
  return missingSupplies(product, stock).length === 0;
}

export async function checkAvailable(product: Stockable): Promise<boolean> {
  return isAvailable(product, await getInStock());
}
