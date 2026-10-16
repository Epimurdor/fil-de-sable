import Link from "next/link";
import { site } from "@/config/site";
import { Thread } from "./thread";

export function SiteFooter() {
  return (
    <footer className="mt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Thread />
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 text-sm sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-semibold uppercase tracking-[0.18em] text-ink">{site.name}</p>
          <p className="mt-3 max-w-xs text-ink-2">Bijoux en micro-macramé, noués à la main sur commande. Fil ciré, perles et pierres.</p>
          <p className="mt-4 font-hand text-xl leading-none text-accent">un nœud après l'autre</p>
        </div>
        <ul className="space-y-2 text-ink-2">
          <li><Link href="/boutique" className="hover:text-ink">Boutique</Link></li>
          <li><Link href="/configurateur" className="hover:text-ink">Bracelet sur mesure</Link></li>
          <li><Link href="/quiz" className="hover:text-ink">Trouver mon bijou</Link></li>
          <li><Link href="/atelier" className="hover:text-ink">L'atelier</Link></li>
          <li><Link href="/compte" className="hover:text-ink">Mon compte</Link></li>
        </ul>
        <ul className="space-y-2 text-ink-2">
          <li><a href={`mailto:${site.email}`} className="hover:text-ink">{site.email}</a></li>
          <li>
            <a href={site.facebook} className="hover:text-ink" rel="noreferrer" target="_blank">
              Facebook
            </a>
          </li>
          <li className="pt-4 text-ink-3">Livraison offerte dès 60 €. Lettre suivie, Mondial Relay ou Colissimo.</li>
        </ul>
      </div>
      <nav aria-label="Informations légales" className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-1 px-4 pb-3 text-xs text-ink-3 sm:px-6">
        <Link href="/mentions-legales" className="hover:text-ink">Mentions légales</Link>
        <Link href="/cgv" className="hover:text-ink">CGV</Link>
        <Link href="/retractation" className="hover:text-ink">Rétractation</Link>
        <Link href="/confidentialite" className="hover:text-ink">Confidentialité et cookies</Link>
      </nav>
      <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-ink-3 sm:px-6">© {new Date().getFullYear()} {site.name}. Fait main en Alsace par Nathalie</p>
    </footer>
  );
}
