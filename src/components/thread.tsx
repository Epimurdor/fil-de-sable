import { cn } from "@/lib/cn";

// Un fil ciré qui ondule et se noue en son milieu : séparateur dessiné « à la main »
// (tracé volontairement irrégulier). Couleur héritée via currentColor.
export function Thread({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 24"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={cn("h-6 w-full text-sand-deep", className)}
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M2 13 C 40 9, 70 16, 110 12 S 180 8, 220 13 S 262 15, 282 12"
          strokeWidth="1.6"
        />
        {/* Le nœud : une boucle serrée, un brin qui dépasse. */}
        <path
          d="M282 12 C 290 3, 304 4, 302 12 C 300 19, 286 18, 292 11 C 296 7, 306 9, 314 12"
          strokeWidth="1.8"
        />
        <path d="M296 15 l -3 6" strokeWidth="1.4" />
        <path
          d="M314 12 C 340 16, 372 9, 410 12 S 480 16, 520 11 S 570 10, 598 13"
          strokeWidth="1.6"
        />
      </g>
    </svg>
  );
}
