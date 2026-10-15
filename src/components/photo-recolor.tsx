"use client";

// Photo du bracelet dont le fil et les perles changent de couleur. Deux masques (scripts/build-photo-masks.mjs)
// disent où sont le fil et les perles. Fil : le pixel « moyen » prend exactement le HEX de la bobine, les autres
// gardent leur écart de clarté (ombres, reflets) en OKLab, sans dépasser la saturation du HEX (src/lib/color.ts).
// Perles : leur luminance, rapportée à beadRefLum, module la teinte or ou argent. Le décor reste intact.
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { dyeThread, hexToOklab, maskedMedian, srgb8Lightness, toLinear } from "@/lib/color";
import { PHOTO_METALS, type BeadMetal, type PatternPhoto } from "@/lib/configurator";

const MAX_WIDTH = 900; // assez net pour l'aperçu, recoloration en quelques millisecondes

// Table linéaire → sRGB 8 bits (4096 pas) : évite un pow() par pixel et par canal.
const TO_SRGB = Array.from({ length: 4097 }, (_, i) => {
  const l = i / 4096;
  return Math.round((l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055) * 255);
});
const srgb = (linear: number) => TO_SRGB[Math.round(Math.min(1, Math.max(0, linear)) * 4096)];
const hexToLinear = (hex: string) => [1, 3, 5].map((k) => toLinear(parseInt(hex.slice(k, k + 2), 16) / 255));

type Prepared = {
  width: number;
  height: number;
  original: Uint8ClampedArray;
  thread: Float32Array; // couverture du masque du fil (0 à 1)
  threadL: Float32Array; // clarté OKLab des pixels du fil
  refL: number; // clarté médiane du fil d'origine
  bead: Float32Array; // couverture du masque des perles
  beadLum: Float32Array; // luminance des perles rapportée à beadRefLum
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function PhotoRecolor({
  photo,
  threadHex,
  metal,
  alt,
  className,
}: {
  photo: PatternPhoto;
  threadHex: string;
  metal: BeadMetal;
  alt: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prepared, setPrepared] = useState<{ src: string; data: Prepared | null } | null>(null);
  const ready = prepared?.src === photo.src ? prepared.data : undefined;

  // Chargement : photo et masques à la même taille, puis relief de chaque pixel du fil et des perles.
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadImage(photo.src), loadImage(photo.mask), loadImage(photo.beadMask)])
      .then(([img, threadImg, beadImg]) => {
        if (cancelled) return;
        const width = Math.min(MAX_WIDTH, img.naturalWidth);
        const height = Math.round((img.naturalHeight * width) / img.naturalWidth);
        const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
        ctx.canvas.width = width;
        ctx.canvas.height = height;
        const read = (source: HTMLImageElement) => {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(source, 0, 0, width, height);
          return ctx.getImageData(0, 0, width, height).data;
        };
        const original = read(img);
        const threadData = read(threadImg);
        const beadData = read(beadImg);

        const n = width * height;
        const thread = new Float32Array(n);
        const threadL = new Float32Array(n);
        const bead = new Float32Array(n);
        const beadLum = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const t = threadData[i * 4] / 255;
          const b = beadData[i * 4] / 255;
          if (!t && !b) continue;
          thread[i] = t;
          if (t) threadL[i] = srgb8Lightness(original[i * 4], original[i * 4 + 1], original[i * 4 + 2]);
          bead[i] = b;
          if (b) {
            const lum =
              0.2126 * toLinear(original[i * 4] / 255) + 0.7152 * toLinear(original[i * 4 + 1] / 255) + 0.0722 * toLinear(original[i * 4 + 2] / 255);
            beadLum[i] = Math.min(4, lum / photo.beadRefLum);
          }
        }
        const refL = maskedMedian(threadL, thread);
        setPrepared({ src: photo.src, data: { width, height, original, thread, threadL, refL, bead, beadLum } });
      })
      .catch(() => !cancelled && setPrepared({ src: photo.src, data: null }));
    return () => {
      cancelled = true;
    };
  }, [photo]);

  // Recoloration à chaque changement de fil ou de perles.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const { width, height, original, thread, threadL, refL, bead, beadLum } = ready;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    const out = new ImageData(width, height);
    const px = out.data;
    const target = hexToOklab(threadHex);
    const m = hexToLinear(PHOTO_METALS[metal].hex);
    const metalContrast = PHOTO_METALS[metal].contrast;
    for (let i = 0; i < width * height; i++) {
      const o = i * 4;
      px[o + 3] = 255;
      const a = thread[i];
      const b = bead[i];
      if (!a && !b) {
        px[o] = original[o];
        px[o + 1] = original[o + 1];
        px[o + 2] = original[o + 2];
        continue;
      }
      // Perles : relief accentué, plafonné, et les reflets tirent vers le blanc.
      const k = b ? beadLum[i] ** metalContrast : 0;
      const glint = Math.max(0, k - 1.2) * 0.25;
      const dyed = a ? dyeThread(target, threadL[i], refL) : null;
      for (let c = 0; c < 3; c++) {
        let v = original[o + c];
        if (dyed) v = v * (1 - a) + srgb(dyed[c]) * a;
        if (b) v = v * (1 - b) + srgb(m[c] * Math.min(k, 1.2) + glint) * b;
        px[o + c] = v;
      }
    }
    ctx.putImageData(out, 0, 0);
  }, [ready, threadHex, metal]);

  return (
    <div className={cn("relative overflow-hidden bg-paper-2", className)}>
      <canvas ref={canvasRef} role="img" aria-label={alt} className={cn("h-full w-full object-cover", !ready && "invisible")} />
      {!ready && (
        <p className="absolute inset-0 grid place-items-center text-sm text-ink-3">
          {ready === null ? "La photo n'a pas pu se charger." : "Chargement de la photo…"}
        </p>
      )}
    </div>
  );
}
