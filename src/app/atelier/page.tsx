import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "L'atelier" };

export default function AtelierPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid items-start gap-10 md:grid-cols-2 md:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-md">
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
          <h1 className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">Un établi, des fils, et le temps qu'il faut.</h1>
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
              Le fil est un coton ou un polyester ciré selon les modèles, certifié résistant à l'eau et à l'usure. Les perles
              sont en acier inoxydable ou en laiton, et les perles naturelles en améthyste, œil de tigre et apatite.
            </p>
            <p>
              Tous les bracelets ont un nœud coulissant : tu ajustes la taille à ton poignet, sans fermoir.
            </p>
            <p>Un nœud un peu plus serré ici, une boucle un peu plus ronde là. C'est la signature, pas un défaut.</p>
          </div>
          <section className="mt-10 border-t border-line pt-8">
            <h2 className="text-xl font-medium tracking-tight text-ink">Qui je suis</h2>
            <div className="mt-4 space-y-4 text-ink-2">
              <p>
                Je m'appelle Nathalie, j'ai 55 ans. Depuis mes 16 ans, je suis assistante dentaire : près de quarante ans à
                travailler avec mes mains, au fauteuil, au plus près des patients.
              </p>
              <p>
                Ce métier m'a appris l'essentiel : la précision du geste, la propreté du poste de travail, l'organisation pour
                que rien ne manque au bon moment, et le contact avec les gens, savoir rassurer, écouter et expliquer
                simplement.
              </p>
              <p>
                Le micro-macramé, je l'ai appris seule, en autodidacte, nœud après nœud. Je retrouve à l'établi les mêmes
                exigences : des nœuds réguliers, un plan de travail net, des fils et des perles bien rangés. Et comme au
                cabinet, je tiens à rester proche de mes clients : je réponds à chaque message, je conseille sur les
                couleurs et les tailles, et je suis ta commande jusqu'à ta boîte aux lettres.
              </p>
            </div>
          </section>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/boutique">Voir la boutique</ButtonLink>
            <ButtonLink href="/configurateur" variant="secondary">Composer un bracelet</ButtonLink>
          </div>
          <p className="mt-10 border-t border-line pt-6 text-sm text-ink-2">
            Une question, un cadeau à préparer ? Écris à{" "}
            <a href={`mailto:${site.email}`} className="text-ink underline underline-offset-4">{site.email}</a> ou sur{" "}
            <a href={site.facebook} className="text-ink underline underline-offset-4" rel="noreferrer" target="_blank">
              Facebook
            </a>
            . On répond entre deux nœuds.
          </p>
        </div>
      </div>
    </div>
  );
}
