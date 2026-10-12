import Link from "next/link";
import { ShoppingBag, Sparkles, UserRound } from "lucide-react";
import { site } from "@/config/site";
import { getCurrentUser } from "@/lib/auth/session";
import { cartSummary, getCart } from "@/lib/cart/cart";

const links = [
  { href: "/boutique", label: "Boutique" },
  { href: "/configurateur", label: "Sur mesure", icon: true },
  { href: "/quiz", label: "Trouve ton bijou" },
  { href: "/atelier", label: "L'atelier" },
];

export async function SiteHeader() {
  const [user, cart] = await Promise.all([getCurrentUser(), getCart()]);
  const { itemCount } = cartSummary(cart);

  const nav = links.map((l) => (
    <Link
      key={l.href}
      href={l.href}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-bark-700 transition hover:text-terracotta-600"
    >
      {l.icon && <Sparkles className="h-4 w-4 text-terracotta-500" aria-hidden />}
      {l.label}
    </Link>
  ));

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200/70 bg-sand-50/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-2xl font-semibold tracking-tight text-bark-900">
          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-terracotta-500 align-middle" aria-hidden />
          {site.name}
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">{nav}</nav>

        <div className="flex items-center gap-1.5">
          <Link
            href={user ? (user.role === "admin" ? "/admin" : "/compte") : "/connexion"}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-bark-700 transition hover:bg-sand-100"
          >
            <UserRound className="h-5 w-5" aria-hidden />
            <span className="hidden sm:inline">{user ? user.firstName : "Connexion"}</span>
          </Link>
          <Link
            href="/panier"
            className="relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-bark-700 transition hover:bg-sand-100"
            aria-label={`Panier, ${itemCount} article${itemCount > 1 ? "s" : ""}`}
          >
            <ShoppingBag className="h-5 w-5" aria-hidden />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta-500 px-1 text-[11px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
      <nav className="flex gap-5 overflow-x-auto px-4 pb-2.5 text-sm font-semibold md:hidden">{nav}</nav>
    </header>
  );
}
