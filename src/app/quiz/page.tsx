import type { Metadata } from "next";
import { Quiz } from "@/components/quiz";
import { getProducts } from "@/lib/products/queries";

export const metadata: Metadata = {
  title: "Trouve ton bijou",
  description: "Trois questions pour trouver la pièce qui te ressemble.",
};

export default async function QuizPage() {
  const products = (await getProducts()).filter((p) => !p.isCustomizable);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-sage-700">Quiz</p>
      <h1 className="mt-1 font-display text-4xl font-semibold text-bark-900 sm:text-5xl">Trouve ton bijou</h1>
      <p className="mt-2 max-w-xl text-bark-500">Trois questions, pas une de plus. On te sort les pièces qui collent à ton ambiance.</p>
      <div className="mt-10">
        <Quiz
          products={products.map((p) => ({
            slug: p.slug,
            name: p.name,
            tagline: p.tagline,
            priceCents: p.priceCents,
            leadTimeDays: p.leadTimeDays,
            colors: p.colors,
            imageUrl: p.imageUrl,
            isCustomizable: p.isCustomizable,
            category: { slug: p.category.slug },
          }))}
        />
      </div>
    </div>
  );
}
