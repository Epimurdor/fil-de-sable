import { prisma } from "@/lib/db";

export type SupplyKind = "fil" | "perle";
export type Supply = { id: string; kind: SupplyKind; name: string; hex: string; quantity: number };

export const SUPPLY_KINDS: { kind: SupplyKind; label: string; plural: string; unit: string }[] = [
  { kind: "fil", label: "Fil", plural: "Fils", unit: "bobines" },
  { kind: "perle", label: "Perle", plural: "Perles", unit: "sachets" },
];

export async function getSupplies(kind?: SupplyKind): Promise<Supply[]> {
  const rows = await prisma.supply.findMany({
    where: kind ? { kind } : undefined,
    select: { id: true, kind: true, name: true, hex: true, quantity: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((r) => ({ ...r, kind: r.kind as SupplyKind }));
}

// Ce qu'on peut encore nouer : les fournitures dont il reste du stock.
export async function getSuppliesInStock(kind: SupplyKind): Promise<Supply[]> {
  return (await getSupplies(kind)).filter((s) => s.quantity > 0);
}
