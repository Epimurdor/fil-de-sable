// Coloris de fil (table ThreadColor) : forme envoyée au navigateur et libellés, utilisables côté client.

export type ThreadOption = {
  code: string;
  range: string;
  ref: string | null;
  name: string | null;
  shade: string;
  family: string;
  hex: string;
  note: string | null;
};

// Nom de l'option enregistrée dans selectedOptions quand le client choisit la couleur du fil d'un article.
export const THREAD_OPTION = "Couleur du fil";

export const THREAD_RANGES: Record<string, { label: string; short: string }> = {
  encerado: { label: "Encerado · polyester ciré", short: "ciré" },
  pe: { label: "PE · polyester à effet pailleté", short: "pailleté" },
  bonderizado: { label: "Bonderizado · polyamide", short: "polyamide" },
};

// « ciré n° 224 », « pailleté Salmão » : ce qui identifie la bobine sur l'étagère.
export function threadRef(t: Pick<ThreadOption, "range" | "ref" | "name">): string {
  const range = THREAD_RANGES[t.range]?.short ?? t.range;
  return `${range} ${t.ref ? `n° ${t.ref}` : t.name}`;
}

// « Turquoise · ciré n° 224 » : libellé gardé dans la configuration (panier, commande).
export function threadLabel(t: ThreadOption): string {
  return `${t.shade} · ${threadRef(t)}`;
}
