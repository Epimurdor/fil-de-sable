"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { SubmitButton } from "@/components/forms/submit-button";
import { deleteSupply, saveSupply, type AdminState } from "@/lib/admin/actions";
import { cn } from "@/lib/cn";
import type { Supply, SupplyKind } from "@/lib/supplies";

function SupplyRow({ kind, unit, supply }: { kind: SupplyKind; unit: string; supply?: Supply }) {
  const [state, action] = useActionState<AdminState, FormData>(saveSupply, {});
  const isNew = !supply;
  return (
    <form
      action={action}
      className={cn(
        "grid items-center gap-3 rounded-lg border bg-white px-4 py-3 sm:grid-cols-[auto_minmax(10rem,1fr)_auto_auto_auto]",
        isNew ? "border-dashed border-line-2" : "border-line",
        supply && supply.quantity === 0 && "opacity-70",
      )}
    >
      <input type="hidden" name="kind" value={kind} />
      {supply && <input type="hidden" name="id" value={supply.id} />}
      <label className="flex items-center gap-2">
        <span className="sr-only">Couleur</span>
        <input
          type="color"
          name="hex"
          defaultValue={supply?.hex ?? "#CFA96A"}
          className="h-9 w-9 cursor-pointer rounded-full border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch-wrapper]:p-0"
        />
      </label>
      <input name="name" defaultValue={supply?.name ?? ""} placeholder={kind === "fil" ? "Nom de la couleur" : "Nom de la perle"} className="field" required />
      <label className="flex items-center gap-2 text-sm text-ink-2" title={unit}>
        Stock
        <input type="number" name="quantity" min={0} defaultValue={supply?.quantity ?? 1} className="field w-20 text-center" required />
      </label>
      <SubmitButton pendingText="…" variant={isNew ? "primary" : "secondary"} className="px-4 py-2">
        {isNew ? "Ajouter" : "Enregistrer"}
      </SubmitButton>
      {supply ? (
        <button
          type="submit"
          formAction={deleteSupply}
          className="rounded-full p-2 text-ink-3 transition-colors hover:bg-red-50 hover:text-red-700"
          aria-label={`Supprimer ${supply.name}`}
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <span />
      )}
      {(state.error || state.success) && (
        <p role={state.error ? "alert" : "status"} className={cn("text-xs sm:col-span-5", state.error ? "text-red-700" : "text-accent-strong")}>
          {state.error ?? state.success}
        </p>
      )}
    </form>
  );
}

export function SupplyStock({ kind, unit, supplies }: { kind: SupplyKind; unit: string; supplies: Supply[] }) {
  return (
    <div className="space-y-2">
      {supplies.map((s) => (
        <SupplyRow key={s.id} kind={kind} unit={unit} supply={s} />
      ))}
      {supplies.length === 0 && <p className="text-sm text-ink-3">Rien pour le moment : ajoute ta première référence ci-dessous.</p>}
      <SupplyRow kind={kind} unit={unit} />
    </div>
  );
}
