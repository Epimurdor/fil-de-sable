"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductCard, type ProductCardData } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { site } from "@/config/site";
import { cn } from "@/lib/cn";
import { parseColors } from "@/lib/types";

type Answer = { label: string; palette?: string[]; category?: string; bold?: boolean };

const questions: { title: string; answers: Answer[] }[] = [
  {
    title: "Ton ambiance, c'est plutôt",
    answers: [
      { label: "Bord de mer", palette: ["#4F6478", "#7E9BB0", "#F3EBDD", "#F2EFE6", "#E8D5B5"] },
      { label: "Terre et soleil", palette: ["#C96F4A", "#D9A441", "#6B4F3A", "#D8A49B"] },
      { label: "Sous-bois", palette: ["#8A9A7B", "#4F6B4E", "#F3EBDD"] },
      { label: "Nuit douce", palette: ["#2B2B2B", "#7A3B3B", "#5E4B4F", "#E8C4D0"] },
    ],
  },
  {
    title: "Tu le portes où ?",
    answers: [
      { label: "Au poignet", category: "bracelets" },
      { label: "Au doigt", category: "bagues" },
      { label: "Autour du cou", category: "colliers" },
      { label: "Peu importe" },
    ],
  },
  {
    title: "Et plutôt",
    answers: [
      { label: "Discret, un fil, une couleur", bold: false },
      { label: "Qu'on le remarque", bold: true },
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

  if (done) {
    const results = [...products]
      .map((p) => ({ p, s: score(p, picked) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .map((r) => r.p);
    return (
      <div>
        <h2 className="text-3xl text-ink">Ce qu'on te verrait bien porter</h2>
        <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
          {results.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-5">
          <Button type="button" variant="secondary" onClick={() => setPicked([])}>Recommencer</Button>
          {site.customEnabled && (
            <Link href="/configurateur" className="link-fil pb-0.5 text-sm text-ink-2 hover:text-ink">
              Ou compose-le à tes couleurs
            </Link>
          )}
        </div>
      </div>
    );
  }

  const q = questions[step];
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex gap-1.5" aria-hidden>
          {questions.map((_, i) => (
            <span key={i} className={cn("h-1.5 w-8 rounded-full transition-colors duration-300", i <= step ? "bg-accent" : "bg-line-2")} />
          ))}
        </span>
        <p className="text-sm text-accent-strong">Question {step + 1} sur {questions.length}</p>
      </div>
      <h2 className="mt-3 text-3xl text-ink sm:text-4xl">{q.title}</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {q.answers.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => setPicked((p) => [...p, a])}
            className={cn(
              "flex items-center justify-between gap-4 rounded-xl border border-line-2 bg-white px-5 py-4 text-left text-ink shadow-soft transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-accent-strong hover:shadow-lift",
            )}
          >
            <span className="font-medium">{a.label}</span>
            {a.palette && (
              <span className="flex gap-1">
                {a.palette.slice(0, 4).map((c) => (
                  <span key={c} className="h-4 w-4 rounded-full ring-1 ring-ink/10" style={{ backgroundColor: c }} />
                ))}
              </span>
            )}
          </button>
        ))}
      </div>
      {step > 0 && (
        <button type="button" onClick={() => setPicked((p) => p.slice(0, -1))} className="link-fil mt-6 pb-0.5 text-sm text-ink-2 hover:text-ink">
          Question précédente
        </button>
      )}
    </div>
  );
}
