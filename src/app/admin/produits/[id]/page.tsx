import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { SubmitButton } from "@/components/forms/submit-button";
import { deleteProduct } from "@/lib/admin/actions";
import { formatOptionsText } from "@/lib/admin/options-text";
import { prisma } from "@/lib/db";
import { getCategories } from "@/lib/products/queries";
import { parseColors } from "@/lib/types";

export const metadata: Metadata = { title: "Modifier le produit" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { options: { orderBy: { sortOrder: "asc" } } } }),
    getCategories(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/produits" className="text-sm text-ink-3 hover:text-ink">← Produits</Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-medium tracking-tight text-ink">{product.name}</h1>
        <Link href={product.isCustomizable ? "/configurateur" : `/boutique/${product.slug}`} className="text-sm font-semibold text-accent-strong hover:underline">
          Voir sur le site →
        </Link>
      </div>
      <div className="mt-6">
        <ProductForm
          categories={categories}
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            tagline: product.tagline ?? "",
            description: product.description,
            price: (product.priceCents / 100).toFixed(2).replace(".", ","),
            leadTimeDays: product.leadTimeDays,
            categoryId: product.categoryId,
            colors: parseColors(product.colors).join(", "),
            imageUrl: product.imageUrl ?? "",
            optionsText: formatOptionsText(product.options),
            isActive: product.isActive,
            isFeatured: product.isFeatured,
            isCustomizable: product.isCustomizable,
          }}
        />
      </div>
      <form action={deleteProduct} className="mt-10 rounded-md border border-red-200 bg-red-50/60 p-6">
        <input type="hidden" name="id" value={product.id} />
        <p className="text-sm text-red-800">Supprimer définitivement ce produit. Les commandes passées gardent leur instantané.</p>
        <SubmitButton variant="secondary" pendingText="Suppression…" className="mt-3 border-red-300 text-red-700 hover:border-red-500">
          Supprimer le produit
        </SubmitButton>
      </form>
    </div>
  );
}
