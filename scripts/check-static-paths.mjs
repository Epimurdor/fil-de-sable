// Garde-fou de build pour l'hébergement Wasmer (next-bundle) : ses routes d'erreur "/404/?" et "/500"
// s'appliquent sans ancrage, à tout chemin qui contient "/404" ou "/500". Un fichier statique dont l'URL
// contient ce motif serait servi en erreur et casserait le site. On fait donc échouer le build.
import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const roots = [
  { dir: ".next/static", prefix: "/_next/static" },
  { dir: "public", prefix: "" },
];
const forbidden = /\/(404|500)/;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const offenders = [];
for (const { dir, prefix } of roots) {
  let files;
  try {
    files = walk(dir);
  } catch {
    continue;
  }
  for (const file of files) {
    const url = `${prefix}/${relative(dir, file).split(sep).join("/")}`;
    if (forbidden.test(url)) offenders.push(url);
  }
}

if (offenders.length) {
  console.error("Fichiers statiques incompatibles avec l'hébergement Wasmer (URL contenant /404 ou /500) :");
  for (const url of offenders) console.error(`  ${url}`);
  console.error("Renomme-les (fichiers de public/) ou ajuste le préfixe des chunks dans next.config.ts.");
  process.exit(1);
}
console.log("Chemins statiques compatibles Wasmer : OK");
