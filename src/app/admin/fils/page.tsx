import type { Metadata } from "next";
import { ThreadStockForm } from "@/components/admin/thread-stock-form";
import { requireAdmin } from "@/lib/auth/session";
import { getAllThreads } from "@/lib/threads/queries";

export const metadata: Metadata = { title: "Stock de fil" };

export default async function AdminThreadsPage() {
  // Contrôle ici et pas seulement dans admin/layout.tsx : avec le rendu en flux (loading.tsx),
  // la page se rend en parallèle du layout et serait envoyée avant sa redirection.
  await requireAdmin();
  const threads = await getAllThreads();

  return (
    <div>
      <h1 className="text-3xl font-medium tracking-tight text-ink">Stock de fil</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-3">
        Coche les bobines Linhasita que tu as à l'atelier : seules celles-ci sont proposées dans le configurateur. Les couleurs
        affichées sont approximatives (mesurées sur les photos des cartelles).
      </p>
      <ThreadStockForm threads={threads} />
    </div>
  );
}
