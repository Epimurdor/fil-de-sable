"use client";

import { useActionState, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { SubmitButton } from "@/components/forms/submit-button";
import { addToCart, type CartActionState } from "@/lib/cart/actions";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import type { OptionValue } from "@/lib/types";

type Option = { name: string; required: boolean; values: OptionValue[] };

export function AddToCartForm({
  productId,
  basePriceCents,
  options,
}: {
  productId: string;
  basePriceCents: number;
  options: Option[];
}) {
  const [state, action] = useActionState<CartActionState, FormData>(addToCart, {});
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(options.map((o) => [o.name, o.values[0]?.value ?? ""])),
  );
  const [qty, setQty] = useState(1);

  const unit =
    basePriceCents +
    options.reduce((sum, o) => sum + (o.values.find((v) => v.value === selected[o.name])?.priceDeltaCents ?? 0), 0);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="productId" value={productId} />

      {options.map((o) => (
        <fieldset key={o.name}>
          <legend className="label">{o.name}</legend>
          <div className="flex flex-wrap gap-2">
            {o.values.map((v) => {
              const active = selected[o.name] === v.value;
              return (
                <label
                  key={v.value}
                  className={cn(
                    "cursor-pointer rounded-md border px-3.5 py-1.5 text-sm font-medium transition",
                    active ? "border-ink bg-ink text-paper" : "border-line-2 bg-white text-ink-2 hover:border-ink-3",
                  )}
                >
                  <input
                    type="radio"
                    name={`opt:${o.name}`}
                    value={v.value}
                    checked={active}
                    onChange={() => setSelected((s) => ({ ...s, [o.name]: v.value }))}
                    className="sr-only"
                  />
                  {v.label}
                  {v.priceDeltaCents > 0 && <span className="ml-1 opacity-70">+{formatPrice(v.priceDeltaCents)}</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center gap-4">
        <div className="inline-flex items-center rounded-md border border-line-2 bg-white">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 text-ink-2 hover:text-ink" aria-label="Moins">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(10, q + 1))} className="px-3 py-2 text-ink-2 hover:text-ink" aria-label="Plus">
            <Plus className="h-4 w-4" />
          </button>
          <input type="hidden" name="quantity" value={qty} />
        </div>
        <SubmitButton pendingText="Ajout au panier…" className="flex-1 sm:flex-none">
          Ajouter au panier · {formatPrice(unit * qty)}
        </SubmitButton>
      </div>

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
    </form>
  );
}
