// Génère un modèle 3D texturé à partir d'une photo avec l'API Meshy (Image to 3D), en qualité maximale.
//
//   node --env-file=.env scripts/meshy-image-to-3d.mjs <photo.png|jpg> <dossier-sortie>
//
// Clé : MESHY_API_KEY (dans .env, jamais commitée). Doc : https://docs.meshy.ai/api/image-to-3d
// Reprise sûre : l'id de la tâche est écrit dans <dossier>/task.json dès sa création. Relancer le script
// reprend cette tâche au lieu d'en créer (et payer) une nouvelle. Supprimer task.json pour régénérer.
import fs from "node:fs";
import path from "node:path";

const API = "https://api.meshy.ai/openapi/v1";
const key = process.env.MESHY_API_KEY;
const [image, outDir] = process.argv.slice(2);
if (!key) {
  console.error("MESHY_API_KEY manquant : ajoute-le dans .env puis lance avec node --env-file=.env");
  process.exit(1);
}
if (!image || !outDir) {
  console.error("Usage : node --env-file=.env scripts/meshy-image-to-3d.mjs <photo> <dossier-sortie>");
  process.exit(1);
}

// Qualité maximale : Meshy 7.1, géométrie 4k, textures 8k avec cartes PBR (normal = relief des nœuds,
// roughness, metallic), sans remaillage (on garde tout le détail ; l'allègement web se fait ensuite).
const REQUEST = {
  ai_model: "meshy-7.1",
  model_type: "standard",
  geometry_resolution: "4k",
  should_texture: true,
  enable_pbr: true,
  texture_resolution: "8k",
  should_remesh: false,
  image_enhancement: true,
  target_formats: ["glb", "fbx"],
  alpha_thumbnail: true,
  multi_view_thumbnails: true,
};

const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

async function api(method, url, body) {
  const res = await fetch(`${API}${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} → HTTP ${res.status} : ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}

async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Téléchargement ${file} → HTTP ${res.status}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log(`  ${path.basename(file)} (${(fs.statSync(file).size / 1024 / 1024).toFixed(1)} Mo)`);
}

fs.mkdirSync(outDir, { recursive: true });
const taskFile = path.join(outDir, "task.json");

try {
  const balance = await api("GET", "/balance");
  console.log(`Crédits Meshy disponibles : ${balance.balance ?? JSON.stringify(balance)}`);
} catch (e) {
  console.warn(`Solde illisible (${e.message}), on continue.`);
}

let taskId;
if (fs.existsSync(taskFile)) {
  taskId = JSON.parse(fs.readFileSync(taskFile, "utf8")).id;
  console.log(`Reprise de la tâche existante ${taskId}`);
} else {
  const ext = path.extname(image).toLowerCase().replace(".", "").replace("jpg", "jpeg");
  const dataUri = `data:image/${ext};base64,${fs.readFileSync(image).toString("base64")}`;
  const created = await api("POST", "/image-to-3d", { image_url: dataUri, ...REQUEST });
  taskId = created.result;
  fs.writeFileSync(taskFile, JSON.stringify({ id: taskId, createdAt: new Date().toISOString(), request: REQUEST }, null, 2));
  console.log(`Tâche créée : ${taskId}`);
}

let task;
let last = -1;
for (;;) {
  task = await api("GET", `/image-to-3d/${taskId}`);
  if (task.progress !== last) {
    console.log(`${new Date().toLocaleTimeString("fr-FR")}  ${task.status} ${task.progress ?? 0} %`);
    last = task.progress;
  }
  if (["SUCCEEDED", "FAILED", "CANCELED"].includes(task.status)) break;
  await new Promise((r) => setTimeout(r, 15000));
}
fs.writeFileSync(path.join(outDir, "result.json"), JSON.stringify(task, null, 2));
if (task.status !== "SUCCEEDED") {
  console.error(`Échec : ${task.status} ${task.task_error?.message ?? ""}`);
  process.exit(1);
}

console.log(`Terminé (${task.consumed_credits ?? "?"} crédits). Téléchargement :`);
for (const [fmt, url] of Object.entries(task.model_urls ?? {})) {
  if (url) await download(url, path.join(outDir, `model.${fmt === "pre_remeshed_glb" ? "pre.glb" : fmt}`));
}
for (const [i, set] of (task.texture_urls ?? []).entries()) {
  for (const [map, url] of Object.entries(set)) {
    if (url) await download(url, path.join(outDir, `texture${i || ""}-${map}${path.extname(new URL(url).pathname) || ".png"}`));
  }
}
if (task.thumbnail_url) await download(task.thumbnail_url, path.join(outDir, "thumbnail.png"));
if (task.alpha_thumbnail_url) await download(task.alpha_thumbnail_url, path.join(outDir, "thumbnail-alpha.png"));
for (const [view, url] of Object.entries(task.thumbnail_urls ?? {})) {
  if (url) await download(url, path.join(outDir, `thumbnail-${view}.png`));
}
console.log(`Modèle prêt dans ${outDir}`);
