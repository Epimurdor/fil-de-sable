import Link from "next/link";
import { site } from "@/config/site";
import { getCurrentUser } from "@/lib/auth/session";
import { cartSummary, getCart } from "@/lib/cart/cart";

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
    <Link key={l.href} href={l.href} className="vine shrink-0 whitespace-nowrap text-ink-2 transition-colors hover:text-ink">
      {l.label}
    </Link>
  ));

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/75 backdrop-blur-md supports-[backdrop-filter]:bg-paper/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold uppercase tracking-[0.18em] text-ink">
          {site.name}
        </Link>
        <nav className="hidden items-center gap-7 text-sm md:flex">{nav}</nav>
        <div className="flex items-center gap-5 text-sm">
          <Link href={user ? (user.role === "admin" ? "/admin" : "/compte") : "/connexion"} className="vine text-ink-2 hover:text-ink">
            {user ? user.firstName : "Connexion"}
          </Link>
          <Link href="/panier" className="vine text-ink-2 hover:text-ink">
            Panier{itemCount > 0 ? ` (${itemCount})` : ""}
          </Link>
        </div>
      </div>
      <nav className="flex gap-6 overflow-x-auto px-4 pb-3 text-sm [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">{nav}</nav>
    </header>
  );
}
