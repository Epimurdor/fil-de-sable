"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/forms/submit-button";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { placeOrder, type CheckoutState } from "@/lib/orders/actions";

type Method = { code: string; name: string; description: string | null; priceCents: number };
type Item = { id: string; name: string; quantity: number; unitPriceCents: number };

export function CheckoutForm({
  defaults,
  methods,
  items,
  subtotalCents,
  leadTimeDays,
}: {
  defaults: { fullName: string; line1: string; line2: string; postalCode: string; city: string; phone: string };
  methods: Method[];
  items: Item[];
  subtotalCents: number;
  leadTimeDays: number;
}) {
  const [state, action] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const [shippingCode, setShippingCode] = useState(methods[0]?.code ?? "");
  const shipping = methods.find((m) => m.code === shippingCode);
  const totalCents = subtotalCents + (shipping?.priceCents ?? 0);

  return (
    <form action={action} className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-medium text-ink">Adresse de livraison</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="fullName">Nom complet</label>
              <input id="fullName" name="fullName" className="field" defaultValue={defaults.fullName} autoComplete="name" required />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="line1">Adresse</label>
              <input id="line1" name="line1" className="field" defaultValue={defaults.line1} autoComplete="address-line1" required />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="line2">Complément <span className="font-normal text-ink-3">(facultatif)</span></label>
              <input id="line2" name="line2" className="field" defaultValue={defaults.line2} autoComplete="address-line2" />
            </div>
            <div>
              <label className="label" htmlFor="postalCode">Code postal</label>
              <input id="postalCode" name="postalCode" className="field" defaultValue={defaults.postalCode} inputMode="numeric" autoComplete="postal-code" required />
            </div>
            <div>
              <label className="label" htmlFor="city">Ville</label>
              <input id="city" name="city" className="field" defaultValue={defaults.city} autoComplete="address-level2" required />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="phone">Téléphone <span className="font-normal text-ink-3">(pour le transporteur)</span></label>
              <input id="phone" name="phone" className="field" defaultValue={defaults.phone} autoComplete="tel" />
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" name="saveAddress" defaultChecked className="h-4 w-4 rounded border-line-2 accent-accent" />
            Retenir cette adresse pour la prochaine fois
          </label>
        </section>

        <section>
          <h2 className="text-xl font-medium text-ink">Livraison</h2>
          <div className="mt-4 space-y-3">
            {methods.map((m) => {
              const active = m.code === shippingCode;
              return (
                <label
                  key={m.code}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-4 rounded-lg border bg-white px-4 py-3 transition",
                    active ? "border-accent ring-2 ring-accent/15" : "border-line-2 hover:border-accent",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shippingCode"
                      value={m.code}
                      checked={active}
                      onChange={() => setShippingCode(m.code)}
                      className="h-4 w-4 accent-accent"
                    />
                    <span>
                      <span className="block font-semibold text-ink">{m.name}</span>
                      {m.description && <span className="block text-sm text-ink-3">{m.description}</span>}
                    </span>
                  </span>
                  <span className="font-semibold text-ink">{m.priceCents === 0 ? "Offerte" : formatPrice(m.priceCents)}</span>
                </label>
              );
            })}
          </div>
        </section>

        <section>
          <label className="label" htmlFor="customerNote">Un mot pour l'atelier <span className="font-normal text-ink-3">(facultatif)</span></label>
          <textarea id="customerNote" name="customerNote" rows={3} className="field" placeholder="Un cadeau ? Une précision sur la taille ?" />
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-line bg-white/70 p-6 shadow-soft lg:sticky lg:top-24">
        <h2 className="text-lg font-medium text-ink">Ta commande</h2>
        <ul className="mt-4 divide-y divide-line text-sm">
          {items.map((it) => (
            <li key={it.id} className="flex justify-between py-2">
              <span className="text-ink-2">{it.quantity} × {it.name}</span>
              <span className="font-semibold">{formatPrice(it.unitPriceCents * it.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-ink-3">Sous-total</dt><dd>{formatPrice(subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-3">Livraison</dt><dd>{shipping ? (shipping.priceCents === 0 ? "Offerte" : formatPrice(shipping.priceCents)) : "—"}</dd></div>
          <div className="flex justify-between text-base font-semibold text-ink"><dt>Total</dt><dd>{formatPrice(totalCents)}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-ink-3">Confection : {leadTimeDays} jours, puis expédition.</p>
        {state.error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        <SubmitButton pendingText="Création de la commande…" className="mt-5 w-full">
          Continuer vers le paiement
        </SubmitButton>
        <p className="mt-3 text-center text-xs text-ink-3">Paiement simulé pendant la phase de développement.</p>
      </aside>
    </form>
  );
}
