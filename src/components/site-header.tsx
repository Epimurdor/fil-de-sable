import Link from "next/link";
import { site } from "@/config/site";
import { getCurrentUser } from "@/lib/auth/session";
import { cartSummary, getCart } from "@/lib/cart/cart";
import { NavLink } from "./nav-link";

const links = [
  { href: "/boutique", label: "Boutique" },
  { href: "/configurateur", label: "Sur mesure" },
  { href: "/quiz", label: "Trouver mon bijou" },
  { href: "/atelier", label: "L'atelier" },
];

export async function SiteHeader() {
  const [user, cart] = await Promise.all([getCurrentUser(), getCart()]);
  const { itemCount } = cartSummary(cart);

  const nav = links.map((l) => (
    <NavLink
      key={l.href}
      href={l.href}
      className="link-fil shrink-0 whitespace-nowrap pb-0.5"
      activeClassName="text-ink"
      inactiveClassName="text-ink-2 hover:text-ink"
    >
      {l.label}
    </NavLink>
  ));

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2 font-display text-xl text-ink">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-accent ring-4 ring-accent-soft transition-transform duration-300 group-hover:scale-125" />
          {site.name}
        </Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">{nav}</nav>
        <div className="flex items-center gap-5 text-sm">
          <Link href={user ? (user.role === "admin" ? "/admin" : "/compte") : "/connexion"} className="link-fil pb-0.5 text-ink-2 hover:text-ink">
            {user ? user.firstName : "Connexion"}
          </Link>
          <Link href="/panier" className="group inline-flex items-center gap-1.5 text-ink-2 hover:text-ink">
            <span className="link-fil pb-0.5">Panier</span>
            {itemCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
      <nav className="flex gap-6 overflow-x-auto px-4 pb-3 text-sm md:hidden">{nav}</nav>
    </header>
  );
}
