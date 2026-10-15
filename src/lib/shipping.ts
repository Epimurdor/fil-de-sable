import "server-only";
import type { ShippingMethod } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getShippingMethods(): Promise<ShippingMethod[]> {
  return prisma.shippingMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
}

export function computeShippingCents(method: ShippingMethod, subtotalCents: number): number {
  if (method.freeAboveCents != null && subtotalCents >= method.freeAboveCents) return 0;
  return method.priceCents;
}

// Seuil de franco le plus bas parmi les modes actifs (pour le message « plus que X € »).
export function lowestFreeThreshold(methods: ShippingMethod[]): number | null {
  const thresholds = methods.map((m) => m.freeAboveCents).filter((v): v is number => v != null);
  return thresholds.length ? Math.min(...thresholds) : null;
}
