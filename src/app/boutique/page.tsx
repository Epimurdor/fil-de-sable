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
      <h1 className="font-display text-4xl font-semibold text-bark-900 sm:text-5xl">{current?.name ?? "La boutique"}</h1>
      <p className="mt-2 max-w-xl text-bark-500">
        {current?.description ?? "Tout est noué à la main après ta commande. Les délais sont indiqués sur chaque pièce."}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[{ slug: undefined, name: "Tout" }, ...categories].map((c) => {
            const active = (c.slug ?? "") === (categorie ?? "");
            return (
              <Link
                key={c.slug ?? "all"}
                href={href(c.slug, tri)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-semibold transition",
                  active ? "border-bark-900 bg-bark-900 text-sand-50" : "border-sand-300 bg-white text-bark-700 hover:border-bark-500",
                )}
              >
                {c.name}
              </Link>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1 text-sm">
          {sorts.map((s) => (
            <Link
              key={s.value}
              href={href(categorie, s.value || undefined)}
              className={cn(
                "rounded-full px-3 py-1.5 transition",
                (sort ?? "") === s.value ? "bg-sand-200 font-semibold text-bark-900" : "text-bark-500 hover:text-bark-900",
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="mt-16 text-center text-bark-500">Rien par ici pour le moment. L'atelier prépare la suite.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
