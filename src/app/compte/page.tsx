import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth/session";
import { formatDate, formatPrice } from "@/lib/format";
import { getDefaultAddress } from "@/lib/orders/checkout";
import { getUserOrders } from "@/lib/orders/queries";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const user = await requireUser("/compte");
  const [orders, address] = await Promise.all([getUserOrders(user.id), getDefaultAddress(user.id)]);
  const recent = orders.slice(0, 3);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl text-ink">Mon profil</h1>

      <div className="grid gap-5 sm:grid-cols-2">
        <section className="rounded-lg border border-line bg-white/70 p-6">
          <h2 className="text-lg font-medium text-ink">Identité</h2>
          <p className="mt-3 text-ink-2">{user.firstName} {user.lastName}</p>
          <p className="text-sm text-ink-3">{user.email}</p>
        </section>
        <section className="rounded-lg border border-line bg-white/70 p-6">
          <h2 className="text-lg font-medium text-ink">Adresse de livraison</h2>
          {address ? (
            <address className="mt-3 not-italic text-ink-2">
              {address.fullName}<br />
              {address.line1}<br />
              {address.line2 && <>{address.line2}<br /></>}
              {address.postalCode} {address.city}
            </address>
          ) : (
            <p className="mt-3 text-sm text-ink-3">Elle sera retenue lors de ta première commande.</p>
          )}
        </section>
      </div>

      <section>
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-medium text-ink">Dernières commandes</h2>
          {orders.length > 3 && (
            <Link href="/compte/commandes" className="text-sm font-semibold text-accent-strong hover:underline">Tout voir</Link>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-line-2 p-6 text-sm text-ink-3">
            Aucune commande pour l'instant. <Link href="/boutique" className="font-semibold text-accent-strong hover:underline">La boutique t'attend.</Link>
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line bg-white/70">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/compte/commandes/${o.number}`} className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-paper">
                  <div>
                    <p className="font-semibold text-ink">{o.number}</p>
                    <p className="text-sm text-ink-3">{formatDate(o.createdAt)} · {o.items.length} article{o.items.length > 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={o.status} />
                    <span className="font-semibold">{formatPrice(o.totalCents)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
