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
      <div className="w-24 shrink-0 overflow-hidden rounded-md sm:w-28">
        <ProductVisual
          colors={custom ? custom.threads : parseColors(item.product.colors)}
          kind={kindFromCategorySlug(item.product.category.slug)}
          imageUrl={custom ? null : item.product.imageUrl}
          beadHex={bead}
          pattern={custom?.pattern} sketch={!!custom}
          alt={item.product.name}
          sizes="112px"
          className="aspect-square"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-medium text-ink">
              {item.product.name}
              {custom && (
                <>
                  {" "}
                  <span className="ml-1 rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-strong">sur mesure</span>
                </>
              )}
            </p>
            <ul className="mt-1 text-sm text-ink-3">
              {details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <p className="shrink-0 font-semibold text-ink">{formatPrice(item.unitPriceCents * item.quantity)}</p>
        </div>
        <div className="mt-auto flex items-center gap-3">
          <form action={updateCartItem} className="inline-flex items-center rounded-md border border-line-2 bg-white">
            <input type="hidden" name="itemId" value={item.id} />
            <button name="quantity" value={item.quantity - 1} className="px-2.5 py-1.5 text-ink-2 hover:text-ink" aria-label="Moins">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
            <button name="quantity" value={item.quantity + 1} className="px-2.5 py-1.5 text-ink-2 hover:text-ink" aria-label="Plus">
              <Plus className="h-4 w-4" />
            </button>
          </form>
          <form action={removeCartItem}>
            <input type="hidden" name="itemId" value={item.id} />
            <button className="inline-flex items-center gap-1 text-sm text-ink-3 hover:text-red-700">
              <Trash2 className="h-4 w-4" aria-hidden /> Retirer
            </button>
          </form>
          <span className="ml-auto text-xs text-ink-3">{formatPrice(item.unitPriceCents)} l'unité</span>
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
        <h1 className="text-3xl font-medium tracking-tight text-ink">Ton panier est vide</h1>
        <p className="mt-3 text-ink-3">Pas de panique, l'atelier a de quoi le remplir.</p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/boutique">Voir la boutique</ButtonLink>
          <ButtonLink href="/configurateur" variant="secondary">Composer un bracelet</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-medium tracking-tight text-ink">
        Ton panier <span className="text-ink-3">· {itemCount} article{itemCount > 1 ? "s" : ""}</span>
      </h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-line">
          {items.map((it) => (
            <CartRow key={it.id} item={it} />
          ))}
        </ul>

        <aside className="h-fit rounded-md border border-line bg-white/70 p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-medium text-ink">Récapitulatif</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink-3">Sous-total</dt><dd className="font-semibold">{formatPrice(subtotalCents)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-ink-3">Livraison</dt>
              <dd className="font-semibold">{freeShipping ? "Offerte" : `dès ${formatPrice(cheapest)}`}</dd>
            </div>
            <div className="flex justify-between"><dt className="text-ink-3">Délai de confection</dt><dd className="font-semibold">{maxLeadTimeDays} jours</dd></div>
          </dl>
          {!freeShipping && threshold != null && (
            <p className="mt-3 rounded-md bg-accent-soft px-3 py-2 text-xs text-accent-strong">
              Plus que {formatPrice(threshold - subtotalCents)} pour la livraison offerte.
            </p>
          )}
          <ButtonLink href="/commande" className="mt-6 w-full">Passer commande</ButtonLink>
          <Link href="/boutique" className="mt-3 block text-center text-sm text-ink-3 hover:text-ink">
            Continuer mes achats
          </Link>
        </aside>
      </div>
    </div>
  );
}
