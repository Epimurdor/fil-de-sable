import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatPrice } from "@/lib/format";
import { getAdminOrders, getAdminStats } from "@/lib/orders/queries";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminHome() {
  const [stats, orders] = await Promise.all([getAdminStats(), getAdminOrders()]);
  const recent = orders.slice(0, 8);

  const cards = [
    { label: "À lancer", value: stats.pending, href: "/admin/commandes?statut=paid", tone: "bg-ocre-100 text-terracotta-700" },
    { label: "En confection", value: stats.inProgress, href: "/admin/commandes?statut=in_progress", tone: "bg-terracotta-100 text-terracotta-700" },
    { label: "À expédier", value: stats.toShip, href: "/admin/commandes?statut=ready", tone: "bg-sage-100 text-sage-700" },
    { label: "Clients", value: stats.customers, href: "/admin/commandes", tone: "bg-sand-100 text-bark-700" },
    { label: "Produits actifs", value: stats.products, href: "/admin/produits", tone: "bg-sand-100 text-bark-700" },
    { label: "Chiffre d'affaires", value: formatPrice(stats.revenueCents), href: "/admin/commandes", tone: "bg-bark-900 text-sand-50" },
  ];

  return (
    <div className="space-y-10">
      <h1 className="font-display text-4xl font-semibold text-bark-900">Tableau de bord</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={`rounded-3xl p-5 transition hover:-translate-y-0.5 ${c.tone}`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{c.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold">{c.value}</p>
          </Link>
        ))}
      </div>

      <section>
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-bark-900">Dernières commandes</h2>
          <Link href="/admin/commandes" className="text-sm font-semibold text-terracotta-600 hover:underline">Toutes les commandes</Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-bark-500">Aucune commande pour le moment.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-3xl border border-sand-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-sand-100 text-left text-xs uppercase tracking-wider text-bark-500">
                <tr><th className="px-4 py-3">Numéro</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {recent.map((o) => (
                  <tr key={o.id} className="hover:bg-sand-50">
                    <td className="px-4 py-3"><Link href={`/admin/commandes/${o.id}`} className="font-semibold text-bark-900 hover:underline">{o.number}</Link></td>
                    <td className="px-4 py-3 text-bark-500">{formatDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">{o.user.firstName} {o.user.lastName}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-right font-semibold">{formatPrice(o.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
