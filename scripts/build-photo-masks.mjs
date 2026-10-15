// Masques du fil et des perles pour les photos recolorables du configurateur (PATTERN_PHOTOS, src/lib/configurator.ts).
//
//   node scripts/build-photo-masks.mjs [dossier-apercus]
//
// Pour chaque photo : on garde les pixels dont la couleur ressemble au fil (teinte, saturation,
// luminosité propres à la photo), puis seulement les grandes zones connexes (le bracelet est d'un
// seul tenant, les taches du coquillage non). Le masque est adouci d'un pixel et écrit en PNG
// niveaux de gris : blanc = fil (recoloré), noir = perles et décor (intacts).
// Affiche la luminance de référence des perles (beadRefLum, à reporter dans PATTERN_PHOTOS).
// Avec un dossier en argument, écrit des aperçus recolorés (bobines réelles, pastille du HEX en coin) pour contrôler à l'œil.
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";
import { dyeThread, hexToOklab, maskedMedian, srgb8Lightness, toSrgb } from "../src/lib/color.ts";

const root = path.resolve(import.meta.dirname, "..");
const previewDir = process.argv[2];

const PHOTOS = [
  {
    // Fil bleu-gris, perles nacrées et deux petites perles dorées, coquillage beige.
    src: "public/images/produits/bracelet-atelier-1.jpg",
    isThread: ({ h, s, v }) => h >= 180 && h <= 250 && s >= 0.14 && v <= 0.78,
    // Perles nacrées : claires et peu saturées (le coquillage, beige, est plus saturé).
    isBead: ({ s, v }) => s <= 0.2 && v >= 0.45,
    // Perles ratées par la détection (ombre, reflet bleuté) : [x, y, rayon] en pixels de la photo.
    extraBeads: [[410, 618, 30], [295, 743, 15], [345, 807, 18], [493, 873, 26], [655, 893, 29], [1255, 585, 28], [1360, 715, 18], [1232, 775, 27], [1095, 822, 29]],
  },
  {
    // Fil prune très foncé, perles quartz rose, coquillage beige aux fissures brunes.
    src: "public/images/produits/bracelet-atelier-2.jpg",
    isThread: ({ h, s, v }) => (v <= 0.4 && h >= 230 && h <= 345 && s >= 0.06) || v <= 0.2,
    // Quartz rose : rose pâle (teinte rose / mauve), plus clair que le fil.
    isBead: ({ h, s, v }) => v >= 0.45 && s >= 0.04 && (h >= 260 || h <= 20),
    extraBeads: [[240, 1060, 62]],
  },
];

function hsv(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? d / max : 0, v: max };
}

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

// Zones connexes (4-voisinage) ; garde celles d'au moins `keep` × la plus grande.
function keepLargest(mask, w, h, keep) {
  const label = new Int32Array(w * h);
  const sizes = [0];
  const stack = [];
  for (let i = 0; i < w * h; i++) {
    if (!mask[i] || label[i]) continue;
    const id = sizes.length;
    let n = 0;
    stack.push(i);
    label[i] = id;
    while (stack.length) {
      const p = stack.pop();
      n++;
      const x = p % w, y = (p / w) | 0;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && mask[q] && !label[q]) {
          label[q] = id;
          stack.push(q);
        }
      }
    }
    sizes.push(n);
  }
  const max = Math.max(...sizes);
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = label[i] && sizes[label[i]] >= max * keep ? 1 : 0;
  return out;
}

// Ferme les trous d'un pixel (grain du fil) : un pixel entouré de fil devient fil.
function close(mask, w, h) {
  const out = mask.slice();
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (mask[i]) continue;
      const n = mask[i - 1] + mask[i + 1] + mask[i - w] + mask[i + w] + mask[i - w - 1] + mask[i - w + 1] + mask[i + w - 1] + mask[i + w + 1];
      if (n >= 6) out[i] = 1;
    }
  }
  return out;
}

function dilate(mask, w, h) {
  const out = mask.slice();
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!mask[i] && (mask[i - 1] || mask[i + 1] || mask[i - w] || mask[i + w])) out[i] = 1;
    }
  }
  return out;
}

// Perles : zones de la couleur des perles, dans le cadre du bracelet, de taille de perle et à peu près
// rondes ; chacune est remplacée par son disque (reflets et creux compris), moins le fil qui passe devant.
function detectBeads(data, thread, w, h, isBead, extraBeads = []) {
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let i = 0; i < w * h; i++) {
    if (!thread[i]) continue;
    const x = i % w, y = (i / w) | 0;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  const cand = new Uint8Array(w * h);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      if (!thread[i] && isBead(hsv(data[i * 3] / 255, data[i * 3 + 1] / 255, data[i * 3 + 2] / 255))) cand[i] = 1;
    }
  }
  const seen = new Uint8Array(w * h);
  const beads = [];
  const stack = [];
  for (let i = 0; i < w * h; i++) {
    if (!cand[i] || seen[i]) continue;
    let n = 0, bx0 = w, by0 = h, bx1 = 0, by1 = 0;
    stack.push(i);
    seen[i] = 1;
    while (stack.length) {
      const p = stack.pop();
      const x = p % w, y = (p / w) | 0;
      n++;
      if (x < bx0) bx0 = x;
      if (x > bx1) bx1 = x;
      if (y < by0) by0 = y;
      if (y > by1) by1 = y;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (q >= 0 && cand[q] && !seen[q]) {
          seen[q] = 1;
          stack.push(q);
        }
      }
    }
    const bw = bx1 - bx0 + 1, bh = by1 - by0 + 1;
    const r = Math.max(bw, bh) / 2;
    const fill = n / (Math.PI * r * r); // 1 = disque plein
    if (n < 250 || n > 40000 || bw / bh < 0.6 || bw / bh > 1.6 || fill < 0.4) continue;
    // Une perle est sertie dans le fil : la couronne juste autour d'elle est surtout du fil.
    const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2;
    let ring = 0, ringThread = 0;
    for (let a = 0; a < 64; a++) {
      for (const k of [1.25, 1.45, 1.65]) {
        const x = Math.round(cx + Math.cos((a / 64) * 2 * Math.PI) * r * k);
        const y = Math.round(cy + Math.sin((a / 64) * 2 * Math.PI) * r * k);
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        ring++;
        if (thread[y * w + x]) ringThread++;
      }
    }
    if (ringThread / ring >= 0.45) beads.push({ cx, cy, r: r * 1.04 });
  }
  for (const [cx, cy, r] of extraBeads) beads.push({ cx, cy, r });
  const mask = new Uint8Array(w * h);
  for (const b of beads) {
    for (let y = Math.max(0, Math.floor(b.cy - b.r)); y <= Math.min(h - 1, Math.ceil(b.cy + b.r)); y++) {
      for (let x = Math.max(0, Math.floor(b.cx - b.r)); x <= Math.min(w - 1, Math.ceil(b.cx + b.r)); x++) {
        const i = y * w + x;
        if ((x - b.cx) ** 2 + (y - b.cy) ** 2 <= b.r * b.r && !thread[i]) mask[i] = 1;
      }
    }
  }
  return { mask, beads };
}

for (const photo of PHOTOS) {
  const file = path.join(root, photo.src);
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;

  let mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    mask[i] = photo.isThread(hsv(data[i * 3] / 255, data[i * 3 + 1] / 255, data[i * 3 + 2] / 255)) ? 1 : 0;
  }
  mask = keepLargest(close(close(mask, w, h), w, h), w, h, 0.003);
  // +1 pixel : les bords du fil (mi-fil, mi-fond) sont recolorés aussi, sinon un liseré de l'ancienne couleur reste.
  mask = dilate(mask, w, h);

  const gray = Buffer.from(mask.map((m) => m * 255));
  const out = file.replace(/\.jpg$/, ".masque.png");
  await sharp(gray, { raw: { width: w, height: h, channels: 1 } }).blur(0.8).toColourspace("b-w").png({ compressionLevel: 9 }).toFile(out);
  const coverage = (mask.reduce((s, m) => s + m, 0) / (w * h)) * 100;
  console.log(`${path.basename(out)} : ${w}×${h}, fil ${coverage.toFixed(1)} % de l'image`);

  // Masque des perles (recolorées en argent ou en doré selon le choix du client).
  const { mask: beadMask, beads } = detectBeads(data, mask, w, h, photo.isBead, photo.extraBeads);
  const beadLums = [];
  for (let i = 0; i < w * h; i += 3) {
    if (beadMask[i]) beadLums.push(0.2126 * lin(data[i * 3] / 255) + 0.7152 * lin(data[i * 3 + 1] / 255) + 0.0722 * lin(data[i * 3 + 2] / 255));
  }
  beadLums.sort((a, b) => a - b);
  const beadRef = beadLums[beadLums.length >> 1] ?? 1;
  const beadOut = file.replace(/\.jpg$/, ".perles.png");
  await sharp(Buffer.from(beadMask.map((m) => m * 255)), { raw: { width: w, height: h, channels: 1 } })
    .blur(1)
    .toColourspace("b-w")
    .png({ compressionLevel: 9 })
    .toFile(beadOut);
  console.log(`${path.basename(beadOut)} : ${beads.length} perles, luminance de référence ${beadRef.toFixed(4)}`);

  if (previewDir) {
    fs.mkdirSync(previewDir, { recursive: true });
    const maskBlur = await sharp(out).extractChannel(0).raw().toBuffer();
    // Même calcul que le navigateur (src/lib/color.ts) : le pixel médian du fil prend exactement le HEX.
    const threadL = new Float32Array(w * h);
    const cover = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      cover[i] = maskBlur[i] / 255;
      if (cover[i]) threadL[i] = srgb8Lightness(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
    }
    const refL = maskedMedian(threadL, cover);
    // Bobines réelles de la cartelle : 35 (terracotta), 224 (turquoise), 87 (vert foncé), 899 (rose), Palha (beige).
    for (const [name, hex] of [["35", "#CE673B"], ["224", "#63A89E"], ["87", "#2F613F"], ["899", "#BE5982"], ["palha", "#CEA75B"]]) {
      const target = hexToOklab(hex);
      const px = Buffer.alloc(w * h * 3);
      for (let i = 0; i < w * h; i++) {
        const m = cover[i];
        const dyed = m ? dyeThread(target, threadL[i], refL) : null;
        for (let c = 0; c < 3; c++) {
          px[i * 3 + c] = dyed ? Math.round(data[i * 3 + c] * (1 - m) + toSrgb(dyed[c]) * 255 * m) : data[i * 3 + c];
        }
      }
      // Pastille du HEX en haut à gauche, pour comparer à l'œil.
      for (let y = 20; y < 160; y++) {
        for (let x = 20; x < 160; x++) {
          for (let c = 0; c < 3; c++) px[(y * w + x) * 3 + c] = parseInt(hex.slice(1 + c * 2, 3 + c * 2), 16);
        }
      }
      const name2 = `${path.basename(file, ".jpg")}-${name}.jpg`;
      await sharp(px, { raw: { width: w, height: h, channels: 3 } }).resize(600).jpeg({ quality: 82 }).toFile(path.join(previewDir, name2));
    }
    await sharp(out).resize(600).toFile(path.join(previewDir, `${path.basename(file, ".jpg")}-masque.png`));
    // Contrôle des perles : perles détectées teintées en rouge vif.
    const bm = await sharp(beadOut).extractChannel(0).raw().toBuffer();
    const check = Buffer.from(data);
    for (let i = 0; i < w * h; i++) {
      const m = bm[i] / 255;
      check[i * 3] = Math.round(data[i * 3] * (1 - m) + 255 * m);
      check[i * 3 + 1] = Math.round(data[i * 3 + 1] * (1 - m));
      check[i * 3 + 2] = Math.round(data[i * 3 + 2] * (1 - m));
    }
    await sharp(check, { raw: { width: w, height: h, channels: 3 } }).resize(600).jpeg({ quality: 82 }).toFile(path.join(previewDir, `${path.basename(file, ".jpg")}-perles.jpg`));
    // Perles en métal : même calcul que src/components/photo-recolor.tsx (metalShade).
    for (const [name, hex, contrast] of [["or", "#E2B65A", 0.9], ["argent", "#B9BEC5", 1.6]]) {
      const t = [1, 3, 5].map((k) => lin(parseInt(hex.slice(k, k + 2), 16) / 255));
      const px = Buffer.from(data);
      for (let i = 0; i < w * h; i++) {
        const m = bm[i] / 255;
        if (!m) continue;
        const l = 0.2126 * lin(data[i * 3] / 255) + 0.7152 * lin(data[i * 3 + 1] / 255) + 0.0722 * lin(data[i * 3 + 2] / 255);
        const k = Math.min(4, l / beadRef) ** contrast;
        const glint = Math.max(0, k - 1.2) * 0.25; // reflets : vers le blanc
        for (let c = 0; c < 3; c++) {
          const metal = Math.min(1, t[c] * Math.min(k, 1.2) + glint);
          const srgb = metal <= 0.0031308 ? metal * 12.92 : 1.055 * metal ** (1 / 2.4) - 0.055;
          px[i * 3 + c] = Math.round(data[i * 3 + c] * (1 - m) + srgb * 255 * m);
        }
      }
      await sharp(px, { raw: { width: w, height: h, channels: 3 } })
        .extract({ left: Math.round(w * 0.1), top: Math.round(h * 0.2), width: Math.round(w * 0.8), height: Math.round(h * 0.4) })
        .resize(800)
        .jpeg({ quality: 85 })
        .toFile(path.join(previewDir, `${path.basename(file, ".jpg")}-perles-${name}.jpg`));
    }
  }
}
