// Prépare un modèle 3D de bracelet (FBX brut, ex. généré par Meshy) pour le configurateur web.
//
//   node scripts/build-bracelet-model.mjs <entrée.fbx> <sortie.glb> [--tris 140000]
//
// Le FBX est un maillage unique sans couleur ni UV : fil et perles sont fusionnés.
// 1. soude les sommets et calcule les normales ;
// 2. détecte les perles comme des sphères (chaque sommet vote pour le centre p - r·n, pour plusieurs rayons r) ;
// 3. retire les triangles des perles, allège le fil (meshoptimizer) ;
// 4. écrit un GLB qui ne contient QUE le fil, et la liste des perles (centre, rayon, type) dans extras.
// Le configurateur redessine les perles en sphères parfaites avec leur propre matière : changer la couleur
// du fil ne les touche jamais.
import fs from "node:fs";
import path from "node:path";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { Matrix4, Vector3 } from "three";
import { MeshoptSimplifier } from "meshoptimizer";

const args = process.argv.slice(2);
const [input, output] = args.filter((a) => !a.startsWith("--") && !/^\d+$/.test(a));
const trisArg = args.indexOf("--tris");
const TARGET_TRIS = trisArg >= 0 ? Number(args[trisArg + 1]) : 140_000;
if (!input || !output) {
  console.error("Usage : node scripts/build-bracelet-model.mjs <entrée.fbx> <sortie.glb> [--tris 140000]");
  process.exit(1);
}

// ---------- 1. Lecture et soudure ----------
const buf = fs.readFileSync(input);
const fbx = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), "");
let mesh = null;
fbx.updateMatrixWorld(true);
fbx.traverse((o) => {
  if (o.isMesh && !mesh) mesh = o;
});
if (!mesh) throw new Error("Aucun maillage dans le FBX.");

// Orientation du nœud (Y en haut), mais pas son échelle : on normalise nous-mêmes.
const rot = new Matrix4().extractRotation(mesh.matrixWorld);
const raw = mesh.geometry.attributes.position.array;
const nRaw = raw.length / 3;
const weld = new Map();
const index = new Uint32Array(nRaw);
const P = [];
const v = new Vector3();
for (let i = 0; i < nRaw; i++) {
  const x = raw[i * 3], y = raw[i * 3 + 1], z = raw[i * 3 + 2];
  const k = `${Math.round(x * 1e5)},${Math.round(y * 1e5)},${Math.round(z * 1e5)}`;
  let id = weld.get(k);
  if (id === undefined) {
    id = P.length / 3;
    weld.set(k, id);
    v.set(x, y, z).applyMatrix4(rot);
    P.push(v.x, v.y, v.z);
  }
  index[i] = id;
}
// Centre sur la boîte englobante, plus grande dimension = 1.
let pos = new Float32Array(P);
const nV = pos.length / 3;
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < nV; i++) for (let a = 0; a < 3; a++) {
  min[a] = Math.min(min[a], pos[i * 3 + a]);
  max[a] = Math.max(max[a], pos[i * 3 + a]);
}
const scale = 1 / Math.max(...max.map((m, a) => m - min[a]));
const mid = max.map((m, a) => (m + min[a]) / 2);
for (let i = 0; i < nV; i++) for (let a = 0; a < 3; a++) pos[i * 3 + a] = (pos[i * 3 + a] - mid[a]) * scale;
const nT = index.length / 3;
console.log(`Maillage : ${nV} sommets, ${nT} triangles`);

// ---------- 2. Normales (pondérées par l'aire) ----------
const nor = new Float32Array(nV * 3);
const triArea = new Float32Array(nT);
for (let t = 0; t < nT; t++) {
  const a = index[t * 3] * 3, b = index[t * 3 + 1] * 3, c = index[t * 3 + 2] * 3;
  const e1x = pos[b] - pos[a], e1y = pos[b + 1] - pos[a + 1], e1z = pos[b + 2] - pos[a + 2];
  const e2x = pos[c] - pos[a], e2y = pos[c + 1] - pos[a + 1], e2z = pos[c + 2] - pos[a + 2];
  const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
  triArea[t] = Math.hypot(nx, ny, nz) / 2;
  for (const vi of [a, b, c]) {
    nor[vi] += nx;
    nor[vi + 1] += ny;
    nor[vi + 2] += nz;
  }
}
for (let i = 0; i < nV; i++) {
  const l = Math.hypot(nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]) || 1;
  nor[i * 3] /= l;
  nor[i * 3 + 1] /= l;
  nor[i * 3 + 2] /= l;
}
const vertArea = new Float32Array(nV);
for (let t = 0; t < nT; t++) for (let j = 0; j < 3; j++) vertArea[index[t * 3 + j]] += triArea[t] / 3;

// ---------- 3. Détection des perles (vote de Hough sur les sphères) ----------
// Rayons cherchés, en fraction de la plus grande dimension du bracelet.
const R_MIN = 0.012, R_MAX = 0.07, R_STEP = 0.002, CELL = 0.004;
const radii = [];
for (let r = R_MIN; r <= R_MAX + 1e-9; r += R_STEP) radii.push(r);
const votes = new Map();
const OFF = 1024;
const keyOf = (ix, iy, iz, ri) => ((ix + OFF) * 2048 + (iy + OFF)) * 2048 * 64 + (iz + OFF) * 64 + ri;
for (let i = 0; i < nV; i++) {
  const w = vertArea[i];
  for (let ri = 0; ri < radii.length; ri++) {
    const r = radii[ri];
    const cx = pos[i * 3] - r * nor[i * 3], cy = pos[i * 3 + 1] - r * nor[i * 3 + 1], cz = pos[i * 3 + 2] - r * nor[i * 3 + 2];
    const k = keyOf(Math.floor(cx / CELL), Math.floor(cy / CELL), Math.floor(cz / CELL), ri);
    votes.set(k, (votes.get(k) ?? 0) + w);
  }
}
// Score d'une cellule = aire votante voisine (3×3×3, rayon ±1) rapportée à l'aire de la sphère.
const cands = [];
for (const [k, w] of votes) {
  const ri = k % 64;
  const r = radii[ri];
  if (w < 0.02 * 4 * Math.PI * r * r) continue;
  cands.push({ k, w, ri });
}
cands.sort((a, b) => b.w - a.w);

// Grille spatiale des sommets pour les tests d'appartenance.
const G = 0.02;
const grid = new Map();
const gk = (x, y, z) => `${Math.floor(x / G)},${Math.floor(y / G)},${Math.floor(z / G)}`;
for (let i = 0; i < nV; i++) {
  const k = gk(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
  let arr = grid.get(k);
  if (!arr) grid.set(k, (arr = []));
  arr.push(i);
}
function near(c, rad) {
  const out = [];
  const lo = c.map((x) => Math.floor((x - rad) / G)), hi = c.map((x) => Math.floor((x + rad) / G));
  for (let x = lo[0]; x <= hi[0]; x++) for (let y = lo[1]; y <= hi[1]; y++) for (let z = lo[2]; z <= hi[2]; z++) {
    const arr = grid.get(`${x},${y},${z}`);
    if (arr) for (const i of arr) out.push(i);
  }
  return out;
}

// Inliers d'une sphère : sur la surface et normale radiale.
function inliers(c, r, tol = 0.12) {
  const res = [];
  for (const i of near(c, r * (1.05 + tol))) {
    const dx = pos[i * 3] - c[0], dy = pos[i * 3 + 1] - c[1], dz = pos[i * 3 + 2] - c[2];
    const d = Math.hypot(dx, dy, dz);
    if (Math.abs(d - r) > tol * r || d === 0) continue;
    const dot = (dx * nor[i * 3] + dy * nor[i * 3 + 1] + dz * nor[i * 3 + 2]) / d;
    if (dot > 0.8) res.push(i);
  }
  return res;
}
// Résout un système 4×4 (élimination de Gauss).
function solve4(A, b) {
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < 4; col++) {
    let p = col;
    for (let r = col + 1; r < 4; r++) if (Math.abs(M[r][col]) > Math.abs(M[p][col])) p = r;
    [M[col], M[p]] = [M[p], M[col]];
    if (Math.abs(M[col][col]) < 1e-14) return null;
    for (let r = 0; r < 4; r++) {
      if (r === col) continue;
      const f = M[r][col] / M[col][col];
      for (let k = col; k < 5; k++) M[r][k] -= f * M[col][k];
    }
  }
  return M.map((row, i) => row[4] / M[i][i]);
}
// Ajustement algébrique (moindres carrés) : 2c·p + k = |p|², k = r² - |c|². Fiable même sur une calotte.
function fitSphere(ids) {
  const A = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], b = [0, 0, 0, 0];
  for (const i of ids) {
    const w = vertArea[i];
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const row = [2 * x, 2 * y, 2 * z, 1], rhs = x * x + y * y + z * z;
    for (let a = 0; a < 4; a++) {
      b[a] += w * row[a] * rhs;
      for (let c = 0; c < 4; c++) A[a][c] += w * row[a] * row[c];
    }
  }
  const s = solve4(A, b);
  if (!s) return null;
  const c = [s[0], s[1], s[2]];
  const r2 = s[3] + c[0] ** 2 + c[1] ** 2 + c[2] ** 2;
  return r2 > 0 ? { c, r: Math.sqrt(r2) } : null;
}
// Ajustement itératif : on élargit la fenêtre pour capter toute la perle, puis on resserre.
function refine(c, r) {
  for (const tol of [0.35, 0.25, 0.18, 0.12, 0.12, 0.12]) {
    const ins = inliers(c, r, tol);
    if (ins.length < 12) return null;
    const f = fitSphere(ins);
    if (!f || f.r > R_MAX * 1.5) return null;
    ({ c, r } = f);
  }
  const ins = inliers(c, r, 0.08);
  let area = 0;
  // Couverture angulaire : part des directions de la sphère réellement visibles (évite les surfaces de fil courbes).
  const bins = new Set();
  for (const i of ins) {
    area += vertArea[i];
    const dx = pos[i * 3] - c[0], dy = pos[i * 3 + 1] - c[1], dz = pos[i * 3 + 2] - c[2];
    const d = Math.hypot(dx, dy, dz);
    const th = Math.acos(Math.max(-1, Math.min(1, dz / d))), ph = Math.atan2(dy, dx);
    bins.add(`${Math.floor((th / Math.PI) * 8)},${Math.floor(((ph + Math.PI) / (2 * Math.PI)) * 16)}`);
  }
  return { c, r, area: area / (4 * Math.PI * r * r), coverage: bins.size / 128, n: ins.length };
}

const spheres = [];
for (const cand of cands.slice(0, 4000)) {
  const ri = cand.ri;
  const rest = Math.floor(cand.k / 64);
  const iz = (rest % 2048) - OFF;
  const rest2 = Math.floor(rest / 2048);
  const iy = (rest2 % 2048) - OFF;
  const ix = Math.floor(rest2 / 2048) - OFF;
  const c0 = [(ix + 0.5) * CELL, (iy + 0.5) * CELL, (iz + 0.5) * CELL];
  if (spheres.some((s) => Math.hypot(s.c[0] - c0[0], s.c[1] - c0[1], s.c[2] - c0[2]) < s.r)) continue;
  const s = refine(c0, radii[ri]);
  if (!s || s.r < R_MIN * 0.8 || s.r > R_MAX * 1.2) continue;
  if (s.area < 0.3 || s.coverage < 0.3) continue;
  if (spheres.some((o) => Math.hypot(o.c[0] - s.c[0], o.c[1] - s.c[1], o.c[2] - s.c[2]) < Math.max(o.r, s.r))) continue;
  spheres.push(s);
}

// Tri : une vraie perle est bien couverte (≥ 60 % des directions visibles) et d'une taille proche des autres perles.
// Les bosses de nœuds sont petites et peu couvertes. La plus grosse perle est la perle centrale.
spheres.sort((a, b) => b.r - a.r);
const solid = spheres.filter((s) => s.coverage >= 0.6);
const medianR = solid.length ? solid[Math.floor(solid.length / 2)].r : 0;
const pearls = solid.filter((s) => s.r >= 0.75 * medianR);
const beads = pearls.map((s, i) => ({
  kind: i === 0 && s.r > 1.4 * medianR ? "centrale" : "perle",
  center: s.c.map((x) => +x.toFixed(5)),
  radius: +s.r.toFixed(5),
  coverage: +s.coverage.toFixed(2),
}));
console.log(`Perles retenues : ${beads.length} (sphères candidates écartées : ${spheres.length - beads.length})`);
for (const b of beads) console.log(`  ${b.kind.padEnd(8)} r=${b.radius} c=${b.center.join(", ")} couverture=${b.coverage}`);

// ---------- 4. Retrait des perles et allègement du fil ----------
const inBead = new Uint8Array(nV);
for (const s of pearls) {
  for (const i of near(s.c, s.r * 1.2)) {
    const d = Math.hypot(pos[i * 3] - s.c[0], pos[i * 3 + 1] - s.c[1], pos[i * 3 + 2] - s.c[2]);
    if (d < s.r * 1.1) inBead[i] = 1;
  }
}
const kept = [];
for (let t = 0; t < nT; t++) {
  const a = index[t * 3], b = index[t * 3 + 1], c = index[t * 3 + 2];
  if (inBead[a] && inBead[b] && inBead[c]) continue;
  kept.push(a, b, c);
}
let threadIdx = new Uint32Array(kept);
console.log(`Fil : ${threadIdx.length / 3} triangles (avant allègement)`);

await MeshoptSimplifier.ready;
if (threadIdx.length / 3 > TARGET_TRIS) {
  const [simplified, err] = MeshoptSimplifier.simplify(threadIdx, pos, 3, TARGET_TRIS * 3, 0.002, ["Prune"]);
  threadIdx = simplified;
  console.log(`Fil allégé : ${threadIdx.length / 3} triangles (erreur relative ${err.toFixed(5)})`);
}
// Compacte les sommets utilisés.
const remap = new Int32Array(nV).fill(-1);
const outPos = [];
const outIdx = new Uint32Array(threadIdx.length);
for (let i = 0; i < threadIdx.length; i++) {
  const o = threadIdx[i];
  if (remap[o] < 0) {
    remap[o] = outPos.length / 3;
    outPos.push(pos[o * 3], pos[o * 3 + 1], pos[o * 3 + 2]);
  }
  outIdx[i] = remap[o];
}
const nOut = outPos.length / 3;

// ---------- 5. Écriture du GLB (positions quantifiées en int16, KHR_mesh_quantization) ----------
const Q = 32767 * 2; // positions dans [-0.5, 0.5] → int16
const qPos = new Int16Array(nOut * 4); // 4 composantes pour l'alignement sur 8 octets
for (let i = 0; i < nOut; i++) for (let a = 0; a < 3; a++) {
  qPos[i * 4 + a] = Math.max(-32767, Math.min(32767, Math.round(outPos[i * 3 + a] * Q)));
}
const useU16 = nOut <= 65535;
const idxArr = useU16 ? Uint16Array.from(outIdx) : outIdx;
const pad4 = (n) => (n + 3) & ~3;
const posBytes = Buffer.from(qPos.buffer);
const idxBytes = Buffer.from(idxArr.buffer, idxArr.byteOffset, idxArr.byteLength);
const bin = Buffer.alloc(pad4(posBytes.length) + pad4(idxBytes.length));
posBytes.copy(bin, 0);
idxBytes.copy(bin, pad4(posBytes.length));
let qmin = [Infinity, Infinity, Infinity], qmax = [-Infinity, -Infinity, -Infinity];
for (let i = 0; i < nOut; i++) for (let a = 0; a < 3; a++) {
  qmin[a] = Math.min(qmin[a], qPos[i * 4 + a]);
  qmax[a] = Math.max(qmax[a], qPos[i * 4 + a]);
}
const gltf = {
  asset: { version: "2.0", generator: "fil-de-sable build-bracelet-model" },
  extensionsUsed: ["KHR_mesh_quantization"],
  extensionsRequired: ["KHR_mesh_quantization"],
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: "fil", mesh: 0, scale: [1 / Q, 1 / Q, 1 / Q] }],
  meshes: [{ name: "fil", primitives: [{ attributes: { POSITION: 0 }, indices: 1, material: 0 }] }],
  materials: [{ name: "fil", pbrMetallicRoughness: { baseColorFactor: [0.31, 0.39, 0.47, 1], metallicFactor: 0, roughnessFactor: 0.8 } }],
  buffers: [{ byteLength: bin.length }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: posBytes.length, byteStride: 8, target: 34962 },
    { buffer: 0, byteOffset: pad4(posBytes.length), byteLength: idxBytes.length, target: 34963 },
  ],
  accessors: [
    { bufferView: 0, componentType: 5122, count: nOut, type: "VEC3", min: qmin, max: qmax },
    { bufferView: 1, componentType: useU16 ? 5123 : 5125, count: outIdx.length, type: "SCALAR" },
  ],
  // Perles redessinées par le configurateur, dans le repère du nœud (même normalisation).
  extras: { beads, source: path.basename(input) },
};
let json = Buffer.from(JSON.stringify(gltf));
json = Buffer.concat([json, Buffer.alloc(pad4(json.length) - json.length, 0x20)]);
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + json.length + 8 + bin.length, 8);
const chunk = (len, type) => {
  const b = Buffer.alloc(8);
  b.writeUInt32LE(len, 0);
  b.writeUInt32LE(type, 4);
  return b;
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, Buffer.concat([header, chunk(json.length, 0x4e4f534a), json, chunk(bin.length, 0x004e4942), bin]));
console.log(`Écrit ${output} : ${nOut} sommets, ${outIdx.length / 3} triangles, ${(fs.statSync(output).size / 1024).toFixed(0)} Ko`);
