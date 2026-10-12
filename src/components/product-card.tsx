import Link from "next/link";
import { ProductVisual } from "./product-visual";
import { formatPrice, leadTimeLabel } from "@/lib/format";
import { kindFromCategorySlug, parseColors } from "@/lib/types";

export type ProductCardData = {
  slug: string;
  name: string;
  tagline: string | null;
  priceCents: number;
  leadTimeDays: number;
  colors: string;
  imageUrl: string | null;
  isCustomizable: boolean;
  category: { slug: string };
};

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  const href = product.isCustomizable ? "/configurateur" : `/boutique/${product.slug}`;
  return (
    <Link href={href} className="group block">
      <div className="overflow-hidden rounded-xl shadow-soft transition-[box-shadow,transform] duration-300 group-hover:-translate-y-1 group-hover:shadow-lift">
        <ProductVisual
          colors={parseColors(product.colors)}
          kind={kindFromCategorySlug(product.category.slug)}
          imageUrl={product.imageUrl}
          alt={product.name}
          className="aspect-[4/5] [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-105"
          priority={priority}
        />
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-medium text-ink"><span className="link-fil pb-0.5">{product.name}</span></h3>
        <p className="shrink-0 text-sm text-accent-strong">
          {product.isCustomizable ? `dès ${formatPrice(product.priceCents)}` : formatPrice(product.priceCents)}
        </p>
      </div>
      <p className="mt-0.5 text-xs text-ink-3">{product.isCustomizable ? "À composer" : leadTimeLabel(product.leadTimeDays)}</p>
    </Link>
  );
}
