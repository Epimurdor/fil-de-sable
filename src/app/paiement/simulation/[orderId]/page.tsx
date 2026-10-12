import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CreditCard, FlaskConical } from "lucide-react";
import { SubmitButton } from "@/components/forms/submit-button";
import { requireUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import { confirmMockPayment } from "@/lib/payment/actions";
import { getOrderForPayment } from "@/lib/orders/queries";

export const metadata: Metadata = { title: "Paiement" };

export default async function MockPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ echec?: string }>;
}) {
  const user = await requireUser("/panier");
  const [{ orderId }, { echec }] = await Promise.all([params, searchParams]);
  const order = await getOrderForPayment(orderId, user.id);
  if (!order) notFound();
  if (order.status !== "pending") redirect(`/compte/commandes/${order.number}`);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-sand-200 bg-white p-8 shadow-soft">
        <p className="inline-flex items-center gap-2 rounded-full bg-ocre-100 px-3 py-1 text-xs font-semibold text-terracotta-700">
          <FlaskConical className="h-4 w-4" aria-hidden /> Paiement simulé
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-bark-900">Commande {order.number}</h1>
        <p className="mt-1 text-sm text-bark-500">
          En production, cette étape est remplacée par la page de paiement du prestataire (Stripe).
        </p>

        <ul className="mt-6 divide-y divide-sand-200 text-sm">
          {order.items.map((it) => (
            <li key={it.id} className="flex justify-between py-2">
              <span className="text-bark-700">{it.quantity} × {it.name}</span>
              <span>{formatPrice(it.unitPriceCents * it.quantity)}</span>
            </li>
          ))}
          <li className="flex justify-between py-2 text-bark-500"><span>Livraison · {order.shippingName}</span><span>{order.shippingCents === 0 ? "Offerte" : formatPrice(order.shippingCents)}</span></li>
          <li className="flex justify-between py-3 text-lg font-semibold text-bark-900"><span>Total</span><span>{formatPrice(order.totalCents)}</span></li>
        </ul>

        {echec && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
            Paiement refusé (simulation). Tu peux réessayer.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <form action={confirmMockPayment}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="outcome" value="success" />
            <SubmitButton pendingText="Paiement en cours…" className="w-full">
              <CreditCard className="h-4 w-4" aria-hidden /> Payer {formatPrice(order.totalCents)}
            </SubmitButton>
          </form>
          <form action={confirmMockPayment}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="outcome" value="fail" />
            <SubmitButton variant="ghost" pendingText="…" className="w-full">
              Simuler un refus
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
