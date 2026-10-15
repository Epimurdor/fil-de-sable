import type { Metadata } from "next";
import Link from "next/link";
import { Configurator } from "@/components/configurator";
import { getCurrentUser } from "@/lib/auth/session";
import { getCustomizableProduct } from "@/lib/products/queries";
import { getStockedThreads } from "@/lib/threads/queries";

export const metadata: Metadata = {
  title: "Compose ton bracelet",
  description: "Choisis tes fils, ta perle, ton motif et ta taille : l'aperçu se dessine en direct, l'atelier noue le reste.",
};

export default async function ConfiguratorPage() {
  const [product, threads, user] = await Promise.all([getCustomizableProduct(), getStockedThreads(), getCurrentUser()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="mt-1 text-3xl font-medium tracking-tight text-ink sm:text-4xl">Compose ton bracelet</h1>
      <p className="mt-2 max-w-xl text-ink-3">
        Jusqu'à trois fils, une perle, un motif, ta taille. L'aperçu est une esquisse : le vrai est noué à la main, avec les
        petites irrégularités qui vont avec.
      </p>
      <div className="mt-10">
        {product && threads.length > 0 ? (
          <Configurator basePriceCents={product.priceCents} leadTimeDays={product.leadTimeDays} threads={threads} />
        ) : (
          <div className="rounded-md border border-dashed border-line-2 p-8 text-center text-ink-3">
            <p>Le configurateur revient très vite.</p>
            {/* Visible seulement par l'atelier : pourquoi la page est vide, et où le régler. */}
            {user?.role === "admin" && (
              <p className="mx-auto mt-4 max-w-md rounded-md bg-accent-soft px-4 py-3 text-sm text-accent-strong">
                {!product ? (
                  <>Aucun produit actif n'est marqué « Produit du configurateur » dans <Link href="/admin/produits" className="underline underline-offset-4">Produits</Link>.</>
                ) : (
                  <>Aucune bobine n'est en stock : coche tes bobines dans <Link href="/admin/fils" className="underline underline-offset-4">Stock de fil</Link> pour rouvrir le sur-mesure.</>
                )}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
