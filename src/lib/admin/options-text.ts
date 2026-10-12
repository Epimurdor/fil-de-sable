// Format texte des options produit pour l'admin, une option par ligne :
//   Taille de poignet: S=S · 14 à 15 cm, M=M · 15 à 17 cm, L=L · 17 à 19 cm
//   Perle: aucune=Sans perle, bois=Perle en bois (+2), lave=Pierre de lave (+4,50)
import { parseOptionValues, type OptionValue } from "@/lib/types";

export type ParsedOption = { name: string; values: OptionValue[] };

const deltaRegex = /\(\s*\+\s*(\d+(?:[.,]\d{1,2})?)\s*\)\s*$/;

export function parseOptionsText(text: string): { ok: true; options: ParsedOption[] } | { ok: false; error: string } {
  const options: ParsedOption[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const sep = line.indexOf(":");
    if (sep <= 0) return { ok: false, error: `Ligne sans « : » : « ${line} »` };
    const name = line.slice(0, sep).trim();
    const values: OptionValue[] = [];
    for (const part of line.slice(sep + 1).split(",")) {
      const chunk = part.trim();
      if (!chunk) continue;
      const eq = chunk.indexOf("=");
      const value = (eq > 0 ? chunk.slice(0, eq) : chunk).trim();
      let label = (eq > 0 ? chunk.slice(eq + 1) : chunk).trim();
      let priceDeltaCents = 0;
      const m = label.match(deltaRegex);
      if (m) {
        priceDeltaCents = Math.round(parseFloat(m[1].replace(",", ".")) * 100);
        label = label.replace(deltaRegex, "").trim();
      }
      if (!value) return { ok: false, error: `Valeur vide dans « ${line} »` };
      values.push({ value, label: label || value, priceDeltaCents });
    }
    if (values.length === 0) return { ok: false, error: `Aucune valeur pour « ${name} »` };
    options.push({ name, values });
  }
  return { ok: true, options };
}

export function formatOptionsText(options: { name: string; values: string }[]): string {
  return options
    .map((o) => {
      const values = parseOptionValues(o.values).map((v) => {
        const delta = v.priceDeltaCents ? ` (+${(v.priceDeltaCents / 100).toFixed(2).replace(".", ",")})` : "";
        return `${v.value}=${v.label}${delta}`;
      });
      return `${o.name}: ${values.join(", ")}`;
    })
    .join("\n");
}
