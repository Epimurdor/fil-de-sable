import type { Metadata } from "next";
import Image from "next/image";
import { Fil } from "@/components/fil";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "L'atelier" };

export default function AtelierPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid items-start gap-10 md:grid-cols-2 md:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-lift md:rotate-[-1.5deg]">
          <Image
            src="/images/produits/bracelet-atelier-2.jpg"
            alt="Bracelet en micro-macramé taupe et quartz rose"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="md:pt-6">
          <p className="text-sm font-medium text-accent-strong">L'atelier</p>
          <h1 className="mt-3 text-4xl text-ink sm:text-5xl">Un établi, des fils, et le temps qu'il faut.</h1>
          <Fil width={140} className="mt-5" />
          <div className="mt-6 space-y-4 text-ink-2">
            <p>
              {site.name}, c'est un petit atelier de micro-macramé. Des bracelets, des bagues et des colliers noués un par un,
              à la main, avec des perles choisies une par une aussi.
            </p>
            <p>
              Rien n'est en stock. Tu commandes, on noue, tu suis l'avancement depuis ton compte, et ça arrive dans ta boîte aux
              lettres quelques jours plus tard.
            </p>
            <p>
              Le fil est un coton ou un polyester ciré selon les modèles. Les perles sont en verre, en pierre ou en bois. Pas de
              métal qui noircit, rien qui gratte.
            </p>
            <p>Un nœud un peu plus serré ici, une boucle un peu plus ronde là. C'est la signature, pas un défaut.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/boutique">Voir la boutique</ButtonLink>
            {site.customEnabled && <ButtonLink href="/configurateur" variant="secondary">Composer un bracelet</ButtonLink>}
          </div>
          <p className="mt-10 border-t border-line pt-6 text-sm text-ink-2">
            Une question, un cadeau à préparer ? Écris à{" "}
            <a href={`mailto:${site.email}`} className="link-fil pb-0.5 text-accent-strong">{site.email}</a> ou sur{" "}
            <a href={`https://instagram.com/${site.instagram}`} className="link-fil pb-0.5 text-accent-strong" rel="noreferrer" target="_blank">
              Instagram
            </a>
            . On répond entre deux nœuds.
          </p>
        </div>
      </div>
    </div>
  );
}
