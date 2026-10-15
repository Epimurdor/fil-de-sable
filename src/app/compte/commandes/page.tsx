import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth/session";
import { formatDate, formatPrice } from "@/lib/format";
import { getUserOrders } from "@/lib/orders/queries";

export const metadata: Metadata = { title: "Mes commandes" };

export default async function OrdersPage() {
  const user = await requireUser("/compte/commandes");
  const orders = await getUserOrders(user.id);

  return (
    <div>
      <h1 className="text-3xl font-medium tracking-tight text-ink">Mes commandes</h1>
      {orders.length === 0 ? (
        <p className="mt-6 rounded-md border border-dashed border-line-2 p-6 text-sm text-ink-3">
          Rien pour l'instant. <Link href="/boutique" className="font-semibold text-accent-strong hover:underline">Voir la boutique</Link>
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-md border border-line bg-card/70">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/compte/commandes/${o.number}`} className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-paper">
                <div>
                  <p className="font-semibold text-ink">{o.number}</p>
                  <p className="text-sm text-ink-3">
                    {formatDate(o.createdAt)} · {o.items.map((i) => i.name).join(", ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <StatusBadge status={o.status} />
                  <span className="font-semibold">{formatPrice(o.totalCents)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
