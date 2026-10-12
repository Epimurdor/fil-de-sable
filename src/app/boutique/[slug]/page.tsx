import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { Fil } from "@/components/fil";
import { ProductCard } from "@/components/product-card";
import { ProductVisual } from "@/components/product-visual";
import { formatPrice, leadTimeLabel } from "@/lib/format";
import { getProductBySlug, getProducts } from "@/lib/products/queries";
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
  const related = (await getProducts({ category: product.category.slug })).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="text-sm text-ink-3">
        <Link href="/boutique" className="link-fil pb-0.5 hover:text-ink">Boutique</Link>
        <span className="mx-2 text-accent-strong">·</span>
        <Link href={`/boutique?categorie=${product.category.slug}`} className="link-fil pb-0.5 hover:text-ink">{product.category.name}</Link>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-14">
        <ProductVisual
          colors={parseColors(product.colors)}
          kind={kindFromCategorySlug(product.category.slug)}
          imageUrl={product.imageUrl}
          alt={product.name}
          priority
          sizes="(min-width: 768px) 55vw, 100vw"
          className="aspect-[4/5] rounded-2xl shadow-lift md:sticky md:top-24 md:self-start"
        />

        <div>
          <h1 className="text-4xl text-ink sm:text-5xl">{product.name}</h1>
          <Fil width={110} className="mt-4" />
          <p className="mt-5 font-display text-2xl text-accent-strong">{formatPrice(product.priceCents)}</p>
          <p className="mt-1 inline-flex items-center gap-2 text-sm text-ink-3"><span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />{leadTimeLabel(product.leadTimeDays)}, puis expédié.</p>

          <div className="mt-8">
            <AddToCartForm productId={product.id} basePriceCents={product.priceCents} options={options} />
          </div>

          <p className="mt-10 leading-relaxed text-ink-2">{product.description}</p>

          <ul className="mt-8 grid gap-2 rounded-xl bg-paper-2 p-5 text-sm text-ink-2 sm:grid-cols-2">
            {["Noué à la main après ta commande.", "Fil ciré, résiste à l'eau. Sans métal.", "Suivi de la confection depuis ton compte.", "Livraison offerte dès 60 €."].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="text-3xl text-ink">Dans la même veine</h2>
          <Fil width={96} className="mt-3" />
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
