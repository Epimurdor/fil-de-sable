"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { saveThreadStock, type AdminState } from "@/lib/admin/actions";
import { cn } from "@/lib/cn";
import { THREAD_RANGES, type ThreadOption } from "@/lib/threads/labels";

type Thread = ThreadOption & { inStock: boolean };

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function ThreadStockForm({ threads }: { threads: Thread[] }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveThreadStock, {});
  const [saved, setSaved] = useState(() => new Set(threads.filter((t) => t.inStock).map((t) => t.code)));
  const [stock, setStock] = useState(saved);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("");
  const [onlyStock, setOnlyStock] = useState(false);

  const dirty = stock.size !== saved.size || [...stock].some((c) => !saved.has(c));

  // Gamme puis famille, dans l'ordre de la cartelle (les coloris PE sont intercalés dans les familles
  // de la cartelle encerado : on les regroupe par gamme).
  const groups = useMemo(() => {
    const ranges = Object.keys(THREAD_RANGES);
    const byKey = new Map<string, { range: string; family: string; threads: Thread[] }>();
    for (const t of threads) {
      const key = `${t.range}-${t.family}`;
      const g = byKey.get(key) ?? { range: t.range, family: t.family, threads: [] };
      g.threads.push(t);
      byKey.set(key, g);
    }
    return [...byKey.values()].sort((a, b) => ranges.indexOf(a.range) - ranges.indexOf(b.range));
  }, [threads]);

  // Recherche par code Linhasita : « 224 » ou plusieurs codes « 224, 37 m19 » cherchent les numéros de
  // cartelle (exacts, ou début de numéro pendant la frappe) ; sinon texte libre (nom, teinte, HEX).
  const q = norm(query.trim());
  const terms = q.split(/[\s,;]+/).filter(Boolean);
  const byCode = terms.length > 0 && terms.every((w) => /^m?\d+$/.test(w));
  const matches = (t: Thread) => {
    if (!q) return true;
    if (byCode) {
      const ref = norm(t.ref ?? "");
      // « 4 » trouve aussi la bobine « 04 » de la cartelle.
      return terms.some((w) => ref === w.padStart(2, "0") || (terms.length > 1 ? ref === w : ref.startsWith(w)));
    }
    return norm(`${t.ref ?? ""} ${t.name ?? ""} ${t.shade} ${t.family} ${t.hex}`).includes(q);
  };
  const visible = (t: Thread) => (!range || t.range === range) && (!onlyStock || stock.has(t.code)) && matches(t);
  const results = q ? threads.filter(visible) : [];

  function toggle(codes: string[], on: boolean) {
    setStock((s) => {
      const next = new Set(s);
      for (const c of codes) {
        if (on) next.add(c);
        else next.delete(c);
      }
      return next;
    });
  }

  // Envoi sans `action={…}` sur le formulaire : React réinitialiserait les cases après l'envoi
  // (retour à leur état au chargement de la page) alors que l'état, lui, est conservé.
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const sent = new Set(formData.getAll("stock").map(String));
    startTransition(async () => {
      await action(formData);
      setSaved(sent);
    });
  }

  // Titre de gamme sur la première famille visible de chaque gamme.
  const shownGroups = groups.map((g) => ({ ...g, shown: g.threads.filter(visible).length }));
  const headed = new Set(
    Object.keys(THREAD_RANGES)
      .map((r) => shownGroups.find((g) => g.range === r && g.shown > 0))
      .filter(Boolean)
      .map((g) => `${g!.range}-${g!.family}`),
  );

  return (
    <form onSubmit={submit} className="mt-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label className="label" htmlFor="thread-search">Code Linhasita ou teinte</label>
          <input
            id="thread-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="224 · plusieurs codes : 224, 37, M19 · ou turquoise, #63A8…"
            className="field"
          />
        </div>
        {results.length > 0 && (
          <button
            type="button"
            onClick={() => toggle(results.map((t) => t.code), !results.every((t) => stock.has(t.code)))}
            className="rounded-md border border-line-2 bg-card px-3.5 py-2.5 text-sm text-ink-2 transition-colors hover:border-ink"
          >
            {results.every((t) => stock.has(t.code)) ? "Décocher" : "Cocher"} les {results.length} résultat{results.length > 1 ? "s" : ""}
          </button>
        )}
        <div>
          <label className="label" htmlFor="thread-range">Gamme</label>
          <select id="thread-range" value={range} onChange={(e) => setRange(e.target.value)} className="field">
            <option value="">Toutes les gammes</option>
            {Object.entries(THREAD_RANGES).map(([code, r]) => (
              <option key={code} value={code}>{r.label}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 py-2.5 text-sm text-ink-2">
          <input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} />
          Seulement mes bobines
        </label>
      </div>

      <div className="mt-6 space-y-8">
        {shownGroups.map((g) => {
          const key = `${g.range}-${g.family}`;
          const allOn = g.threads.every((t) => stock.has(t.code));
          return (
            <div key={key} className={cn(g.shown === 0 && "hidden")}>
              {headed.has(key) && (
                <h2 className="mb-2 border-b border-line pb-2 text-xl font-medium text-ink">{THREAD_RANGES[g.range]?.label ?? g.range}</h2>
              )}
              <div className="mt-4 flex items-baseline justify-between gap-3">
                <h3 className="font-medium text-ink">
                  {g.family}{" "}
                  <span className="text-sm font-normal text-ink-3">
                    {g.threads.filter((t) => stock.has(t.code)).length} / {g.threads.length}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => toggle(g.threads.map((t) => t.code), !allOn)}
                  className="text-xs text-ink-3 underline-offset-4 hover:text-ink hover:underline"
                >
                  {allOn ? "Tout décocher" : "Tout cocher"}
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {g.threads.map((t) => {
                  const on = stock.has(t.code);
                  // Les cases masquées par un filtre restent dans le formulaire : elles sont envoyées aussi.
                  return (
                    <label
                      key={t.code}
                      className={cn(
                        "flex cursor-pointer items-center gap-2.5 rounded-md border bg-card px-3 py-2 text-sm transition-colors",
                        on ? "border-ink" : "border-line-2 hover:border-ink",
                        !visible(t) && "hidden",
                      )}
                    >
                      <input type="checkbox" name="stock" value={t.code} checked={on} onChange={(e) => toggle([t.code], e.target.checked)} />
                      <span className="h-6 w-6 shrink-0 rounded-full ring-1 ring-ink/15" style={{ backgroundColor: t.hex }} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{t.ref ? `n° ${t.ref}` : t.name}{t.ref && t.name ? ` · ${t.name}` : ""}</span>
                        <span className="block truncate text-xs text-ink-3" title={t.note ?? undefined}>
                          {t.shade} · {t.hex}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
        {threads.every((t) => !visible(t)) && (
          <p className="rounded-md border border-dashed border-line-2 p-6 text-center text-sm text-ink-3">Aucun coloris ne correspond.</p>
        )}
      </div>

      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-3 border-t border-line bg-paper/95 py-4 backdrop-blur">
        <p className="mr-auto text-sm text-ink-2">
          <span className="font-medium text-ink">{stock.size}</span> bobine{stock.size > 1 ? "s" : ""} proposée{stock.size > 1 ? "s" : ""} au configurateur
          {dirty && <span className="ml-2 text-accent">· modifications non enregistrées</span>}
        </p>
        {state.error && <p role="alert" className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</p>}
        {state.success && !dirty && <p className="rounded-md bg-accent-soft px-4 py-2 text-sm text-accent-strong">{state.success}</p>}
        <Button type="submit" variant="dark" disabled={pending} aria-busy={pending}>
          {pending ? "Enregistrement…" : "Enregistrer le stock"}
        </Button>
      </div>
    </form>
  );
}
