import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { ProductCard } from "@/components/product-card";
import { ProductVisual } from "@/components/product-visual";
import { formatPrice, leadTimeLabel } from "@/lib/format";
import { getProductBySlug, getProducts } from "@/lib/products/queries";
import { getStockedThreads } from "@/lib/threads/queries";
import { kindFromCategorySlug, parseColors, parseOptionValues } from "@/lib/types";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  return { title: product?.name ?? "Produit", description: product?.tagline ?? undefined };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.isActive) notFound();
  if (product.isCustomizable) redirect("/configurateur");

  const options = product.options.map((o) => ({ name: o.name, required: o.required, values: parseOptionValues(o.values) }));
  const [allRelated, threads] = await Promise.all([
    getProducts({ category: product.category.slug }),
    product.threadChoice ? getStockedThreads() : Promise.resolve([]),
  ]);
  const related = allRelated.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="text-sm text-ink-3">
        <Link href="/boutique" className="hover:text-ink">Boutique</Link>
        <span className="mx-2">/</span>
        <Link href={`/boutique?categorie=${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-14">
        <ProductVisual
          colors={parseColors(product.colors)}
          kind={kindFromCategorySlug(product.category.slug)}
          imageUrl={product.imageUrl}
          alt={product.name}
          priority
          sizes="(min-width: 768px) 55vw, 100vw"
          className="aspect-[4/5] rounded-md md:sticky md:top-6 md:self-start"
        />

        <div>
          <h1 className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-2xl text-ink">{formatPrice(product.priceCents)}</p>
          <p className="mt-1 text-sm text-ink-3">{leadTimeLabel(product.leadTimeDays)}, puis expédié.</p>

          <div className="mt-8">
            <AddToCartForm productId={product.id} basePriceCents={product.priceCents} options={options} threads={threads} />
          </div>

          <p className="mt-10 leading-relaxed text-ink-2">{product.description}</p>

          <ul className="mt-8 space-y-1.5 border-t border-line pt-6 text-sm text-ink-2">
            <li>Noué à la main après ta commande.</li>
            <li>Tissé uniquement avec du fil de qualité premium, certifié résistant à l'eau et à l'usure. Perles en acier inoxydable, en laiton ou en pierres naturelles (améthyste, œil de tigre, apatite).</li>
            {kindFromCategorySlug(product.category.slug) === "bracelet" && (
              <li>Nœud coulissant : tu ajustes la taille du bracelet à ton poignet.</li>
            )}
            <li>Suivi de la confection depuis ton compte.</li>
            <li>Livraison offerte dès 60 €.</li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="text-2xl font-medium tracking-tight text-ink">Dans la même veine</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
