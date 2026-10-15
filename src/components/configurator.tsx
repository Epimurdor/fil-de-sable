"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/forms/submit-button";
import { PhotoRecolor } from "@/components/photo-recolor";
import { ProductVisual } from "@/components/product-visual";
import { addCustomBracelet, type CartActionState } from "@/lib/cart/actions";
import { cn } from "@/lib/cn";
import {
  BEADS,
  DEFAULT_CONFIG,
  PATTERNS,
  PATTERN_MODELS,
  PATTERN_PHOTOS,
  SIZES,
  beadsForPattern,
  customPriceCents,
  describeConfig,
} from "@/lib/configurator";
import { formatPrice } from "@/lib/format";
import { threadLabel, threadRef, type ThreadOption } from "@/lib/threads/labels";
import type { CustomConfig } from "@/lib/types";

// three.js (~600 Ko) chargé seulement côté client, quand l'aperçu 3D s'affiche.
const Bracelet3D = dynamic(() => import("@/components/bracelet-3d"), {
  ssr: false,
  loading: () => <div className="aspect-square rounded-md bg-paper-2" />,
});

const chip = (active: boolean) =>
  cn(
    "rounded-md border px-3.5 py-2 text-sm transition-colors",
    active ? "border-ink bg-ink text-paper" : "border-line-2 bg-card text-ink-2 hover:border-ink",
  );

function Step({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-medium text-ink">
        {title}
        {hint && <span className="ml-3 text-sm font-normal text-ink-3">{hint}</span>}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

// threads (HEX de l'aperçu) et threadLabels suivent toujours threadCodes.
function withThreads(c: CustomConfig, codes: string[], palette: ThreadOption[]): CustomConfig {
  const picked = codes.map((code) => palette.find((t) => t.code === code)!).filter(Boolean);
  return { ...c, threadCodes: picked.map((t) => t.code), threads: picked.map((t) => t.hex), threadLabels: picked.map(threadLabel) };
}

export function Configurator({
  basePriceCents,
  leadTimeDays,
  threads: palette,
}: {
  basePriceCents: number;
  leadTimeDays: number;
  threads: ThreadOption[]; // bobines en stock uniquement
}) {
  const [config, setConfig] = useState<CustomConfig>(() => withThreads(DEFAULT_CONFIG, palette.slice(0, 1).map((t) => t.code), palette));
  const [state, action] = useActionState<CartActionState, FormData>(addCustomBracelet, {});
  const price = customPriceCents(basePriceCents, config);
  const bead = BEADS.find((b) => b.code === config.bead);
  const modelUrl = PATTERN_MODELS[config.pattern];
  const photo = PATTERN_PHOTOS[config.pattern];
  // Aperçu des motifs qui ont une photo et un modèle 3D : la photo d'abord.
  const [view, setView] = useState<"photo" | "3d">("photo");
  const codes = config.threadCodes ?? [];

  function toggleThread(code: string) {
    setConfig((c) => {
      const current = c.threadCodes ?? [];
      // Motif en 3D : un seul fil, la couleur choisie remplace la précédente.
      if (PATTERN_MODELS[c.pattern]) return withThreads(c, [code], palette);
      if (current.includes(code)) {
        return current.length > 1 ? withThreads(c, current.filter((t) => t !== code), palette) : c;
      }
      return current.length >= 3 ? c : withThreads(c, [...current, code], palette);
    });
  }

  return (
    <form action={action} className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
      <input type="hidden" name="config" value={JSON.stringify(config)} />

      <div className="lg:sticky lg:top-6 lg:self-start">
        {photo && modelUrl && (
          <div className="mb-3 inline-flex rounded-md border border-line-2 bg-card p-0.5 text-sm" role="group" aria-label="Type d'aperçu">
            {(["photo", "3d"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn("rounded px-3 py-1.5 transition-colors", view === v ? "bg-ink text-paper" : "text-ink-2 hover:text-ink")}
              >
                {v === "photo" ? "Photo" : "3D"}
              </button>
            ))}
          </div>
        )}
        {photo && (view === "photo" || !modelUrl) ? (
          <>
            <PhotoRecolor
              photo={photo}
              threadHex={config.threads[0]}
              metal={bead?.metal ?? "argent"}
              alt={`Photo du bracelet, fil et perles recolorés : ${describeConfig(config).join(", ")}`}
              className="aspect-[3/4] rounded-md"
            />
            <p className="mt-2 text-xs text-ink-3">
              Le vrai bracelet, repeint avec ton fil et tes perles. Les couleurs à l'écran restent approximatives.
            </p>
          </>
        ) : modelUrl ? (
          <>
            <Bracelet3D
              modelUrl={modelUrl}
              threadHex={config.threads[0]}
              metal={bead?.metal ?? "argent"}
              label={`Aperçu 3D de ton bracelet : ${describeConfig(config).join(", ")}`}
              className="aspect-square rounded-md"
            />
            <p className="mt-2 text-xs text-ink-3">Fais-le tourner du doigt. Le vrai est noué à la main.</p>
          </>
        ) : (
          <>
            <ProductVisual
              sketch
              colors={config.threads}
              beadHex={bead?.hex ?? null}
              pattern={config.pattern}
              alt="Croquis de ton bracelet"
              className="aspect-square rounded-md"
            />
            <p className="mt-2 text-xs text-ink-3">Un croquis, pas une photo : le vrai est noué à la main.</p>
          </>
        )}
        <div className="mt-5 border-t border-line pt-5">
          <div className="flex items-baseline justify-between">
            <p className="text-lg font-medium text-ink">Ton bracelet</p>
            <p className="text-xl text-ink">{formatPrice(price)}</p>
          </div>
          <ul className="mt-2 text-sm text-ink-2">
            {describeConfig(config).map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-3">Noué sous {leadTimeDays} jours, puis expédié.</p>
          {state.error && <p role="alert" className="mt-3 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</p>}
          <SubmitButton pendingText="Ajout au panier…" className="mt-4 w-full">
            Ajouter au panier · {formatPrice(price)}
          </SubmitButton>
        </div>
      </div>

      <div className="space-y-10">
        <Step
          title={modelUrl ? "Le fil" : "Les fils"}
          hint={modelUrl ? "une couleur, noué d'un seul fil" : `${config.threads.length} sur 3, chaque fil en plus : +1 €`}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {palette.map((t) => {
              const active = codes.includes(t.code);
              const order = codes.indexOf(t.code);
              return (
                <button
                  type="button"
                  key={t.code}
                  onClick={() => toggleThread(t.code)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md border bg-card px-3 py-2 text-left text-sm transition-colors",
                    active ? "border-ink" : "border-line-2 hover:border-ink",
                  )}
                >
                  <span className="h-6 w-6 shrink-0 rounded-full ring-1 ring-ink/15" style={{ backgroundColor: t.hex }} />
                  <span className="min-w-0">
                    <span className="block truncate text-ink">{t.shade}</span>
                    <span className="block truncate text-xs text-ink-3">{threadRef(t)}</span>
                  </span>
                  {active && !modelUrl && <span className="ml-auto text-xs text-ink-3">{order + 1}</span>}
                </button>
              );
            })}
          </div>
        </Step>

        <Step title={modelUrl ? "Les perles" : "La perle"} hint={modelUrl ? "dorées ou argentées, le fil garde sa couleur" : undefined}>
          <div className="flex flex-wrap gap-2">
            {beadsForPattern(config.pattern).map((b) => {
              const active = config.bead === b.code;
              return (
                <button
                  type="button"
                  key={b.code}
                  onClick={() => setConfig((c) => ({ ...c, bead: b.code }))}
                  aria-pressed={active}
                  className={cn(chip(active), "inline-flex items-center gap-2")}
                >
                  {b.hex && <span className="h-3.5 w-3.5 rounded-full ring-1 ring-white/60" style={{ backgroundColor: b.hex }} />}
                  {b.name}
                  {b.priceDeltaCents > 0 && <span className="opacity-70">+{formatPrice(b.priceDeltaCents)}</span>}
                </button>
              );
            })}
          </div>
        </Step>

        <Step title="Le motif">
          <div className="grid gap-2 sm:grid-cols-3">
            {PATTERNS.map((p) => {
              const active = config.pattern === p.code;
              return (
                <button
                  type="button"
                  key={p.code}
                  onClick={() =>
                    setConfig((c) => {
                      // Un motif en 3D n'accepte que des perles or ou argent : on bascule sur l'argent si besoin.
                      // ... et sur un seul fil.
                      const allowed = beadsForPattern(p.code).some((b) => b.code === c.bead);
                      const current = c.threadCodes ?? [];
                      const next = withThreads(c, PATTERN_MODELS[p.code] ? current.slice(0, 1) : current, palette);
                      return { ...next, pattern: p.code, bead: allowed ? c.bead : "argent" };
                    })
                  }
                  aria-pressed={active}
                  className={cn(
                    "rounded-md border bg-card p-4 text-left transition-colors",
                    active ? "border-ink" : "border-line-2 hover:border-ink",
                  )}
                >
                  <span className="block font-medium text-ink">{p.name}</span>
                  <span className="mt-1 block text-sm text-ink-3">{p.description}</span>
                </button>
              );
            })}
          </div>
        </Step>

        <Step title="La taille" hint="nœud coulissant, ajustable de quelques centimètres">
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => {
              const active = config.size === s.code;
              return (
                <button
                  type="button"
                  key={s.code}
                  onClick={() => setConfig((c) => ({ ...c, size: s.code }))}
                  aria-pressed={active}
                  className={chip(active)}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </Step>
      </div>
    </form>
  );
}
