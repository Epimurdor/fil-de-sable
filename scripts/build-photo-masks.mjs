// Masques du fil pour les photos recolorables du configurateur (src/lib/photo-models.ts).
//
//   node scripts/build-photo-masks.mjs [dossier-apercus]
//
// Pour chaque photo : on garde les pixels dont la couleur ressemble au fil (teinte, saturation,
// luminosité propres à la photo), puis seulement les grandes zones connexes (le bracelet est d'un
// seul tenant, les taches du coquillage non). Le masque est adouci d'un pixel et écrit en PNG
// niveaux de gris : blanc = fil (recoloré), noir = perles et décor (intacts).
// Affiche aussi la luminance de référence du fil, à reporter dans src/lib/photo-models.ts.
// Avec un dossier en argument, écrit des aperçus recolorés pour contrôler le masque à l'œil.
import path from "node:path";
import fs from "node:fs";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const previewDir = process.argv[2];

const PHOTOS = [
  {
    // Fil bleu-gris, perles nacrées et deux petites perles dorées, coquillage beige.
    src: "public/images/produits/bracelet-atelier-1.jpg",
    isThread: ({ h, s, v }) => h >= 180 && h <= 250 && s >= 0.14 && v <= 0.78,
    contrast: 0.8,
  },
  {
    // Fil prune très foncé, perles quartz rose, coquillage beige aux fissures brunes.
    src: "public/images/produits/bracelet-atelier-2.jpg",
    isThread: ({ h, s, v }) => (v <= 0.4 && h >= 230 && h <= 345 && s >= 0.06) || v <= 0.2,
    contrast: 0.55,
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

  // Luminance linéaire de référence du fil : médiane sur le masque.
  const lums = [];
  for (let i = 0; i < w * h; i += 7) {
    if (mask[i]) lums.push(0.2126 * lin(data[i * 3] / 255) + 0.7152 * lin(data[i * 3 + 1] / 255) + 0.0722 * lin(data[i * 3 + 2] / 255));
  }
  lums.sort((a, b) => a - b);
  const ref = lums[lums.length >> 1];

  const gray = Buffer.from(mask.map((m) => m * 255));
  const out = file.replace(/\.jpg$/, ".masque.png");
  await sharp(gray, { raw: { width: w, height: h, channels: 1 } }).blur(0.8).toColourspace("b-w").png({ compressionLevel: 9 }).toFile(out);
  const coverage = ((lums.length * 7) / (w * h)) * 100;
  console.log(`${path.basename(out)} : ${w}×${h}, fil ${coverage.toFixed(1)} % de l'image, luminance de référence ${ref.toFixed(4)}`);

  if (previewDir) {
    fs.mkdirSync(previewDir, { recursive: true });
    const maskBlur = await sharp(out).extractChannel(0).raw().toBuffer();
    for (const [name, hex] of [["corail", "#E4572E"], ["sable", "#D0AB63"], ["vert", "#2F613F"]]) {
      const t = [1, 3, 5].map((k) => lin(parseInt(hex.slice(k, k + 2), 16) / 255));
      const px = Buffer.alloc(w * h * 3);
      for (let i = 0; i < w * h; i++) {
        const m = maskBlur[i] / 255;
        const l = 0.2126 * lin(data[i * 3] / 255) + 0.7152 * lin(data[i * 3 + 1] / 255) + 0.0722 * lin(data[i * 3 + 2] / 255);
        const k = Math.min(3, l / ref) ** photo.contrast;
        for (let c = 0; c < 3; c++) {
          const dyed = Math.min(1, t[c] * k);
          const srgb = dyed <= 0.0031308 ? dyed * 12.92 : 1.055 * dyed ** (1 / 2.4) - 0.055;
          px[i * 3 + c] = Math.round(data[i * 3 + c] * (1 - m) + srgb * 255 * m);
        }
      }
      const name2 = `${path.basename(file, ".jpg")}-${name}.jpg`;
      await sharp(px, { raw: { width: w, height: h, channels: 3 } }).resize(600).jpeg({ quality: 82 }).toFile(path.join(previewDir, name2));
    }
    await sharp(out).resize(600).toFile(path.join(previewDir, `${path.basename(file, ".jpg")}-masque.png`));
  }
}
