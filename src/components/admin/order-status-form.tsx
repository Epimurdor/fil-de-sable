"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/forms/submit-button";
import { updateOrderStatus, type AdminState } from "@/lib/admin/actions";
import { ORDER_STATUSES, STATUS_INFO } from "@/lib/orders/status";

export function OrderStatusForm({ orderId, current }: { orderId: string; current: string }) {
  const [state, action] = useActionState<AdminState, FormData>(updateOrderStatus, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label className="label" htmlFor="status">Statut</label>
        <select id="status" name="status" defaultValue={current} className="field">
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_INFO[s].label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="note">Note pour le client <span className="font-normal text-ink-3">(facultatif)</span></label>
        <input id="note" name="note" className="field" placeholder="Ex : numéro de suivi, précision sur la perle…" />
      </div>
      {state.error && <p role="alert" className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</p>}
      {state.success && <p className="rounded-md bg-accent-soft px-4 py-2 text-sm text-accent-strong">{state.success}</p>}
      <SubmitButton pendingText="Mise à jour…" variant="dark" className="w-full">Mettre à jour</SubmitButton>
    </form>
  );
}
