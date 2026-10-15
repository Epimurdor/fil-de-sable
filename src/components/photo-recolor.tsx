"use client";

// Photo du bracelet dont seul le fil change de couleur. Le masque (scripts/build-photo-masks.mjs) dit où est
// le fil ; chaque pixel du fil garde son ombre et son relief : sa luminance, rapportée à celle du fil d'origine
// (refLum), module la couleur choisie (même principe que le modèle 3D texturé). Perles et décor sont intacts.
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { PatternPhoto } from "@/lib/configurator";

const MAX_WIDTH = 900; // assez net pour l'aperçu, recoloration en quelques millisecondes

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
// Table linéaire → sRGB 8 bits (4096 pas) : évite un pow() par pixel et par canal.
const TO_SRGB = Array.from({ length: 4097 }, (_, i) => {
  const l = i / 4096;
  return Math.round((l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055) * 255);
});

type Prepared = { width: number; height: number; original: Uint8ClampedArray; mask: Float32Array; shade: Float32Array };

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function PhotoRecolor({ photo, threadHex, alt, className }: { photo: PatternPhoto; threadHex: string; alt: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prepared, setPrepared] = useState<{ src: string; data: Prepared | null } | null>(null);
  const ready = prepared?.src === photo.src ? prepared.data : undefined;

  // Chargement : photo et masque à la même taille, puis luminance « relative » de chaque pixel du fil.
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadImage(photo.src), loadImage(photo.mask)])
      .then(([img, maskImg]) => {
        if (cancelled) return;
        const width = Math.min(MAX_WIDTH, img.naturalWidth);
        const height = Math.round((img.naturalHeight * width) / img.naturalWidth);
        const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
        ctx.canvas.width = width;
        ctx.canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const original = ctx.getImageData(0, 0, width, height).data;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(maskImg, 0, 0, width, height);
        const maskData = ctx.getImageData(0, 0, width, height).data;

        const mask = new Float32Array(width * height);
        const shade = new Float32Array(width * height);
        for (let i = 0; i < width * height; i++) {
          const m = maskData[i * 4] / 255;
          mask[i] = m;
          if (m > 0) {
            const lum =
              0.2126 * toLinear(original[i * 4] / 255) + 0.7152 * toLinear(original[i * 4 + 1] / 255) + 0.0722 * toLinear(original[i * 4 + 2] / 255);
            shade[i] = Math.min(3, lum / photo.refLum) ** photo.contrast;
          }
        }
        setPrepared({ src: photo.src, data: { width, height, original, mask, shade } });
      })
      .catch(() => !cancelled && setPrepared({ src: photo.src, data: null }));
    return () => {
      cancelled = true;
    };
  }, [photo]);

  // Recoloration à chaque changement de fil.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const { width, height, original, mask, shade } = ready;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    const out = new ImageData(width, height);
    const px = out.data;
    const t = [1, 3, 5].map((k) => toLinear(parseInt(threadHex.slice(k, k + 2), 16) / 255));
    for (let i = 0; i < width * height; i++) {
      const o = i * 4;
      const m = mask[i];
      px[o + 3] = 255;
      if (m === 0) {
        px[o] = original[o];
        px[o + 1] = original[o + 1];
        px[o + 2] = original[o + 2];
        continue;
      }
      for (let c = 0; c < 3; c++) {
        const dyed = TO_SRGB[Math.min(4096, Math.round(Math.min(1, t[c] * shade[i]) * 4096))];
        px[o + c] = original[o + c] * (1 - m) + dyed * m;
      }
    }
    ctx.putImageData(out, 0, 0);
  }, [ready, threadHex]);

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
