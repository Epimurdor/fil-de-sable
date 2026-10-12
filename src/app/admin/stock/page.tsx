import type { Metadata } from "next";
import { SupplyStock } from "@/components/admin/supply-stock";
import { SUPPLY_KINDS, getSupplies } from "@/lib/supplies";

export const metadata: Metadata = { title: "Stock" };

export default async function StockPage() {
  const supplies = await getSupplies();
  return (
    <div>
      <h1 className="text-3xl text-ink">Stock de l&apos;atelier</h1>
      <p className="mt-2 max-w-2xl text-ink-2">
        Tes fils et tes perles. Une pièce n&apos;est proposée dans la boutique que si toutes ses fournitures ont du stock : mets une
        couleur à 0 et les bijoux qui l&apos;utilisent sortent de la boutique jusqu&apos;à ce que tu la remettes. Seules les fournitures
        en stock sont proposées quand tu crées ou modifies un produit.
      </p>
      <div className="mt-8 grid gap-10 xl:grid-cols-2">
        {SUPPLY_KINDS.map((k) => (
          <section key={k.kind}>
            <h2 className="text-2xl text-ink">{k.plural}</h2>
            <div className="mt-4">
              <SupplyStock kind={k.kind} unit={k.unit} supplies={supplies.filter((s) => s.kind === k.kind)} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
