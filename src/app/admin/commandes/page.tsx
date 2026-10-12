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
      <h1 className="text-3xl font-medium tracking-tight text-ink">Commandes</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/commandes" className={cn("rounded-md border px-3.5 py-1.5 text-sm font-semibold", !filter ? "border-ink bg-ink text-paper" : "border-line-2 bg-white text-ink-2")}>
          Toutes
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/commandes?statut=${s}`}
            className={cn("rounded-md border px-3.5 py-1.5 text-sm font-semibold", filter === s ? "border-ink bg-ink text-paper" : "border-line-2 bg-white text-ink-2")}
          >
            {STATUS_INFO[s].label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-ink-3">Aucune commande dans cette vue.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-md border border-line bg-white">
          <table className="w-full text-sm">
            <thead className="bg-paper-2 text-left text-xs uppercase tracking-wider text-ink-3">
              <tr>
                <th className="px-4 py-3">Numéro</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Articles</th><th className="px-4 py-3">Livraison</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-paper">
                  <td className="px-4 py-3"><Link href={`/admin/commandes/${o.id}`} className="font-semibold text-ink hover:underline">{o.number}</Link></td>
                  <td className="px-4 py-3 text-ink-3">{formatDateTime(o.createdAt)}</td>
                  <td className="px-4 py-3">{o.user.firstName} {o.user.lastName}<br /><span className="text-xs text-ink-3">{o.user.email}</span></td>
                  <td className="px-4 py-3">{o._count.items}</td>
                  <td className="px-4 py-3 text-ink-3">{o.shippingName}</td>
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
