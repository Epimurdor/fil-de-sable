import type { Metadata } from "next";
import { Fil } from "@/components/fil";
import { Configurator } from "@/components/configurator";
import { getCustomizableProduct } from "@/lib/products/queries";

export const metadata: Metadata = {
  title: "Compose ton bracelet",
  description: "Choisis tes fils, ta perle, ton motif et ta taille : l'aperçu se dessine en direct, l'atelier noue le reste.",
};

export default async function ConfiguratorPage() {
  const product = await getCustomizableProduct();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mt-1 text-4xl text-ink sm:text-5xl">Compose ton bracelet</h1>
      <Fil width={140} className="mt-4" />
      <p className="mt-4 max-w-xl text-ink-2">
        Jusqu'à trois fils, une perle, un motif, ta taille. L'aperçu est une esquisse : le vrai est noué à la main, avec les
        petites irrégularités qui vont avec.
      </p>
      <div className="mt-10">
        {product ? (
          <Configurator basePriceCents={product.priceCents} leadTimeDays={product.leadTimeDays} />
        ) : (
          <p className="rounded-lg border border-dashed border-line-2 p-8 text-center text-ink-3">
            Le configurateur revient très vite.
          </p>
        )}
      </div>
    </div>
  );
}
