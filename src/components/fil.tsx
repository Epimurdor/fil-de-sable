import { cn } from "@/lib/cn";

// Un bout de cordon torsadé : deux brins qui se croisent, un nœud à chaque croisement.
// Sert d'ornement sous les titres et entre les sections ; il se « noue » à l'affichage.

function strand(width: number, period: number, amp: number, phase: number): string {
  const steps = Math.round(width / 4);
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * width;
    const y = 10 + amp * Math.sin((x / period) * Math.PI * 2 + phase);
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
  }
  return d;
}

export function Fil({
  width = 160,
  color = "var(--color-accent)",
  second = "var(--color-slate)",
  className,
  animate = true,
}: {
  width?: number;
  color?: string;
  second?: string;
  className?: string;
  animate?: boolean;
}) {
  const period = 32;
  const knots = Array.from({ length: Math.floor(width / (period / 2)) - 1 }, (_, i) => (i + 1) * (period / 2));
  const draw = animate ? "animate-draw" : undefined;
  return (
    <svg viewBox={`-4 0 ${width + 8} 20`} width={width + 8} height={20} aria-hidden className={cn("block overflow-visible", className)}>
      <g fill="none" strokeLinecap="round" strokeWidth={2.2}>
        <path d={strand(width, period, 4, 0)} stroke={color} pathLength={1} strokeDasharray="1 1" className={draw} />
        <path d={strand(width, period, 4, Math.PI)} stroke={second} pathLength={1} strokeDasharray="1 1" className={draw} style={{ animationDelay: "0.15s" }} />
      </g>
      {knots.map((x, i) => (
        <ellipse
          key={x}
          cx={x}
          cy={10}
          rx={2.6}
          ry={3.4}
          fill={i % 2 ? second : color}
          className={animate ? "animate-rise" : undefined}
          style={animate ? { animationDelay: `${0.4 + (x / width) * 1.1}s` } : undefined}
        />
      ))}
    </svg>
  );
}
