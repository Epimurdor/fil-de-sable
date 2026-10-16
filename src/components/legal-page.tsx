import type { ReactNode } from "react";
import { legal } from "@/config/site";

// Gabarit commun des pages légales : titre, bandeau « brouillon » et typographie du texte.
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-medium tracking-tight text-ink sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-ink-3">Dernière mise à jour : {legal.updatedAt}</p>
      <div className="mt-8 space-y-4 text-ink-2 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-ink [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_table]:w-full [&_table]:text-sm [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left [&_th]:align-top [&_th]:text-ink [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top [&_tr]:border-b [&_tr]:border-line">
        {children}
      </div>
    </div>
  );
}
