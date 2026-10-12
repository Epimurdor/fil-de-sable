import Image from "next/image";
import { cn } from "@/lib/cn";
import type { ProductKind } from "@/lib/types";

type Props = {
  colors: string[];
  kind?: ProductKind;
  imageUrl?: string | null;
  alt: string;
  beadHex?: string | null;
  pattern?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

// Visuel d'un bijou : la photo si elle existe, sinon un dessin SVG généré à partir des couleurs de fil.
// Le même composant sert au configurateur (aperçu en direct).
export function ProductVisual({ colors, kind = "bracelet", imageUrl, alt, beadHex, pattern, className, priority, sizes }: Props) {
  if (imageUrl) {
    return (
      <div className={cn("relative overflow-hidden bg-sand-100", className)}>
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes={sizes ?? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
          className="object-cover"
          priority={priority}
        />
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden bg-sand-100", className)}>
      <JewelSvg colors={colors.length ? colors : ["#C96F4A"]} kind={kind} beadHex={beadHex} pattern={pattern} title={alt} />
    </div>
  );
}

const patternParams: Record<string, { amp: number; k: number; dash: string }> = {
  vagues: { amp: 5, k: 10, dash: "2 5" },
  arabesques: { amp: 7, k: 6, dash: "1 5" },
  tresse: { amp: 0, k: 1, dash: "5 4" },
};

function ringPath(cx: number, cy: number, rx: number, ry: number, amp: number, k: number, phase: number): string {
  const steps = 140;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const wobble = amp * Math.sin(k * t + phase);
    const x = cx + (rx + wobble) * Math.cos(t);
    const y = cy + (ry + wobble) * Math.sin(t);
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
  }
  return d + "Z";
}

function Bead({ x, y, r, hex }: { x: number; y: number; r: number; hex: string }) {
  return (
    <g>
      <circle cx={x} cy={y + r * 0.35} r={r * 1.05} fill="rgba(62,47,37,0.18)" />
      <circle cx={x} cy={y} r={r} fill={hex} stroke="rgba(62,47,37,0.25)" strokeWidth={1} />
      <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.3} fill="rgba(255,255,255,0.65)" />
    </g>
  );
}

function JewelSvg({ colors, kind, beadHex, pattern, title }: { colors: string[]; kind: ProductKind; beadHex?: string | null; pattern?: string; title: string }) {
  const p = patternParams[pattern ?? "vagues"] ?? patternParams.vagues;
  const n = colors.length;
  const spread = kind === "bague" ? 9 : 8;

  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={title} className="h-full w-full">
      <defs>
        <radialGradient id="bg" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#fbf7f0" />
          <stop offset="100%" stopColor="#ecdfc7" />
        </radialGradient>
      </defs>
      <rect width="400" height="400" fill="url(#bg)" />

      {kind === "collier" ? (
        <g fill="none" strokeLinecap="round">
          {colors.map((c, i) => {
            const off = (i - (n - 1) / 2) * spread;
            const d = `M 70 ${60 + off} C 70 ${250 + off}, 330 ${250 + off}, 330 ${60 + off}`;
            return (
              <g key={i}>
                <path d={d} stroke={c} strokeWidth={7} opacity={0.35} />
                <path d={d} stroke={c} strokeWidth={7} strokeDasharray={p.dash} />
              </g>
            );
          })}
          {[-28, -14, 0, 14, 28].map((dx, i) => (
            <path
              key={i}
              d={`M 200 200 Q ${200 + dx * 1.4} 250 ${200 + dx * 2} 300`}
              stroke={colors[i % n]}
              strokeWidth={6}
              strokeDasharray="2 4"
            />
          ))}
          {beadHex && <Bead x={200} y={200} r={13} hex={beadHex} />}
        </g>
      ) : (
        <g fill="none" strokeLinecap="round">
          <ellipse cx="200" cy={kind === "bague" ? 245 : 250} rx={kind === "bague" ? 95 : 150} ry={kind === "bague" ? 26 : 34} fill="rgba(62,47,37,0.08)" />
          {colors.map((c, i) => {
            const off = (i - (n - 1) / 2) * spread;
            const rx = (kind === "bague" ? 92 : 145) + off;
            const ry = (kind === "bague" ? 58 : 88) + off;
            const d = ringPath(200, 205, rx, ry, p.amp, p.k, i * 1.3);
            return (
              <g key={i}>
                <path d={d} stroke={c} strokeWidth={kind === "bague" ? 11 : 9} opacity={0.35} />
                <path d={d} stroke={c} strokeWidth={kind === "bague" ? 11 : 9} strokeDasharray={p.dash} />
              </g>
            );
          })}
          {beadHex && kind === "bracelet" && (
            <g>
              <Bead x={200} y={293} r={15} hex={beadHex} />
              <Bead x={132} y={272} r={7} hex={beadHex} />
              <Bead x={268} y={272} r={7} hex={beadHex} />
            </g>
          )}
          {beadHex && kind === "bague" && <Bead x={200} y={263} r={12} hex={beadHex} />}
        </g>
      )}
    </svg>
  );
}
