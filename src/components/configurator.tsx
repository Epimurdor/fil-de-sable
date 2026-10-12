"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/forms/submit-button";
import { ProductVisual } from "@/components/product-visual";
import { addCustomBracelet, type CartActionState } from "@/lib/cart/actions";
import { cn } from "@/lib/cn";
import { BEADS, DEFAULT_CONFIG, PATTERNS, SIZES, THREAD_PALETTE, customPriceCents, describeConfig } from "@/lib/configurator";
import { formatPrice } from "@/lib/format";
import type { CustomConfig } from "@/lib/types";

const chip = (active: boolean) =>
  cn(
    "rounded-full border px-4 py-2 text-sm transition-[color,background-color,border-color,box-shadow] duration-200",
    active ? "border-accent bg-accent text-ink shadow-soft" : "border-line-2 bg-white text-ink-2 hover:border-accent-strong hover:text-ink",
  );

function Step({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg text-ink">
        {title}
        {hint && <span className="ml-3 text-sm font-normal text-ink-3">{hint}</span>}
      </h2>
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

      <div className="lg:sticky lg:top-6 lg:self-start">
        <ProductVisual
          sketch
          colors={config.threads}
          beadHex={bead?.hex ?? null}
          pattern={config.pattern}
          alt="Croquis de ton bracelet"
          className="aspect-square rounded-2xl shadow-soft"
        />
        <p className="mt-2 text-xs text-ink-3">Un croquis, pas une photo : le vrai est noué à la main.</p>
        <div className="mt-5 border-t border-line pt-5">
          <div className="flex items-baseline justify-between">
            <p className="text-lg font-medium text-ink">Ton bracelet</p>
            <p className="font-display text-2xl text-accent-strong">{formatPrice(price)}</p>
          </div>
          <ul className="mt-2 text-sm text-ink-2">
            {describeConfig(config).map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-3">Noué sous {leadTimeDays} jours, puis expédié.</p>
          {state.error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</p>}
          <SubmitButton pendingText="Ajout au panier…" className="mt-4 w-full">
            Ajouter au panier · {formatPrice(price)}
          </SubmitButton>
        </div>
      </div>

      <div className="space-y-10">
        <Step title="Les fils" hint={`${config.threads.length} sur 3, chaque fil en plus : +1 €`}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                    "flex items-center gap-2.5 rounded-lg border bg-white px-3 py-2 text-left text-sm transition-[border-color,box-shadow] duration-200",
                    active ? "border-accent ring-2 ring-accent/15" : "border-line-2 hover:border-accent",
                  )}
                >
                  <span className="h-6 w-6 shrink-0 rounded-full ring-1 ring-ink/15" style={{ backgroundColor: t.hex }} />
                  <span className="text-ink">{t.name}</span>
                  {active && <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-ink">{order + 1}</span>}
                </button>
              );
            })}
          </div>
        </Step>

        <Step title="La perle">
          <div className="flex flex-wrap gap-2">
            {BEADS.map((b) => {
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
                  onClick={() => setConfig((c) => ({ ...c, pattern: p.code }))}
                  aria-pressed={active}
                  className={cn(
                    "rounded-lg border bg-white p-4 text-left transition-[border-color,box-shadow] duration-200",
                    active ? "border-accent ring-2 ring-accent/15" : "border-line-2 hover:border-accent",
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
