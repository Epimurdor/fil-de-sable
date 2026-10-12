import Link from "next/link";
import { NavLink } from "@/components/nav-link";
import { site } from "@/config/site";
import { requireAdmin } from "@/lib/auth/session";

const linkClass = "rounded-full px-4 py-1.5 text-sm font-semibold text-sand-200 transition hover:bg-bark-800 hover:text-white";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-full bg-sand-50">
      <div className="bg-bark-900 text-sand-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <p className="mr-4 font-display text-lg font-semibold">
            {site.name} <span className="text-ocre-400">· atelier</span>
          </p>
          <nav className="flex flex-wrap gap-1">
            <NavLink href="/admin" exact className={linkClass} activeClassName="bg-sand-50 text-bark-900">Tableau de bord</NavLink>
            <NavLink href="/admin/commandes" className={linkClass} activeClassName="bg-sand-50 text-bark-900">Commandes</NavLink>
            <NavLink href="/admin/produits" className={linkClass} activeClassName="bg-sand-50 text-bark-900">Produits</NavLink>
          </nav>
          <Link href="/" className="ml-auto text-sm text-sand-200 hover:text-white">Voir le site →</Link>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
