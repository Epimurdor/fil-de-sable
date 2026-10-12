import Link from "next/link";
import { site } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-sand-200 bg-sand-100/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl font-semibold text-bark-900">{site.name}</p>
          <p className="mt-2 max-w-sm text-sm text-bark-700">{site.description}</p>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-bark-900">Par ici</p>
          <ul className="space-y-2 text-bark-700">
            <li><Link href="/boutique" className="hover:text-terracotta-600">Boutique</Link></li>
            <li><Link href="/configurateur" className="hover:text-terracotta-600">Bracelet sur mesure</Link></li>
            <li><Link href="/quiz" className="hover:text-terracotta-600">Trouve ton bijou</Link></li>
            <li><Link href="/atelier" className="hover:text-terracotta-600">L'atelier</Link></li>
            <li><Link href="/compte" className="hover:text-terracotta-600">Mon compte</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-3 font-semibold text-bark-900">On papote ?</p>
          <ul className="space-y-2 text-bark-700">
            <li><a href={`mailto:${site.email}`} className="hover:text-terracotta-600">{site.email}</a></li>
            <li>
              <a href={`https://instagram.com/${site.instagram}`} className="hover:text-terracotta-600" rel="noreferrer" target="_blank">
                @{site.instagram}
              </a>
            </li>
          </ul>
          <p className="mt-6 text-xs text-bark-500">Chaque pièce est nouée après ta commande. Pas de stock, pas de gaspillage.</p>
        </div>
      </div>
      <div className="border-t border-sand-200/80 py-4 text-center text-xs text-bark-500">
        © {new Date().getFullYear()} {site.name}. Fait main, en France.
      </div>
    </footer>
  );
}
