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
      <ProductVisual
        colors={parseColors(product.colors)}
        kind={kindFromCategorySlug(product.category.slug)}
        imageUrl={product.imageUrl}
        alt={product.name}
        className="aspect-[4/5] rounded-md"
        priority={priority}
      />
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-medium text-ink underline-offset-4 group-hover:underline">{product.name}</h3>
        <p className="shrink-0 text-sm text-ink-2">
          {product.isCustomizable ? `dès ${formatPrice(product.priceCents)}` : formatPrice(product.priceCents)}
        </p>
      </div>
      <p className="mt-0.5 text-xs text-ink-3">{product.isCustomizable ? "À composer" : leadTimeLabel(product.leadTimeDays)}</p>
    </Link>
  );
}
