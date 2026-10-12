import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Clock, Hand, Leaf } from "lucide-react";
import { AddToCartForm } from "@/components/add-to-cart-form";
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
  const related = (await getProducts({ category: product.category.slug })).filter((p) => p.id !== product.id).slice(0, 3);
  const colors = parseColors(product.colors);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-bark-500">
        <Link href="/boutique" className="hover:text-bark-900">Boutique</Link>
        <span className="mx-2">/</span>
        <Link href={`/boutique?categorie=${product.category.slug}`} className="hover:text-bark-900">{product.category.name}</Link>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-14">
        <div className="md:sticky md:top-24 md:self-start">
          <ProductVisual
            colors={colors}
            kind={kindFromCategorySlug(product.category.slug)}
            imageUrl={product.imageUrl}
            alt={product.name}
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            className="blob-a aspect-[4/5] shadow-soft"
          />
          {colors.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-bark-500">
              <span>Fils :</span>
              {colors.map((c) => (
                <span key={c} className="h-5 w-5 rounded-full ring-1 ring-bark-800/15" style={{ backgroundColor: c }} aria-hidden />
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display text-4xl font-semibold text-bark-900 sm:text-5xl">{product.name}</h1>
          {product.tagline && <p className="mt-2 text-lg text-bark-500">{product.tagline}</p>}
          <p className="mt-5 text-3xl font-semibold text-bark-900">{formatPrice(product.priceCents)}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-sage-700">
            <Clock className="h-4 w-4" aria-hidden /> {leadTimeLabel(product.leadTimeDays)}, puis expédié
          </p>

          <div className="mt-8">
            <AddToCartForm productId={product.id} basePriceCents={product.priceCents} options={options} />
          </div>

          <div className="prose prose-sm mt-10 max-w-none text-bark-700">
            <p className="text-base leading-relaxed">{product.description}</p>
          </div>

          <ul className="mt-8 grid gap-3 text-sm text-bark-700 sm:grid-cols-3">
            <li className="rounded-2xl bg-white/70 p-4"><Hand className="mb-2 h-5 w-5 text-terracotta-500" aria-hidden />Noué à la main, après ta commande.</li>
            <li className="rounded-2xl bg-white/70 p-4"><Leaf className="mb-2 h-5 w-5 text-sage-600" aria-hidden />Fil de coton ciré, résiste à l'eau.</li>
            <li className="rounded-2xl bg-white/70 p-4"><Clock className="mb-2 h-5 w-5 text-ocre-500" aria-hidden />Suivi de fabrication dans ton compte.</li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-3xl font-semibold text-bark-900">Dans la même veine</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
