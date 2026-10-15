// Types partagés pour les champs JSON stockés en String (portabilité SQLite / Postgres).

export type OptionValue = { value: string; label: string; priceDeltaCents: number };

export type SelectedOptions = Record<string, string>;

// Configuration issue du configurateur de bracelet.
export type CustomConfig = {
  threads: string[]; // 1 à 3 couleurs hex (aperçu)
  threadCodes?: string[]; // codes ThreadColor, même ordre (absents des anciennes configurations)
  threadLabels?: string[]; // « Turquoise · ciré n° 224 », figé par le serveur à l'ajout au panier
  bead: string; // code de perle (voir src/lib/configurator.ts)
  size: string; // S | M | L
  pattern: string; // code de motif
};

export type ProductKind = "bracelet" | "bague" | "collier";

function safeParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function parseColors(json: string | null | undefined): string[] {
  const v = safeParse<unknown>(json, []);
  return Array.isArray(v) ? v.filter((c): c is string => typeof c === "string") : [];
}

export function parseOptionValues(json: string | null | undefined): OptionValue[] {
  const v = safeParse<unknown>(json, []);
  if (!Array.isArray(v)) return [];
  return v
    .filter((o): o is OptionValue => !!o && typeof o === "object" && "value" in o && "label" in o)
    .map((o) => ({ value: String(o.value), label: String(o.label), priceDeltaCents: Number(o.priceDeltaCents ?? 0) }));
}

export function parseSelectedOptions(json: string | null | undefined): SelectedOptions {
  const v = safeParse<unknown>(json, {});
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, val]) => [k, String(val)]));
}

export function parseCustomConfig(json: string | null | undefined): CustomConfig | null {
  const v = safeParse<Partial<CustomConfig> | null>(json, null);
  if (!v || !Array.isArray(v.threads)) return null;
  const strings = (a: unknown) => (Array.isArray(a) ? a.filter((t): t is string => typeof t === "string") : undefined);
  return {
    threads: strings(v.threads)!,
    threadCodes: strings(v.threadCodes),
    threadLabels: strings(v.threadLabels),
    bead: String(v.bead ?? "aucune"),
    size: String(v.size ?? "M"),
    pattern: String(v.pattern ?? "vagues"),
  };
}

export function kindFromCategorySlug(slug: string): ProductKind {
  if (slug.startsWith("bague")) return "bague";
  if (slug.startsWith("collier")) return "collier";
  return "bracelet";
}
