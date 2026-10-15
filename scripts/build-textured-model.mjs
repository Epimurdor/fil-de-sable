// Prépare un modèle 3D texturé (GLB Meshy, ~100 Mo, textures 8k) pour le configurateur web.
//
//   node scripts/build-textured-model.mjs <entrée.glb> <dossier/sortie.gltf> [--tris 250000] [--tex 2048]
//
// - allège la géométrie (meshoptimizer) en préservant les UV, donc les textures ;
// - réduit les textures (Windows : System.Drawing via PowerShell) : couleur et relief (normal map) à --tex,
//   métal/rugosité à la moitié ;
// - quantifie et compresse (EXT_meshopt_compression, décodé par three.js).
// La couleur du fil est changée à l'affichage (src/components/bracelet-3d.tsx) : les zones sombres de la texture
// sont le fil, les zones claires les perles.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { weld, simplify, dedup, prune, quantize, meshopt, getSceneVertexCount, VertexCountMethod } from "@gltf-transform/functions";
import { MeshoptSimplifier, MeshoptEncoder } from "meshoptimizer";

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? Number(args[i + 1]) : def;
};
const [input, output] = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--")));
const TARGET_TRIS = opt("--tris", 250_000);
const TEX = opt("--tex", 2048);
if (!input || !output) {
  console.error("Usage : node scripts/build-textured-model.mjs <entrée.glb> <sortie.glb> [--tris 250000] [--tex 2048]");
  process.exit(1);
}

await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(input);

const countTris = () =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute("POSITION").getCount()) / 3, 0);
const before = countTris();
console.log(`Entrée : ${before} triangles, ${getSceneVertexCount(doc.getRoot().listScenes()[0], VertexCountMethod.UPLOAD)} sommets`);

// ---------- Géométrie ----------
await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: Math.min(1, TARGET_TRIS / before), error: 0.0008 }));
console.log(`Allégé : ${countTris()} triangles`);

// ---------- Textures ----------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fds-tex-"));
const ps = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile($args[0]); $size = [int]$args[2]
$dst = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($dst)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($src, 0, 0, $size, $size)
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1
$p = [System.Drawing.Imaging.EncoderParameters]::new(1)
$p.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, [long]$args[3])
$dst.Save($args[1], $enc, $p); $g.Dispose(); $dst.Dispose(); $src.Dispose()
`;
const psFile = path.join(tmp, "resize.ps1");
fs.writeFileSync(psFile, ps);
const mat = doc.getRoot().listMaterials()[0];
const roles = new Map([
  [mat.getBaseColorTexture(), { size: TEX, q: 90, name: "couleur", file: "couleur" }],
  [mat.getNormalTexture(), { size: TEX, q: 95, name: "relief", file: "relief" }],
  [mat.getMetallicRoughnessTexture(), { size: TEX / 2, q: 90, name: "métal/rugosité", file: "metal-rugosite" }],
]);
for (const [tex, r] of roles) {
  if (!tex) continue;
  const inFile = path.join(tmp, `${r.size}-${Math.random().toString(36).slice(2)}.${tex.getMimeType() === "image/png" ? "png" : "jpg"}`);
  const outFile = inFile.replace(/\.\w+$/, "-out.jpg");
  fs.writeFileSync(inFile, tex.getImage());
  execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psFile, inFile, outFile, String(r.size), String(r.q)]);
  if (!fs.existsSync(outFile) || fs.statSync(outFile).size === 0) throw new Error(`Redimensionnement de la texture ${r.name} échoué.`);
  tex.setImage(new Uint8Array(fs.readFileSync(outFile))).setMimeType("image/jpeg").setURI(`${r.file}.jpg`);
  console.log(`Texture ${r.name} : ${r.size}px, ${(fs.statSync(outFile).size / 1024).toFixed(0)} Ko`);
}
fs.rmSync(tmp, { recursive: true, force: true });

// ---------- Compression ----------
await doc.transform(dedup(), prune(), quantize(), meshopt({ encoder: MeshoptEncoder, level: "medium" }));
// Le fil est recoloré à l'affichage : on garde une trace du mode dans les extras.
doc.getRoot().setExtras({ recolor: "texture-luminance", source: path.basename(input) });
// Sortie .gltf (+ .bin + textures .jpg à côté) : la CSP du site (connect-src 'self') bloque les URL blob:
// que three.js utilise pour les textures embarquées dans un .glb ; des fichiers séparés passent.
if (!output.endsWith(".gltf")) throw new Error("La sortie doit être un .gltf (textures en fichiers séparés).");
const outDir = path.dirname(output);
fs.mkdirSync(outDir, { recursive: true });
doc.getRoot().listBuffers().forEach((b) => b.setURI(path.basename(output).replace(/\.gltf$/, ".bin")));
await io.write(output, doc);
const files = fs.readdirSync(outDir);
const total = files.reduce((n, f) => n + fs.statSync(path.join(outDir, f)).size, 0);
console.log(`Écrit ${outDir} : ${files.join(", ")} (${(total / 1024 / 1024).toFixed(2)} Mo au total)`);
