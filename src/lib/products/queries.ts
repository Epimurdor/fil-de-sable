import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

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

  return prisma.product.findMany({
    where: { isActive: true, ...(params.category ? { category: { slug: params.category } } : {}) },
    include: productInclude,
    orderBy,
  });
}

export async function getProductBySlug(slug: string): Promise<ProductFull | null> {
  return prisma.product.findUnique({ where: { slug }, include: productInclude });
}

export async function getFeaturedProducts(limit = 4) {
  return prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: productInclude,
    orderBy: { sortOrder: "asc" },
    take: limit,
  });
}

export async function getCustomizableProduct(): Promise<ProductFull | null> {
  return prisma.product.findFirst({ where: { isActive: true, isCustomizable: true }, include: productInclude });
}
