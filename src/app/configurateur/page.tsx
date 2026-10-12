import type { Metadata } from "next";
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
      <p className="text-xs font-semibold uppercase tracking-wider text-terracotta-600">Sur mesure</p>
      <h1 className="mt-1 font-display text-4xl font-semibold text-bark-900 sm:text-5xl">Compose ton bracelet</h1>
      <p className="mt-2 max-w-xl text-bark-500">
        Jusqu'à trois fils, une perle, un motif, ta taille. L'aperçu est une esquisse : le vrai est noué à la main, avec les
        petites irrégularités qui vont avec.
      </p>
      <div className="mt-10">
        {product ? (
          <Configurator basePriceCents={product.priceCents} leadTimeDays={product.leadTimeDays} />
        ) : (
          <p className="rounded-3xl border border-dashed border-sand-300 p-8 text-center text-bark-500">
            Le configurateur revient très vite.
          </p>
        )}
      </div>
    </div>
  );
}
