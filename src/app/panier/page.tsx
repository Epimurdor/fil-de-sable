import type { Metadata } from "next";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { ProductVisual } from "@/components/product-visual";
import { ButtonLink } from "@/components/ui/button";
import { cartSummary, getCart, type CartItemWithProduct } from "@/lib/cart/cart";
import { removeCartItem, updateCartItem } from "@/lib/cart/actions";
import { BEADS, describeConfig } from "@/lib/configurator";
import { formatPrice } from "@/lib/format";
import { optionLabels } from "@/lib/products/pricing";
import { getShippingMethods, lowestFreeThreshold } from "@/lib/shipping";
import { kindFromCategorySlug, parseColors, parseCustomConfig, parseSelectedOptions } from "@/lib/types";

export const metadata: Metadata = { title: "Panier" };

function CartRow({ item }: { item: CartItemWithProduct }) {
  const custom = parseCustomConfig(item.customConfig);
  const details = custom ? describeConfig(custom) : optionLabels(item.product, parseSelectedOptions(item.selectedOptions));
  const bead = custom ? BEADS.find((b) => b.code === custom.bead)?.hex : null;

  return (
    <li className="flex gap-4 py-6">
      <div className="w-24 shrink-0 overflow-hidden rounded-2xl sm:w-28">
        <ProductVisual
          colors={custom ? custom.threads : parseColors(item.product.colors)}
          kind={kindFromCategorySlug(item.product.category.slug)}
          imageUrl={custom ? null : item.product.imageUrl}
          beadHex={bead}
          pattern={custom?.pattern}
          alt={item.product.name}
          sizes="112px"
          className="aspect-square"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold text-bark-900">
              {item.product.name}
              {custom && (
                <>
                  {" "}
                  <span className="ml-1 rounded-full bg-ocre-100 px-2 py-0.5 text-xs font-semibold text-terracotta-700">sur mesure</span>
                </>
              )}
            </p>
            <ul className="mt-1 text-sm text-bark-500">
              {details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <p className="shrink-0 font-semibold text-bark-900">{formatPrice(item.unitPriceCents * item.quantity)}</p>
        </div>
        <div className="mt-auto flex items-center gap-3">
          <form action={updateCartItem} className="inline-flex items-center rounded-full border border-sand-300 bg-white">
            <input type="hidden" name="itemId" value={item.id} />
            <button name="quantity" value={item.quantity - 1} className="px-2.5 py-1.5 text-bark-700 hover:text-bark-900" aria-label="Moins">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
            <button name="quantity" value={item.quantity + 1} className="px-2.5 py-1.5 text-bark-700 hover:text-bark-900" aria-label="Plus">
              <Plus className="h-4 w-4" />
            </button>
          </form>
          <form action={removeCartItem}>
            <input type="hidden" name="itemId" value={item.id} />
            <button className="inline-flex items-center gap-1 text-sm text-bark-500 hover:text-red-700">
              <Trash2 className="h-4 w-4" aria-hidden /> Retirer
            </button>
          </form>
          <span className="ml-auto text-xs text-bark-500">{formatPrice(item.unitPriceCents)} l'unité</span>
        </div>
      </div>
    </li>
  );
}

export default async function CartPage() {
  const [cart, methods] = await Promise.all([getCart(), getShippingMethods()]);
  const { items, itemCount, subtotalCents, maxLeadTimeDays } = cartSummary(cart);
  const threshold = lowestFreeThreshold(methods);
  const cheapest = methods.length ? Math.min(...methods.map((m) => m.priceCents)) : 0;
  const freeShipping = threshold != null && subtotalCents >= threshold;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-bark-900">Ton panier est vide</h1>
        <p className="mt-3 text-bark-500">Pas de panique, l'atelier a de quoi le remplir.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/boutique">Voir la boutique</ButtonLink>
          <ButtonLink href="/configurateur" variant="secondary">Composer un bracelet</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-bark-900">
        Ton panier <span className="text-bark-500">· {itemCount} article{itemCount > 1 ? "s" : ""}</span>
      </h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-sand-200">
          {items.map((it) => (
            <CartRow key={it.id} item={it} />
          ))}
        </ul>

        <aside className="h-fit rounded-3xl border border-sand-200 bg-white/70 p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-semibold text-bark-900">Récapitulatif</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-bark-500">Sous-total</dt><dd className="font-semibold">{formatPrice(subtotalCents)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-bark-500">Livraison</dt>
              <dd className="font-semibold">{freeShipping ? "Offerte" : `dès ${formatPrice(cheapest)}`}</dd>
            </div>
            <div className="flex justify-between"><dt className="text-bark-500">Délai de confection</dt><dd className="font-semibold">{maxLeadTimeDays} jours</dd></div>
          </dl>
          {!freeShipping && threshold != null && (
            <p className="mt-3 rounded-xl bg-sage-100 px-3 py-2 text-xs text-sage-700">
              Plus que {formatPrice(threshold - subtotalCents)} pour la livraison offerte.
            </p>
          )}
          <ButtonLink href="/commande" className="mt-6 w-full">Passer commande</ButtonLink>
          <Link href="/boutique" className="mt-3 block text-center text-sm text-bark-500 hover:text-bark-900">
            Continuer mes achats
          </Link>
        </aside>
      </div>
    </div>
  );
}
