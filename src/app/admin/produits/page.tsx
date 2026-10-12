import type { Metadata } from "next";
import Link from "next/link";
import { ProductVisual } from "@/components/product-visual";
import { ButtonLink } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { kindFromCategorySlug, parseColors } from "@/lib/types";

export const metadata: Metadata = { title: "Produits" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { category: true, _count: { select: { options: true } } },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold text-bark-900">Produits</h1>
        <ButtonLink href="/admin/produits/nouveau">Nouveau produit</ButtonLink>
      </div>
      <div className="mt-6 overflow-x-auto rounded-3xl border border-sand-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-sand-100 text-left text-xs uppercase tracking-wider text-bark-500">
            <tr>
              <th className="px-4 py-3">Produit</th><th className="px-4 py-3">Catégorie</th><th className="px-4 py-3">Prix</th>
              <th className="px-4 py-3">Délai</th><th className="px-4 py-3">Options</th><th className="px-4 py-3">État</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-200">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-sand-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/produits/${p.id}`} className="flex items-center gap-3 font-semibold text-bark-900 hover:underline">
                    <span className="block w-12 shrink-0 overflow-hidden rounded-lg">
                      <ProductVisual colors={parseColors(p.colors)} kind={kindFromCategorySlug(p.category.slug)} imageUrl={p.imageUrl} alt="" sizes="48px" className="aspect-square" />
                    </span>
                    <span>{p.name}<br /><span className="text-xs font-normal text-bark-500">/{p.slug}</span></span>
                  </Link>
                </td>
                <td className="px-4 py-3">{p.category.name}</td>
                <td className="px-4 py-3 font-semibold">{formatPrice(p.priceCents)}</td>
                <td className="px-4 py-3 text-bark-500">{p.leadTimeDays} j</td>
                <td className="px-4 py-3 text-bark-500">{p._count.options}</td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1">
                    {!p.isActive && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">masqué</span>}
                    {p.isFeatured && <span className="rounded-full bg-ocre-100 px-2 py-0.5 text-xs font-semibold text-terracotta-700">à la une</span>}
                    {p.isCustomizable && <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-semibold text-sage-700">configurateur</span>}
                    {p.isActive && !p.isFeatured && !p.isCustomizable && <span className="text-xs text-bark-500">en ligne</span>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
