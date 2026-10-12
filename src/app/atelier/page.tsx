import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "L'atelier" };

const values = [
  { title: "Sur commande, jamais en stock", text: "Chaque pièce est nouée après ton paiement. Zéro invendu, zéro gaspillage, et un bijou qui n'a attendu personne d'autre." },
  { title: "Du fil, des perles, pas de métal", text: "Coton ciré ou polyester ciré selon les modèles, perles de verre, pierres fines et bois. Rien qui noircit, rien qui gratte." },
  { title: "Ça se voit que c'est fait main", text: "Un nœud un peu plus serré ici, une boucle un peu plus ronde là. C'est la signature, pas un défaut." },
];

export default function AtelierPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-sage-700">L'atelier</p>
          <h1 className="mt-1 font-display text-4xl font-semibold text-bark-900 sm:text-5xl">Un établi, des fils, et le temps qu'il faut.</h1>
          <p className="mt-5 text-lg text-bark-700">
            {site.name}, c'est un petit atelier de micro-macramé. Des bracelets, des bagues et des colliers noués un par un,
            à la main, avec des perles choisies une par une aussi.
          </p>
          <p className="mt-4 text-bark-700">
            Pas de machine, pas de série. Tu commandes, on noue, tu suis l'avancement depuis ton compte, et ça arrive dans ta
            boîte aux lettres quelques jours plus tard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/boutique">Voir les pièces</ButtonLink>
            <ButtonLink href="/configurateur" variant="secondary">Composer un bracelet</ButtonLink>
          </div>
        </div>
        <div className="blob-b relative aspect-[4/5] overflow-hidden shadow-soft">
          <Image src="/images/produits/bracelet-atelier-2.jpg" alt="Bracelet en micro-macramé taupe et quartz rose" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" priority />
        </div>
      </div>

      <section className="mt-24 grid gap-6 md:grid-cols-3">
        {values.map((v) => (
          <div key={v.title} className="rounded-3xl border border-sand-200 bg-white/60 p-7">
            <h2 className="font-display text-xl font-semibold text-bark-900">{v.title}</h2>
            <p className="mt-3 text-bark-700">{v.text}</p>
          </div>
        ))}
      </section>

      <section className="grain mt-24 rounded-3xl bg-bark-900 p-8 text-sand-50 md:p-12">
        <h2 className="font-display text-3xl font-semibold">Une question, une idée, un cadeau à préparer ?</h2>
        <p className="mt-3 max-w-xl text-sand-200">
          Écris à <a href={`mailto:${site.email}`} className="font-semibold text-ocre-400 hover:underline">{site.email}</a> ou
          passe par Instagram, <a href={`https://instagram.com/${site.instagram}`} className="font-semibold text-ocre-400 hover:underline" rel="noreferrer" target="_blank">@{site.instagram}</a>.
          On répond vite, entre deux nœuds.
        </p>
      </section>
    </div>
  );
}
