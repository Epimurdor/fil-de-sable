import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { StatusBadge } from "@/components/status-badge";
import { BEADS, describeConfig } from "@/lib/configurator";
import { formatDateTime, formatPrice } from "@/lib/format";
import { getAdminOrder } from "@/lib/orders/queries";
import { STATUS_INFO, isOrderStatus } from "@/lib/orders/status";
import { optionLabels } from "@/lib/products/pricing";
import { parseCustomConfig, parseSelectedOptions } from "@/lib/types";

export const metadata: Metadata = { title: "Commande" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/commandes" className="text-sm text-ink-3 hover:text-ink">← Commandes</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-medium tracking-tight text-ink">{order.number}</h1>
          <StatusBadge status={order.status} className="text-sm" />
        </div>
        <p className="mt-1 text-sm text-ink-3">
          Passée le {formatDateTime(order.createdAt)} · paiement {order.paymentProvider}
          {order.paidAt ? ` validé le ${formatDateTime(order.paidAt)}` : " en attente"}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-md border border-line bg-white p-6">
            <h2 className="text-lg font-medium text-ink">À fabriquer</h2>
            <ul className="mt-4 divide-y divide-line">
              {order.items.map((it) => {
                const custom = parseCustomConfig(it.customConfig);
                const details = custom ? describeConfig(custom) : optionLabels(it.product, parseSelectedOptions(it.selectedOptions));
                return (
                  <li key={it.id} className="flex items-start justify-between gap-4 py-4">
                    <div>
                      <p className="font-semibold text-ink">
                        {it.quantity} × {it.name}
                        {custom && <span className="ml-2 rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-strong">sur mesure</span>}
                      </p>
                      <ul className="mt-1 text-sm text-ink-2">{details.map((d) => <li key={d}>{d}</li>)}</ul>
                      {custom && (
                        <div className="mt-2 flex items-center gap-1.5">
                          {custom.threads.map((t) => <span key={t} className="h-5 w-5 rounded-full ring-1 ring-ink/20" style={{ backgroundColor: t }} title={t} />)}
                          {(() => { const b = BEADS.find((x) => x.code === custom.bead); return b?.hex ? <span className="ml-2 h-4 w-4 rounded-full ring-1 ring-ink/30" style={{ backgroundColor: b.hex }} title={b.name} /> : null; })()}
                        </div>
                      )}
                    </div>
                    <p className="font-semibold">{formatPrice(it.unitPriceCents * it.quantity)}</p>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-2 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-3">Sous-total</dt><dd>{formatPrice(order.subtotalCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-3">Livraison · {order.shippingName}</dt><dd>{formatPrice(order.shippingCents)}</dd></div>
              <div className="flex justify-between text-base font-semibold text-ink"><dt>Total</dt><dd>{formatPrice(order.totalCents)}</dd></div>
            </dl>
          </section>

          <section className="grid gap-6 rounded-md border border-line bg-white p-6 text-sm sm:grid-cols-2">
            <div>
              <h2 className="text-lg font-medium text-ink">Client</h2>
              <p className="mt-2 text-ink-2">{order.user.firstName} {order.user.lastName}</p>
              <a href={`mailto:${order.user.email}`} className="text-accent-strong hover:underline">{order.user.email}</a>
            </div>
            <div>
              <h2 className="text-lg font-medium text-ink">Expédition</h2>
              <address className="mt-2 not-italic text-ink-2">
                {order.shipFullName}<br />{order.shipLine1}<br />
                {order.shipLine2 && <>{order.shipLine2}<br /></>}
                {order.shipPostalCode} {order.shipCity}
                {order.shipPhone && <><br />{order.shipPhone}</>}
              </address>
            </div>
            {order.customerNote && (
              <p className="rounded-md bg-paper-2 px-3 py-2 text-ink-2 sm:col-span-2">Mot du client : « {order.customerNote} »</p>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-md border border-line bg-white p-6">
            <h2 className="text-lg font-medium text-ink">Changer le statut</h2>
            <p className="mt-1 text-sm text-ink-3">Le client voit la mise à jour et la note dans son suivi.</p>
            <div className="mt-4">
              <OrderStatusForm orderId={order.id} current={order.status} />
            </div>
          </section>
          <section className="rounded-md border border-line bg-white p-6">
            <h2 className="text-lg font-medium text-ink">Historique</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {[...order.events].reverse().map((e) => (
                <li key={e.id} className="border-l-2 border-line pl-3">
                  <p className="font-semibold text-ink">{isOrderStatus(e.status) ? STATUS_INFO[e.status].label : e.status}</p>
                  <p className="text-xs text-ink-3">{formatDateTime(e.createdAt)}{e.note ? ` · ${e.note}` : ""}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
