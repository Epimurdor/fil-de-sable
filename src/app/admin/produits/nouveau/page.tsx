import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories } from "@/lib/products/queries";

export const metadata: Metadata = { title: "Nouveau produit" };

export default async function NewProductPage() {
  // Contrôle ici et pas seulement dans admin/layout.tsx : avec le rendu en flux (loading.tsx),
  // la page se rend en parallèle du layout et serait envoyée avant sa redirection.
  await requireAdmin();
  const categories = await getCategories();
  return (
    <div>
      <Link href="/admin/produits" className="text-sm text-ink-3 hover:text-ink">← Produits</Link>
      <h1 className="mt-2 text-3xl font-medium tracking-tight text-ink">Nouveau produit</h1>
      <div className="mt-6">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
