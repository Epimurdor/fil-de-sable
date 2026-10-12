import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { OrderTimeline } from "@/components/order-timeline";
import { ProductVisual } from "@/components/product-visual";
import { StatusBadge } from "@/components/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { BEADS, describeConfig } from "@/lib/configurator";
import { formatDate, formatPrice } from "@/lib/format";
import { getOrderForUser } from "@/lib/orders/queries";
import { optionLabels } from "@/lib/products/pricing";
import { parseColors, parseCustomConfig, parseSelectedOptions } from "@/lib/types";

export const metadata: Metadata = { title: "Suivi de commande" };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ merci?: string }>;
}) {
  const [{ number }, { merci }] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/compte/commandes/${number}`);
  const order = await getOrderForUser(number, user.id);
  if (!order) notFound();

  return (
    <div className="space-y-8">
      {merci && (
        <div className="flex items-start gap-3 rounded-3xl bg-sage-100 p-5 text-sage-700">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>
            <span className="font-semibold">Merci !</span> Ta commande est bien reçue. L'atelier s'y met, et tu suivras
            chaque étape ici.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-semibold text-bark-900">{order.number}</h1>
          <p className="mt-1 text-sm text-bark-500">Passée le {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} className="text-sm" />
      </div>

      {order.status === "pending" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-ocre-400/60 bg-ocre-100 p-5">
          <p className="text-sm text-bark-800">Cette commande attend son paiement.</p>
          <ButtonLink href={`/paiement/simulation/${order.id}`}>Payer {formatPrice(order.totalCents)}</ButtonLink>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
        <section className="rounded-3xl border border-sand-200 bg-white/70 p-6">
          <h2 className="mb-5 font-display text-xl font-semibold text-bark-900">Où en est ta pièce</h2>
          <OrderTimeline status={order.status} events={order.events} />
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-sand-200 bg-white/70 p-6">
            <h2 className="font-display text-xl font-semibold text-bark-900">Articles</h2>
            <ul className="mt-4 divide-y divide-sand-200">
              {order.items.map((it) => {
                const custom = parseCustomConfig(it.customConfig);
                const details = custom ? describeConfig(custom) : optionLabels(it.product, parseSelectedOptions(it.selectedOptions));
                return (
                  <li key={it.id} className="flex gap-4 py-4">
                    <div className="w-16 shrink-0 overflow-hidden rounded-xl">
                      <ProductVisual
                        colors={parseColors(it.colors)}
                        imageUrl={custom ? null : it.product?.imageUrl}
                        beadHex={custom ? BEADS.find((b) => b.code === custom.bead)?.hex : null}
                        pattern={custom?.pattern}
                        alt={it.name}
                        sizes="64px"
                        className="aspect-square"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-bark-900">{it.quantity} × {it.name}</p>
                      <ul className="text-sm text-bark-500">{details.map((d) => <li key={d}>{d}</li>)}</ul>
                    </div>
                    <p className="font-semibold">{formatPrice(it.unitPriceCents * it.quantity)}</p>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-2 space-y-1 border-t border-sand-200 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-bark-500">Sous-total</dt><dd>{formatPrice(order.subtotalCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-bark-500">Livraison · {order.shippingName}</dt><dd>{order.shippingCents === 0 ? "Offerte" : formatPrice(order.shippingCents)}</dd></div>
              <div className="flex justify-between text-base font-semibold text-bark-900"><dt>Total</dt><dd>{formatPrice(order.totalCents)}</dd></div>
            </dl>
          </section>

          <section className="rounded-3xl border border-sand-200 bg-white/70 p-6 text-sm">
            <h2 className="font-display text-xl font-semibold text-bark-900">Livraison</h2>
            <address className="mt-3 not-italic text-bark-700">
              {order.shipFullName}<br />
              {order.shipLine1}<br />
              {order.shipLine2 && <>{order.shipLine2}<br /></>}
              {order.shipPostalCode} {order.shipCity}
              {order.shipPhone && <><br />{order.shipPhone}</>}
            </address>
            {order.customerNote && (
              <p className="mt-3 rounded-xl bg-sand-100 px-3 py-2 text-bark-700">« {order.customerNote} »</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
