"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { parseColors } from "@/lib/types";

type Answer = { label: string; emoji: string; palette?: string[]; category?: string; bold?: boolean };

const questions: { title: string; answers: Answer[] }[] = [
  {
    title: "Ton ambiance, c'est plutôt…",
    answers: [
      { label: "Bord de mer", emoji: "🌊", palette: ["#4F6478", "#7E9BB0", "#F3EBDD", "#F2EFE6", "#E8D5B5"] },
      { label: "Terre et soleil", emoji: "🌅", palette: ["#C96F4A", "#D9A441", "#6B4F3A", "#D8A49B"] },
      { label: "Sous-bois", emoji: "🌿", palette: ["#8A9A7B", "#4F6B4E", "#F3EBDD"] },
      { label: "Nuit douce", emoji: "🌙", palette: ["#2B2B2B", "#7A3B3B", "#5E4B4F", "#E8C4D0"] },
    ],
  },
  {
    title: "Tu le portes où ?",
    answers: [
      { label: "Au poignet", emoji: "✋", category: "bracelets" },
      { label: "Au doigt", emoji: "💍", category: "bagues" },
      { label: "Autour du cou", emoji: "✨", category: "colliers" },
      { label: "Surprends-moi", emoji: "🎲" },
    ],
  },
  {
    title: "Et plutôt…",
    answers: [
      { label: "Discret, un fil, une couleur", emoji: "🤫", bold: false },
      { label: "Qu'on le remarque", emoji: "🔥", bold: true },
    ],
  },
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function close(a: string, b: string): boolean {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2) < 90;
}

function score(product: ProductCardData, answers: Answer[]): number {
  const colors = parseColors(product.colors);
  let s = 0;
  for (const a of answers) {
    if (a.palette) s += colors.filter((c) => a.palette!.some((p) => close(c, p))).length * 2;
    if (a.category) s += product.category.slug === a.category ? 4 : 0;
    if (a.bold != null) s += a.bold ? Math.min(colors.length, 3) - 1 : 3 - Math.min(colors.length, 3);
  }
  return s;
}

export function Quiz({ products }: { products: ProductCardData[] }) {
  const [picked, setPicked] = useState<Answer[]>([]);
  const step = picked.length;
  const done = step >= questions.length;

  const results = done
    ? [...products].map((p) => ({ p, s: score(p, picked) })).sort((a, b) => b.s - a.s).slice(0, 3).map((r) => r.p)
    : [];

  if (done) {
    return (
      <div>
        <h2 className="font-display text-2xl font-semibold text-bark-900">
          {picked[0]?.emoji} {picked[1]?.emoji} {picked[2]?.emoji} Voilà ce qu'on te verrait bien porter
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
          {results.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button type="button" variant="secondary" onClick={() => setPicked([])}>Recommencer</Button>
          <Link href="/configurateur" className="text-sm font-semibold text-terracotta-600 hover:underline">
            Ou compose-le à tes couleurs →
          </Link>
        </div>
      </div>
    );
  }

  const q = questions[step];
  return (
    <div>
      <div className="flex gap-1.5">
        {questions.map((_, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-terracotta-500" : "bg-sand-200")} />
        ))}
      </div>
      <p className="mt-6 text-sm text-bark-500">Question {step + 1} sur {questions.length}</p>
      <h2 className="mt-1 font-display text-3xl font-semibold text-bark-900">{q.title}</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {q.answers.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => setPicked((p) => [...p, a])}
            className="flex items-center gap-4 rounded-3xl border border-sand-300 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-bark-900"
          >
            <span className="text-3xl" aria-hidden>{a.emoji}</span>
            <span className="font-semibold text-bark-900">{a.label}</span>
            {a.palette && (
              <span className="ml-auto flex gap-1">
                {a.palette.slice(0, 4).map((c) => <span key={c} className="h-4 w-4 rounded-full ring-1 ring-bark-800/10" style={{ backgroundColor: c }} />)}
              </span>
            )}
          </button>
        ))}
      </div>
      {step > 0 && (
        <button type="button" onClick={() => setPicked((p) => p.slice(0, -1))} className="mt-6 text-sm text-bark-500 hover:text-bark-900">
          ← Question précédente
        </button>
      )}
    </div>
  );
}
