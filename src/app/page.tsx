import Image from "next/image";
import Link from "next/link";
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
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:pt-16">
        <h1 className="max-w-4xl text-4xl font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
          Bijoux en micro-macramé, noués à la main, sur commande.
        </h1>
        <p className="mt-5 max-w-md text-lg text-ink-2">
          Fil ciré, perles et pierres. Chaque pièce est nouée après ta commande, dans un petit atelier.
        </p>
        <ButtonLink href="/boutique" className="mt-7">Voir la boutique</ButtonLink>
      </section>

      {photos.length > 0 && (
        <section className="mt-12 grid gap-1 sm:grid-cols-2">
          {photos.map((p, i) => (
            <Link key={p.id} href={`/boutique/${p.slug}`} className="group block">
              <div className="relative aspect-[4/5] sm:aspect-[5/6]">
                <Image src={p.imageUrl!} alt={p.name} fill priority={i === 0} sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
              </div>
              <p className="px-4 py-3 text-sm sm:px-6">
                <span className="font-medium text-ink underline-offset-4 group-hover:underline">{p.name}</span>
                <span className="ml-3 text-ink-2">{formatPrice(p.priceCents)}</span>
              </p>
            </Link>
          ))}
        </section>
      )}

      {grid.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
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
          <h2 className="text-2xl font-medium tracking-tight text-ink sm:text-3xl">Rien n'est en stock. Tout est noué pour toi.</h2>
          <div className="mt-5 space-y-4 text-ink-2">
            <p>Tu choisis un modèle, ou tu composes ton bracelet fil par fil. Le délai de confection est indiqué sur chaque pièce.</p>
            <p>Dès que la commande est payée, elle entre dans la file de l'atelier. Tu suis chaque étape depuis ton compte, jusqu'à l'expédition.</p>
            <p>Ça arrive dans ta boîte aux lettres, en lettre suivie, en point relais ou à domicile. Offert dès 60 €.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2">
        <Link href="/configurateur" className="group flex min-h-64 flex-col justify-between rounded-md bg-accent p-8 text-paper">
          <div>
            <h3 className="text-2xl font-medium tracking-tight">Compose ton bracelet</h3>
            <p className="mt-3 max-w-sm text-paper/85">Trois fils, une perle, un motif, ta taille. L'aperçu se dessine pendant que tu choisis.</p>
          </div>
          <span className="mt-6 text-sm underline-offset-4 group-hover:underline">Ouvrir le configurateur</span>
        </Link>
        <Link href="/quiz" className="group flex min-h-64 flex-col justify-between rounded-md bg-paper-2 p-8 text-ink">
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
