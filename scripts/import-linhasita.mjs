// Génère la migration Prisma qui crée la table ThreadColor et y insère les coloris
// Linhasita décrits dans LINHASITA_COULEURS.md (sections 1 et 2).
//
//   node scripts/import-linhasita.mjs <dossier-de-migration>
//
// Le stock (inStock) démarre à false : l'atelier coche ses bobines dans /admin/fils.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outDir = process.argv[2];
if (!outDir) {
  console.error("Usage : node scripts/import-linhasita.mjs <dossier-de-migration>");
  process.exit(1);
}

const md = fs.readFileSync(path.join(root, "LINHASITA_COULEURS.md"), "utf8");

const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const rows = [];
let section = 0;
let family = "";
for (const line of md.split(/\r?\n/)) {
  const h2 = line.match(/^## (\d)\./);
  if (h2) {
    section = Number(h2[1]);
    continue;
  }
  if (section !== 1 && section !== 2) continue;
  const h3 = line.match(/^### (.+?) \(\d+\)/);
  if (h3) {
    family = h3[1];
    continue;
  }
  if (!line.startsWith("|") || line.startsWith("|---") || line.startsWith("| Réf.")) continue;

  const cells = line.split("|").slice(1, -1).map((c) => c.trim());
  const [ref, name, shade, hexCell] = cells;
  const cartelle = section === 1 ? cells[4] : "Bonderizado";
  const note = (section === 1 ? cells[5] : cells[4]) || null;
  const hex = hexCell.replace(/`/g, "").toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(hex)) throw new Error(`HEX invalide : ${line}`);

  const range = section === 2 ? "bonderizado" : cartelle === "PE" ? "pe" : "encerado";
  const refValue = ref === "—" ? null : ref;
  const nameValue = name === "—" ? null : name;
  if (!refValue && !nameValue) throw new Error(`Ni référence ni nom : ${line}`);
  rows.push({
    code: `${range}-${slug(refValue ?? nameValue)}`,
    range,
    ref: refValue,
    name: nameValue,
    shade,
    family,
    hex,
    note: note && note.replace(/^Fil à effet pailleté ; Uniquement sur la cartelle PE$/, "Fil à effet pailleté"),
  });
}

const codes = new Set();
for (const r of rows) {
  if (codes.has(r.code)) throw new Error(`Code en double : ${r.code}`);
  codes.add(r.code);
}
const count = (range) => rows.filter((r) => r.range === range).length;
console.log(`${rows.length} coloris : ${count("encerado")} encerado, ${count("pe")} PE, ${count("bonderizado")} bonderizado`);

const sql = (v) => (v === null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const values = rows
  .map((r, i) =>
    `(${[r.code, r.range, r.ref, r.name, r.shade, r.family, r.hex, r.note].map(sql).join(", ")}, false, ${i})`,
  )
  .join(",\n");

const migration = `-- CreateTable
CREATE TABLE "ThreadColor" (
    "code" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "ref" TEXT,
    "name" TEXT,
    "shade" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "note" TEXT,
    "inStock" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ThreadColor_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "ThreadColor_inStock_idx" ON "ThreadColor"("inStock");

-- Coloris Linhasita (généré par scripts/import-linhasita.mjs depuis LINHASITA_COULEURS.md)
INSERT INTO "ThreadColor" ("code", "range", "ref", "name", "shade", "family", "hex", "note", "inStock", "sortOrder") VALUES
${values};
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "migration.sql"), migration);
console.log(`Écrit : ${path.join(outDir, "migration.sql")}`);
