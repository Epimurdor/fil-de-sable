import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/cn";
import { formatDateTime, formatPrice } from "@/lib/format";
import { getAdminOrders } from "@/lib/orders/queries";
import { ORDER_STATUSES, STATUS_INFO, isOrderStatus } from "@/lib/orders/status";

export const metadata: Metadata = { title: "Commandes" };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ statut?: string }> }) {
  const { statut } = await searchParams;
  const filter = statut && isOrderStatus(statut) ? statut : undefined;
  const orders = await getAdminOrders(filter);

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold text-bark-900">Commandes</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/commandes" className={cn("rounded-full border px-3.5 py-1.5 text-sm font-semibold", !filter ? "border-bark-900 bg-bark-900 text-sand-50" : "border-sand-300 bg-white text-bark-700")}>
          Toutes
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/commandes?statut=${s}`}
            className={cn("rounded-full border px-3.5 py-1.5 text-sm font-semibold", filter === s ? "border-bark-900 bg-bark-900 text-sand-50" : "border-sand-300 bg-white text-bark-700")}
          >
            {STATUS_INFO[s].label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-bark-500">Aucune commande dans cette vue.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-3xl border border-sand-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-sand-100 text-left text-xs uppercase tracking-wider text-bark-500">
              <tr>
                <th className="px-4 py-3">Numéro</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Articles</th><th className="px-4 py-3">Livraison</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-sand-50">
                  <td className="px-4 py-3"><Link href={`/admin/commandes/${o.id}`} className="font-semibold text-bark-900 hover:underline">{o.number}</Link></td>
                  <td className="px-4 py-3 text-bark-500">{formatDateTime(o.createdAt)}</td>
                  <td className="px-4 py-3">{o.user.firstName} {o.user.lastName}<br /><span className="text-xs text-bark-500">{o.user.email}</span></td>
                  <td className="px-4 py-3">{o._count.items}</td>
                  <td className="px-4 py-3 text-bark-500">{o.shippingName}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-right font-semibold">{formatPrice(o.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
