// Conversions sRGB ↔ OKLab (Björn Ottosson) pour repeindre le fil des photos : on garde la teinte et la
// saturation du HEX de la bobine, la photo ne donne que les nuances de clarté (ombres, reflets).
// Sans dépendance : importé par le navigateur (photo-recolor.tsx) et par scripts/build-photo-masks.mjs.

export type Lab = [number, number, number];

export const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
export const toSrgb = (l: number) => (l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055);

export function linearToOklab(r: number, g: number, b: number): Lab {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToLinear(L: number, a: number, b: number): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function hexToOklab(hex: string): Lab {
  const [r, g, b] = [1, 3, 5].map((k) => toLinear(parseInt(hex.slice(k, k + 2), 16) / 255));
  return linearToOklab(r, g, b);
}

// Clarté OKLab d'un pixel sRGB 8 bits.
export function srgb8Lightness(r: number, g: number, b: number): number {
  return linearToOklab(toLinear(r / 255), toLinear(g / 255), toLinear(b / 255))[0];
}

// Couleur du fil pour un pixel : clarté = celle du HEX + l'écart de ce pixel à la clarté médiane du fil
// d'origine ; teinte et saturation du HEX (atténuées dans les ombres, comme sur un vrai fil).
// Le pixel « moyen » du fil sort donc exactement à la couleur du HEX.
export function dyeThread(target: Lab, pixelL: number, refL: number): [number, number, number] {
  const L = Math.min(0.97, Math.max(0.03, target[0] + (pixelL - refL)));
  const chroma = Math.min(1, L / Math.max(target[0], 0.01));
  const lin = oklabToLinear(L, target[1] * chroma, target[2] * chroma);
  return [Math.min(1, Math.max(0, lin[0])), Math.min(1, Math.max(0, lin[1])), Math.min(1, Math.max(0, lin[2]))];
}

// Médiane de valeurs pondérées par un masque (seuil 0,5), sur un échantillon.
export function maskedMedian(values: Float32Array, mask: Float32Array, step = 3): number {
  const picked: number[] = [];
  for (let i = 0; i < values.length; i += step) if (mask[i] >= 0.5) picked.push(values[i]);
  picked.sort((x, y) => x - y);
  return picked[picked.length >> 1] ?? 0.5;
}
