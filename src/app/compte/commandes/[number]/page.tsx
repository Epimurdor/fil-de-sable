import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderTimeline } from "@/components/order-timeline";
import { ProductVisual } from "@/components/product-visual";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/forms/submit-button";
import { requireUser } from "@/lib/auth/session";
import { startPayment } from "@/lib/payment/actions";
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
  searchParams: Promise<{ merci?: string; paiement?: string }>;
}) {
  const [{ number }, { merci, paiement }] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/compte/commandes/${number}`);
  const order = await getOrderForUser(number, user.id);
  if (!order) notFound();

  return (
    <div className="space-y-8">
      {merci && order.status !== "pending" && (
        <div className="flex items-start gap-3 rounded-md bg-accent-soft p-5 text-accent-strong">
          <p>
            <span className="font-semibold">Merci !</span> Ta commande est bien reçue. L'atelier s'y met, et tu suivras
            chaque étape ici.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-ink">{order.number}</h1>
          <p className="mt-1 text-sm text-ink-3">Passée le {formatDate(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} className="text-sm" />
      </div>

      {order.status === "pending" && paiement === "erreur" && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          Le paiement n'a pas pu être lancé. Réessaie dans quelques instants.
        </p>
      )}

      {order.status === "pending" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-accent/60 bg-accent-soft p-5">
          <p className="text-sm text-ink">
            {merci
              ? "Paiement en cours de confirmation : rafraîchis la page dans un instant."
              : paiement === "annule"
                ? "Paiement annulé. Ta commande t'attend : tu peux la régler quand tu veux."
                : "Cette commande attend son paiement."}
          </p>
          <form action={startPayment}>
            <input type="hidden" name="orderId" value={order.id} />
            <SubmitButton pendingText="Redirection…">Payer {formatPrice(order.totalCents)}</SubmitButton>
          </form>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
        <section className="rounded-md border border-line bg-card/70 p-6">
          <h2 className="mb-5 text-lg font-medium text-ink">Où en est ta pièce</h2>
          <OrderTimeline status={order.status} events={order.events} />
        </section>

        <div className="space-y-6">
          <section className="rounded-md border border-line bg-card/70 p-6">
            <h2 className="text-lg font-medium text-ink">Articles</h2>
            <ul className="mt-4 divide-y divide-line">
              {order.items.map((it) => {
                const custom = parseCustomConfig(it.customConfig);
                const details = custom ? describeConfig(custom) : optionLabels(it.product, parseSelectedOptions(it.selectedOptions));
                return (
                  <li key={it.id} className="flex gap-4 py-4">
                    <div className="w-16 shrink-0 overflow-hidden rounded-md">
                      <ProductVisual
                        colors={parseColors(it.colors)}
                        imageUrl={custom ? null : it.product?.imageUrl}
                        beadHex={custom ? BEADS.find((b) => b.code === custom.bead)?.hex : null}
                        pattern={custom?.pattern} sketch={!!custom}
                        alt={it.name}
                        sizes="64px"
                        className="aspect-square"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-ink">{it.quantity} × {it.name}</p>
                      <ul className="text-sm text-ink-3">{details.map((d) => <li key={d}>{d}</li>)}</ul>
                    </div>
                    <p className="font-semibold">{formatPrice(it.unitPriceCents * it.quantity)}</p>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-2 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-3">Sous-total</dt><dd>{formatPrice(order.subtotalCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-3">Livraison · {order.shippingName}</dt><dd>{order.shippingCents === 0 ? "Offerte" : formatPrice(order.shippingCents)}</dd></div>
              <div className="flex justify-between text-base font-semibold text-ink"><dt>Total</dt><dd>{formatPrice(order.totalCents)}</dd></div>
            </dl>
          </section>

          <section className="rounded-md border border-line bg-card/70 p-6 text-sm">
            <h2 className="text-lg font-medium text-ink">Livraison</h2>
            <address className="mt-3 not-italic text-ink-2">
              {order.shipFullName}<br />
              {order.shipLine1}<br />
              {order.shipLine2 && <>{order.shipLine2}<br /></>}
              {order.shipPostalCode} {order.shipCity}
              {order.shipPhone && <><br />{order.shipPhone}</>}
            </address>
            {order.customerNote && (
              <p className="mt-3 rounded-md bg-paper-2 px-3 py-2 text-ink-2">« {order.customerNote} »</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
