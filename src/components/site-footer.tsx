import Link from "next/link";
import { site } from "@/config/site";
import { Fil } from "./fil";

const linkClass = "link-fil pb-0.5 text-paper/75 hover:text-paper";

export function SiteFooter() {
  return (
    <footer className="mt-28 bg-ink text-paper">
      <div className="overflow-hidden">
        <Fil width={1600} color="var(--color-accent)" second="var(--color-paper)" animate={false} className="-mt-2.5 opacity-90" />
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 text-sm sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-display text-2xl">{site.name}</p>
          <p className="mt-3 max-w-xs text-paper/70">Bijoux en micro-macramé, noués à la main sur commande. Fil ciré, perles et pierres.</p>
        </div>
        <ul className="space-y-2.5">
          <li><Link href="/boutique" className={linkClass}>Boutique</Link></li>
          <li><Link href="/configurateur" className={linkClass}>Bracelet sur mesure</Link></li>
          <li><Link href="/quiz" className={linkClass}>Trouver mon bijou</Link></li>
          <li><Link href="/atelier" className={linkClass}>L'atelier</Link></li>
          <li><Link href="/compte" className={linkClass}>Mon compte</Link></li>
        </ul>
        <ul className="space-y-2.5">
          <li><a href={`mailto:${site.email}`} className={linkClass}>{site.email}</a></li>
          <li>
            <a href={`https://instagram.com/${site.instagram}`} className={linkClass} rel="noreferrer" target="_blank">
              Instagram
            </a>
          </li>
          <li className="pt-4 text-paper/55">Livraison offerte dès 60 €. Lettre suivie, Mondial Relay ou Colissimo.</li>
        </ul>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-paper/45 sm:px-6">© {new Date().getFullYear()} {site.name}. Fait main en France.</p>
    </footer>
  );
}
