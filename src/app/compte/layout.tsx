import { NavLink } from "@/components/nav-link";
import { logout } from "@/lib/auth/actions";
import { requireUser } from "@/lib/auth/session";

const linkClass = "rounded-full px-4 py-2 text-sm font-semibold text-bark-700 transition hover:bg-sand-100";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/compte");
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[230px_1fr] md:gap-12">
      <aside className="md:sticky md:top-24 md:self-start">
        <p className="font-display text-2xl font-semibold text-bark-900">Bonjour {user.firstName}</p>
        <nav className="mt-4 flex flex-wrap gap-1 md:flex-col">
          <NavLink href="/compte" exact className={linkClass}>Mon profil</NavLink>
          <NavLink href="/compte/commandes" className={linkClass}>Mes commandes</NavLink>
          {user.role === "admin" && (
            <NavLink href="/admin" className={linkClass}>Administration</NavLink>
          )}
        </nav>
        <form action={logout} className="mt-6">
          <button className="px-4 text-sm text-bark-500 hover:text-red-700">Se déconnecter</button>
        </form>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
