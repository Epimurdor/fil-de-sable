import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Fil } from "@/components/fil";
import { ProductCard } from "@/components/product-card";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { getFeaturedProducts } from "@/lib/products/queries";

export default async function HomePage() {
  const featured = await getFeaturedProducts(8);
  const photos = featured.filter((p) => p.imageUrl).slice(0, 2);
  const grid = featured.filter((p) => !photos.includes(p)).slice(0, 4);

  return (
    <div>
      {/* Un ciel de sable derrière le titre : deux halos, terre cuite et ardoise, qui se fondent dans le papier. */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-40 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-accent-soft blur-3xl" />
          <div className="absolute -left-32 top-24 h-[26rem] w-[26rem] rounded-full bg-slate-soft blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-64 w-[60rem] -translate-x-1/2 rounded-[100%] bg-sand/60 blur-3xl" />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6 lg:pt-20">
          <p className="animate-rise text-sm font-medium text-accent-strong">Micro-macramé, noué à la main</p>
          <h1 className="mt-4 max-w-4xl animate-rise text-[2.6rem] leading-[1.05] text-ink [animation-delay:80ms] sm:text-6xl lg:text-[4.25rem]">
            Des bijoux qui prennent <span className="text-accent">le temps</span> d&apos;être noués pour toi.
          </h1>
          <Fil width={200} className="mt-6" />
          <p className="mt-6 max-w-md animate-rise text-lg text-ink-2 [animation-delay:160ms]">
            Fil ciré, perles et pierres. Chaque pièce est nouée après ta commande, dans un petit atelier.
          </p>
          <div className="mt-8 flex animate-rise flex-wrap gap-3 [animation-delay:240ms]">
            <ButtonLink href="/boutique">
              Voir la boutique <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/configurateur" variant="secondary">Composer un bracelet</ButtonLink>
          </div>
        </div>
      </section>

      {photos.length > 0 && (
        <section className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2 sm:px-6">
          {photos.map((p, i) => (
            <Link key={p.id} href={`/boutique/${p.slug}`} className="group reveal block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-soft transition-shadow duration-300 group-hover:shadow-lift sm:aspect-[5/6]">
                <Image
                  src={p.imageUrl!}
                  alt={p.name}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/60 to-transparent px-5 pb-4 pt-16 text-paper">
                  <span className="font-display text-xl">{p.name}</span>
                  <span className="ml-3 text-sm text-paper/85">{formatPrice(p.priceCents)}</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}

      {grid.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl text-ink sm:text-4xl">Les pièces</h2>
              <Fil width={96} className="mt-3" />
            </div>
            <Link href="/boutique" className="link-fil pb-0.5 text-sm text-ink-2 hover:text-ink">Toute la boutique</Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {grid.map((p, i) => (
              <div key={p.id} className="reveal" style={{ animationDelay: `${i * 60}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="relative mt-28 overflow-hidden bg-paper-2">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-rose/70 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-accent-soft blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div className="reveal">
            <h2 className="text-3xl text-ink sm:text-4xl">Rien n&apos;est en stock. Tout est noué pour toi.</h2>
            <Fil width={120} className="mt-4" />
          </div>
          <ol className="reveal space-y-6 text-ink-2">
            {[
              ["Tu choisis", "Un modèle de la boutique, ou ton bracelet composé fil par fil. Le délai est indiqué sur chaque pièce."],
              ["On noue", "Dès que la commande est payée, elle entre dans la file de l'atelier. Tu suis chaque étape depuis ton compte."],
              ["Ça arrive", "Dans ta boîte aux lettres, en lettre suivie, en point relais ou à domicile. Offert dès 60 €."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm text-white shadow-soft">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-ink">{t}</p>
                  <p className="mt-1">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto mt-24 grid max-w-6xl gap-5 px-4 sm:px-6 md:grid-cols-2">
        <Link
          href="/configurateur"
          className="group reveal relative flex min-h-72 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-accent-strong p-8 text-white shadow-soft transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-lift"
        >
          <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-150" />
          <div className="relative">
            <h3 className="font-display text-3xl">Compose ton bracelet</h3>
            <p className="mt-3 max-w-sm text-white/85">Trois fils, une perle, un motif, ta taille. L&apos;aperçu se dessine pendant que tu choisis.</p>
          </div>
          <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-medium">
            Ouvrir le configurateur <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
        <Link
          href="/quiz"
          className="group reveal relative flex min-h-72 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-slate to-[#34475a] p-8 text-white shadow-soft transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-lift [animation-delay:80ms]"
        >
          <div aria-hidden className="absolute -bottom-20 -right-10 h-56 w-56 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-150" />
          <div className="relative">
            <h3 className="font-display text-3xl">Tu hésites ?</h3>
            <p className="mt-3 max-w-sm text-white/85">Trois questions sur ton ambiance et tes couleurs. On te montre les pièces qui te ressemblent.</p>
          </div>
          <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-medium">
            Faire le test <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </section>
    </div>
  );
}
