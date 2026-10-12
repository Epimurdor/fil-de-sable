import type { Prisma } from "@prisma/client";
import { site } from "@/config/site";
import { prisma } from "@/lib/db";
import { getInStock, isAvailable } from "./availability";

// Tant que le sur-mesure est mis de côté, le produit du configurateur reste hors boutique.
const customFilter = site.customEnabled ? {} : { isCustomizable: false };

export const productInclude = {
  category: true,
  options: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductInclude;

export type ProductFull = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export type ShopSort = "new" | "price-asc" | "price-desc";

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getProducts(params: { category?: string; sort?: ShopSort } = {}) {
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    params.sort === "price-asc"
      ? [{ priceCents: "asc" }]
      : params.sort === "price-desc"
        ? [{ priceCents: "desc" }]
        : params.sort === "new"
          ? [{ createdAt: "desc" }]
          : [{ sortOrder: "asc" }, { createdAt: "desc" }];

  const [products, inStock] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, ...customFilter, ...(params.category ? { category: { slug: params.category } } : {}) },
      include: productInclude,
      orderBy,
    }),
    getInStock(),
  ]);
  return products.filter((p) => isAvailable(p, inStock));
}

export async function getProductBySlug(slug: string): Promise<ProductFull | null> {
  return prisma.product.findUnique({ where: { slug }, include: productInclude });
}

export async function getFeaturedProducts(limit = 4) {
  const [products, inStock] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true, ...customFilter },
      include: productInclude,
      orderBy: { sortOrder: "asc" },
    }),
    getInStock(),
  ]);
  return products.filter((p) => isAvailable(p, inStock)).slice(0, limit);
}

export async function getCustomizableProduct(): Promise<ProductFull | null> {
  return prisma.product.findFirst({ where: { isActive: true, isCustomizable: true }, include: productInclude });
}
