"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { SubmitButton } from "@/components/forms/submit-button";
import { ProductVisual } from "@/components/product-visual";
import { addCustomBracelet, type CartActionState } from "@/lib/cart/actions";
import { cn } from "@/lib/cn";
import { BEADS, DEFAULT_CONFIG, PATTERNS, SIZES, THREAD_PALETTE, customPriceCents, describeConfig } from "@/lib/configurator";
import { formatPrice } from "@/lib/format";
import type { CustomConfig } from "@/lib/types";

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline gap-3">
        <span className="font-display text-2xl font-semibold text-terracotta-500/70">0{n}</span>
        <h2 className="font-display text-xl font-semibold text-bark-900">{title}</h2>
        {hint && <span className="text-sm text-bark-500">{hint}</span>}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function Configurator({ basePriceCents, leadTimeDays }: { basePriceCents: number; leadTimeDays: number }) {
  const [config, setConfig] = useState<CustomConfig>(DEFAULT_CONFIG);
  const [state, action] = useActionState<CartActionState, FormData>(addCustomBracelet, {});
  const price = customPriceCents(basePriceCents, config);
  const bead = BEADS.find((b) => b.code === config.bead);

  function toggleThread(hex: string) {
    setConfig((c) => {
      if (c.threads.includes(hex)) {
        return c.threads.length > 1 ? { ...c, threads: c.threads.filter((t) => t !== hex) } : c;
      }
      return c.threads.length >= 3 ? c : { ...c, threads: [...c.threads, hex] };
    });
  }

  return (
    <form action={action} className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
      <input type="hidden" name="config" value={JSON.stringify(config)} />

      <div className="lg:sticky lg:top-24 lg:self-start">
        <ProductVisual
          colors={config.threads}
          beadHex={bead?.hex ?? null}
          pattern={config.pattern}
          alt="Aperçu de ton bracelet"
          className="blob-a aspect-square shadow-soft"
        />
        <div className="mt-5 rounded-3xl border border-sand-200 bg-white/70 p-5">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-xl font-semibold text-bark-900">Ton bracelet</p>
            <p className="font-display text-2xl font-semibold text-bark-900">{formatPrice(price)}</p>
          </div>
          <ul className="mt-2 text-sm text-bark-700">
            {describeConfig(config).map((d) => <li key={d}>{d}</li>)}
          </ul>
          <p className="mt-3 text-xs text-sage-700">Noué sous {leadTimeDays} jours, puis expédié.</p>
          {state.error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</p>}
          <SubmitButton pendingText="Ajout au panier…" className="mt-4 w-full">
            Ajouter au panier · {formatPrice(price)}
          </SubmitButton>
        </div>
      </div>

      <div className="space-y-10">
        <Step n={1} title="Les fils" hint={`${config.threads.length}/3 · chaque fil en plus : +1 €`}>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {THREAD_PALETTE.map((t) => {
              const active = config.threads.includes(t.hex);
              const order = config.threads.indexOf(t.hex);
              return (
                <button
                  type="button"
                  key={t.code}
                  onClick={() => toggleThread(t.hex)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-2.5 rounded-2xl border bg-white px-3 py-2 text-left text-sm transition",
                    active ? "border-bark-900 ring-2 ring-bark-900/10" : "border-sand-300 hover:border-bark-500",
                  )}
                >
                  <span className="relative h-7 w-7 shrink-0 rounded-full ring-1 ring-bark-800/15" style={{ backgroundColor: t.hex }}>
                    {active && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-bark-900 text-[10px] font-bold text-white">
                        {order + 1}
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-bark-800">{t.name}</span>
                </button>
              );
            })}
          </div>
        </Step>

        <Step n={2} title="La perle">
          <div className="flex flex-wrap gap-2">
            {BEADS.map((b) => {
              const active = config.bead === b.code;
              return (
                <button
                  type="button"
                  key={b.code}
                  onClick={() => setConfig((c) => ({ ...c, bead: b.code }))}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                    active ? "border-bark-900 bg-bark-900 text-sand-50" : "border-sand-300 bg-white text-bark-700 hover:border-bark-500",
                  )}
                >
                  {b.hex ? (
                    <span className="h-4 w-4 rounded-full ring-1 ring-white/60" style={{ backgroundColor: b.hex }} />
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-dashed border-current opacity-60" />
                  )}
                  {b.name}
                  {b.priceDeltaCents > 0 && <span className="opacity-70">+{formatPrice(b.priceDeltaCents)}</span>}
                </button>
              );
            })}
          </div>
        </Step>

        <Step n={3} title="Le motif">
          <div className="grid gap-2 sm:grid-cols-3">
            {PATTERNS.map((p) => {
              const active = config.pattern === p.code;
              return (
                <button
                  type="button"
                  key={p.code}
                  onClick={() => setConfig((c) => ({ ...c, pattern: p.code }))}
                  aria-pressed={active}
                  className={cn(
                    "rounded-2xl border bg-white p-4 text-left transition",
                    active ? "border-bark-900 ring-2 ring-bark-900/10" : "border-sand-300 hover:border-bark-500",
                  )}
                >
                  <span className="flex items-center justify-between font-semibold text-bark-900">
                    {p.name}
                    {active && <Check className="h-4 w-4 text-terracotta-600" aria-hidden />}
                  </span>
                  <span className="mt-1 block text-sm text-bark-500">{p.description}</span>
                </button>
              );
            })}
          </div>
        </Step>

        <Step n={4} title="La taille" hint="nœud coulissant, ajustable de quelques centimètres">
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => {
              const active = config.size === s.code;
              return (
                <button
                  type="button"
                  key={s.code}
                  onClick={() => setConfig((c) => ({ ...c, size: s.code }))}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition",
                    active ? "border-bark-900 bg-bark-900 text-sand-50" : "border-sand-300 bg-white text-bark-700 hover:border-bark-500",
                  )}
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
