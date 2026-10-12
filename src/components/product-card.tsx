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
      <div className="overflow-hidden rounded-3xl shadow-soft transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
        <ProductVisual
          colors={parseColors(product.colors)}
          kind={kindFromCategorySlug(product.category.slug)}
          imageUrl={product.imageUrl}
          alt={product.name}
          className="aspect-[4/5]"
          priority={priority}
        />
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold leading-tight text-bark-900">{product.name}</h3>
          {product.tagline && <p className="mt-0.5 text-sm text-bark-500">{product.tagline}</p>}
        </div>
        <p className="shrink-0 font-semibold text-bark-900">
          {product.isCustomizable ? `dès ${formatPrice(product.priceCents)}` : formatPrice(product.priceCents)}
        </p>
      </div>
      <p className="mt-1 text-xs font-medium text-sage-700">
        {product.isCustomizable ? "Compose-le toi-même" : leadTimeLabel(product.leadTimeDays)}
      </p>
    </Link>
  );
}
