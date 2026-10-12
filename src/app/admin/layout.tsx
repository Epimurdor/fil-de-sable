import Link from "next/link";
import { NavLink } from "@/components/nav-link";
import { site } from "@/config/site";
import { requireAdmin } from "@/lib/auth/session";

const linkClass = "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-full bg-paper">
      <div className="bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <p className="mr-4 text-base font-medium">
            {site.name} <span className="text-accent">· atelier</span>
          </p>
          <nav className="flex flex-wrap gap-1">
            <NavLink href="/admin" exact className={linkClass} activeClassName="bg-paper text-ink" inactiveClassName="text-paper/80 hover:text-paper">Tableau de bord</NavLink>
            <NavLink href="/admin/commandes" className={linkClass} activeClassName="bg-paper text-ink" inactiveClassName="text-paper/80 hover:text-paper">Commandes</NavLink>
            <NavLink href="/admin/produits" className={linkClass} activeClassName="bg-paper text-ink" inactiveClassName="text-paper/80 hover:text-paper">Produits</NavLink>
          </nav>
          <Link href="/" className="ml-auto text-sm text-line hover:text-white">Voir le site →</Link>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
