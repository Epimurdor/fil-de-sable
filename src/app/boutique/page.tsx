import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { cn } from "@/lib/cn";
import { getCategories, getProducts, type ShopSort } from "@/lib/products/queries";

export const metadata: Metadata = { title: "Boutique" };

const sorts: { value: ShopSort | ""; label: string }[] = [
  { value: "", label: "Sélection" },
  { value: "new", label: "Nouveautés" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
];

function href(categorie: string | undefined, tri: string | undefined) {
  const q = new URLSearchParams();
  if (categorie) q.set("categorie", categorie);
  if (tri) q.set("tri", tri);
  const s = q.toString();
  return s ? `/boutique?${s}` : "/boutique";
}

const linkClass = (active: boolean) =>
  cn("underline-offset-4 transition-colors", active ? "text-ink underline" : "text-ink-2 hover:text-ink");

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; tri?: string }>;
}) {
  const { categorie, tri } = await searchParams;
  const sort = sorts.some((s) => s.value && s.value === tri) ? (tri as ShopSort) : undefined;
  const [categories, products] = await Promise.all([getCategories(), getProducts({ category: categorie, sort })]);
  const current = categories.find((c) => c.slug === categorie);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">{current?.name ?? "Boutique"}</h1>
      <p className="mt-2 max-w-xl text-ink-2">
        {current?.description ?? "Tout est noué à la main après ta commande. Le délai est indiqué sur chaque pièce."}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b border-line pb-4 text-sm">
        <div className="flex flex-wrap gap-5">
          {[{ slug: undefined, name: "Tout" }, ...categories].map((c) => (
            <Link key={c.slug ?? "all"} href={href(c.slug, tri)} className={linkClass((c.slug ?? "") === (categorie ?? ""))}>
              {c.name}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 text-ink-3">
          {sorts.map((s) => (
            <Link key={s.value} href={href(categorie, s.value || undefined)} className={linkClass((sort ?? "") === s.value)}>
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="mt-16 text-ink-2">Rien par ici pour le moment.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
