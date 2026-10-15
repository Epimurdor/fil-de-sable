import { prisma } from "@/lib/db";
import type { ThreadOption } from "./labels";

const select = { code: true, range: true, ref: true, name: true, shade: true, family: true, hex: true, note: true } as const;

// Bobines présentes à l'atelier : les seules proposées dans le configurateur.
export async function getStockedThreads(): Promise<ThreadOption[]> {
  return prisma.threadColor.findMany({ where: { inStock: true }, select, orderBy: { sortOrder: "asc" } });
}

export async function getAllThreads(): Promise<(ThreadOption & { inStock: boolean })[]> {
  return prisma.threadColor.findMany({ select: { ...select, inStock: true }, orderBy: { sortOrder: "asc" } });
}
