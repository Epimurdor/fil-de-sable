import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ProductVisual } from "@/components/product-visual";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { getCategories, getFeaturedProducts } from "@/lib/products/queries";

const marquee = [
  "Noué à la main",
  "Fait sur commande",
  "Fil de coton ciré",
  "Perles & pierres",
  "Sans métal",
  "Expédié en lettre suivie",
];

const steps = [
  { n: "01", title: "Tu choisis", text: "Un modèle de la boutique, ou ton propre bracelet composé fil par fil dans le configurateur." },
  { n: "02", title: "On noue", text: "Ta pièce est nouée après ta commande, dans le délai affiché. Tu suis chaque étape depuis ton compte." },
  { n: "03", title: "Ça arrive", text: "Dans ta boîte aux lettres, en lettre suivie ou en point relais. Offert dès 60 € d'achat." },
];

export default async function HomePage() {
  const [featured, categories] = await Promise.all([getFeaturedProducts(4), getCategories()]);
  const hero = featured.find((p) => p.imageUrl) ?? featured[0];
  const second = featured.find((p) => p.imageUrl && p.slug !== hero?.slug);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-16">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sage-700">
            Petit atelier, grandes attentions
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[1.02] text-bark-900 sm:text-6xl lg:text-7xl">
            Des bijoux noués <em className="font-normal italic text-terracotta-600">à la main,</em> à ton rythme.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-bark-700">
            Micro-macramé en fil ciré, perles et pierres fines. Chaque pièce est nouée après ta commande, rien ne dort
            dans un tiroir.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/boutique">
              Voir la boutique <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
            <ButtonLink href="/configurateur" variant="secondary">
              <Sparkles className="h-4 w-4 text-terracotta-500" aria-hidden /> Composer mon bracelet
            </ButtonLink>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md md:max-w-none">
          {hero?.imageUrl ? (
            <div className="blob-a relative aspect-[4/5] overflow-hidden shadow-soft">
              <Image src={hero.imageUrl} alt={hero.name} fill priority sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
            </div>
          ) : (
            <div className="blob-a aspect-[4/5] overflow-hidden shadow-soft">
              <ProductVisual colors={["#4F6478", "#F2EFE6"]} alt="Bracelet en macramé" beadHex="#F2EFE6" className="h-full" />
            </div>
          )}
          {hero && (
            <Link
              href={`/boutique/${hero.slug}`}
              className="absolute -bottom-4 left-4 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-soft backdrop-blur transition hover:-translate-y-0.5"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-terracotta-500" aria-hidden />
              <span className="text-sm font-semibold text-bark-900">{hero.name}</span>
              <span className="text-sm text-bark-500">{formatPrice(hero.priceCents)}</span>
            </Link>
          )}
          <div className="absolute -right-3 -top-3 hidden h-24 w-24 items-center justify-center rounded-full bg-ocre-400 text-center font-display text-sm font-semibold leading-tight text-bark-900 shadow-soft sm:flex">
            noué<br />sur<br />commande
          </div>
        </div>
      </section>

      {/* Bandeau */}
      <div className="overflow-hidden border-y border-sand-200 bg-sand-100/70 py-3">
        <div className="marquee-track flex w-max gap-10 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.2em] text-bark-700">
          {[...marquee, ...marquee].map((m, i) => (
            <span key={i} className="inline-flex items-center gap-10">
              {m} <span className="h-1.5 w-1.5 rounded-full bg-terracotta-500" aria-hidden />
            </span>
          ))}
        </div>
      </div>

      {/* Sélection */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold text-bark-900 sm:text-4xl">Les pièces du moment</h2>
            <p className="mt-2 text-bark-500">Nouées cette semaine, prêtes à partir dans la tienne.</p>
          </div>
          <Link href="/boutique" className="hidden text-sm font-semibold text-terracotta-600 hover:underline sm:inline">
            Toute la boutique →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 2} />
          ))}
        </div>
      </section>

      {/* Catégories */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              href={`/boutique?categorie=${c.slug}`}
              className={`grain group relative overflow-hidden rounded-3xl p-7 transition hover:-translate-y-1 ${
                i === 0 ? "bg-terracotta-500 text-white" : i === 1 ? "bg-sage-500 text-white" : "bg-bark-800 text-sand-50"
              }`}
            >
              <p className="font-display text-3xl font-semibold">{c.name}</p>
              <p className="mt-2 text-sm opacity-90">{c.description}</p>
              <ArrowRight className="mt-6 h-5 w-5 transition group-hover:translate-x-1" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-bark-900 sm:text-4xl">Comment ça marche</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-3xl border border-sand-200 bg-white/60 p-7">
              <p className="font-display text-5xl font-semibold text-terracotta-500/70">{s.n}</p>
              <p className="mt-4 font-display text-xl font-semibold text-bark-900">{s.title}</p>
              <p className="mt-2 text-bark-700">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sur mesure + quiz */}
      <section className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 md:grid-cols-2">
        <div className="grain relative overflow-hidden rounded-3xl bg-bark-900 p-8 text-sand-50 md:p-10">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ocre-400">
              <Sparkles className="h-4 w-4" aria-hidden /> Configurateur
            </p>
            <h3 className="mt-3 font-display text-3xl font-semibold">Compose ton bracelet, fil par fil.</h3>
            <p className="mt-3 max-w-sm text-sand-200">
              Trois couleurs de fil, une perle, un motif, ta taille. L'aperçu se dessine en direct, on noue le reste.
            </p>
            <ButtonLink href="/configurateur" variant="primary" className="mt-6">
              Je compose le mien
            </ButtonLink>
          </div>
          <div className="pointer-events-none absolute -bottom-10 -right-10 w-64 opacity-90 md:w-72">
            <ProductVisual colors={["#C96F4A", "#8A9A7B", "#E8D5B5"]} beadHex="#F2EFE6" pattern="arabesques" alt="" className="blob-b aspect-square" />
          </div>
        </div>
        <div className="grain relative overflow-hidden rounded-3xl bg-sage-100 p-8 md:p-10">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sage-700">
            <Compass className="h-4 w-4" aria-hidden /> Quiz
          </p>
          <h3 className="mt-3 font-display text-3xl font-semibold text-bark-900">Tu ne sais pas par où commencer ?</h3>
          <p className="mt-3 max-w-sm text-bark-700">
            Trois questions sur ton ambiance, tes couleurs et l'occasion. On te sort les pièces qui te ressemblent.
          </p>
          <ButtonLink href="/quiz" variant="dark" className="mt-6">
            Trouver mon bijou
          </ButtonLink>
        </div>
      </section>

      {/* Bandeau photo */}
      {second?.imageUrl && (
        <section className="mx-auto mt-24 grid max-w-6xl items-center gap-10 px-4 sm:px-6 md:grid-cols-2">
          <div className="blob-b relative aspect-square overflow-hidden shadow-soft">
            <Image src={second.imageUrl} alt={second.name} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
          </div>
          <div>
            <p className="font-display text-3xl font-semibold leading-snug text-bark-900 sm:text-4xl">
              « Un bijou qu'on noue pour quelqu'un, ça se sent au poignet. »
            </p>
            <p className="mt-4 text-bark-700">
              Pas de stock, pas de série. Juste des fils, des perles, et le temps qu'il faut pour que ce soit bien fait.
            </p>
            <Link href="/atelier" className="mt-6 inline-block text-sm font-semibold text-terracotta-600 hover:underline">
              Découvrir l'atelier →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
