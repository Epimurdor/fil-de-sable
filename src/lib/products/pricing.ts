import { parseOptionValues, type SelectedOptions } from "@/lib/types";
import type { ProductFull } from "./queries";

export type ResolvedOptions =
  | { ok: true; selected: SelectedOptions; labels: Record<string, string>; unitPriceCents: number }
  | { ok: false; error: string };

// Vérifie les options choisies contre celles du produit et calcule le prix unitaire.
export function resolveOptions(product: ProductFull, raw: SelectedOptions): ResolvedOptions {
  const selected: SelectedOptions = {};
  const labels: Record<string, string> = {};
  let unitPriceCents = product.priceCents;

  for (const option of product.options) {
    const values = parseOptionValues(option.values);
    const chosen = raw[option.name];
    if (!chosen) {
      if (option.required) return { ok: false, error: `Choisis une valeur pour « ${option.name} ».` };
      continue;
    }
    const match = values.find((v) => v.value === chosen);
    if (!match) return { ok: false, error: `Valeur inconnue pour « ${option.name} ».` };
    selected[option.name] = match.value;
    labels[option.name] = match.label;
    unitPriceCents += match.priceDeltaCents;
  }

  return { ok: true, selected, labels, unitPriceCents };
}

type WithOptions = { options: { name: string; values: string }[] } | null | undefined;

// Libellés lisibles des options d'une ligne (panier, commande).
export function optionLabels(product: WithOptions, selected: SelectedOptions): string[] {
  return Object.entries(selected).map(([name, value]) => {
    const option = product?.options.find((o) => o.name === name);
    const label = option ? parseOptionValues(option.values).find((v) => v.value === value)?.label : undefined;
    return `${name} : ${label ?? value}`;
  });
}
