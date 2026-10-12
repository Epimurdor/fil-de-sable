import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories } from "@/lib/products/queries";

export const metadata: Metadata = { title: "Nouveau produit" };

export default async function NewProductPage() {
  const categories = await getCategories();
  return (
    <div>
      <Link href="/admin/produits" className="text-sm text-bark-500 hover:text-bark-900">← Produits</Link>
      <h1 className="mt-2 font-display text-4xl font-semibold text-bark-900">Nouveau produit</h1>
      <div className="mt-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
