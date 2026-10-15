import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { Thread } from "@/components/thread";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { isLocalImagePath } from "@/lib/images";
import { getFeaturedProducts } from "@/lib/products/queries";

export default async function HomePage() {
  const featured = await getFeaturedProducts(8);
  const photos = featured.filter((p) => isLocalImagePath(p.imageUrl)).slice(0, 2);
  const grid = featured.filter((p) => !photos.includes(p)).slice(0, 4);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:pt-16">
        <h1 className="max-w-4xl text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
          Bijoux en micro-macramé, noués à la main, sur commande.
        </h1>
        <p className="mt-5 max-w-md text-lg text-ink-2">
          Fil ciré, perles et pierres. Chaque pièce est nouée après ta commande, dans un petit atelier.
          Tissé uniquement avec du fil de qualité premium, certifié résistant à l'eau et à l'usure.
          Tous les bracelets ont un nœud coulissant pour s'adapter à ton poignet.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
          <ButtonLink href="/boutique">Voir la boutique</ButtonLink>
          {/* Annotation au crayon : rien n'est en stock, tout est noué après la commande. */}
          <p className="flex items-center gap-2 font-hand text-2xl leading-none text-accent">
            <svg viewBox="0 0 40 20" aria-hidden="true" className="h-4 w-8 shrink-0 rotate-45 sm:rotate-0">
              <path d="M38 14 C 28 17, 14 14, 4 7 M4 7 l 7 -1 M4 7 l 2 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            ta pièce n'existe pas encore
          </p>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="mx-auto mt-12 grid max-w-6xl gap-3 px-4 sm:grid-cols-2 sm:px-6">
          {photos.map((p, i) => (
            <Link key={p.id} href={`/boutique/${p.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg shadow-[0_18px_40px_-24px_rgb(87_65_38/0.45)] sm:aspect-[5/6]">
                <Image src={p.imageUrl!} alt={p.name} fill priority={i === 0} sizes="(min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]" />
              </div>
              <p className="px-1 py-3 text-sm">
                <span className="font-medium text-ink underline-offset-4 group-hover:underline">{p.name}</span>
                <span className="ml-3 text-ink-2">{formatPrice(p.priceCents)}</span>
              </p>
            </Link>
          ))}
        </section>
      )}

      {grid.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <Thread className="mb-12" />
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-medium tracking-tight text-ink">Les pièces</h2>
            <Link href="/boutique" className="text-sm text-ink-2 underline-offset-4 hover:underline">Toute la boutique</Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {grid.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-hand text-2xl leading-none text-accent">comment ça marche</p>
          <h2 className="mt-2 text-2xl font-medium tracking-tight text-ink sm:text-3xl">Rien n'est en stock. Tout est noué pour toi.</h2>
          <div className="mt-5 space-y-4 text-ink-2">
            <p>Tu choisis un modèle, ou tu composes ton bracelet fil par fil. Le délai de confection est indiqué sur chaque pièce.</p>
            <p>Dès que la commande est payée, elle entre dans la file de l'atelier. Tu suis chaque étape depuis ton compte, jusqu'à l'expédition.</p>
            <p>Ça arrive dans ta boîte aux lettres, en lettre suivie, en point relais ou à domicile. Offert dès 60 €.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2">
        <Link href="/configurateur" className="group flex min-h-64 flex-col justify-between rounded-lg bg-accent p-8 text-paper shadow-[0_18px_40px_-24px_rgb(52_71_90/0.6)] transition-transform hover:-translate-y-0.5">
          <div>
            <h3 className="text-2xl font-medium tracking-tight">Compose ton bracelet</h3>
            <p className="mt-3 max-w-sm text-paper/85">Trois fils, une perle, un motif, ta taille. L'aperçu se dessine pendant que tu choisis.</p>
          </div>
          <span className="mt-6 text-sm underline-offset-4 group-hover:underline">Ouvrir le configurateur</span>
        </Link>
        <Link href="/quiz" className="group flex min-h-64 flex-col justify-between rounded-lg border border-line bg-gradient-to-br from-sand/70 to-paper-2 p-8 text-ink shadow-[0_18px_40px_-24px_rgb(87_65_38/0.4)] transition-transform hover:-translate-y-0.5">
          <div>
            <h3 className="text-2xl font-medium tracking-tight">Tu hésites ?</h3>
            <p className="mt-3 max-w-sm text-ink-2">Trois questions sur ton ambiance et tes couleurs. On te montre les pièces qui te ressemblent.</p>
          </div>
          <span className="mt-6 text-sm underline-offset-4 group-hover:underline">Faire le test</span>
        </Link>
      </section>
    </div>
  );
}
