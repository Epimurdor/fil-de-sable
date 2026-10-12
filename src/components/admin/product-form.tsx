"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/forms/submit-button";
import { saveProduct, type AdminState } from "@/lib/admin/actions";
import { site } from "@/config/site";
import { cn } from "@/lib/cn";
import type { Supply } from "@/lib/supplies";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price: string;
  leadTimeDays: number;
  categoryId: string;
  colors: string[];
  beads: string[];
  imageUrl: string;
  optionsText: string;
  isActive: boolean;
  isFeatured: boolean;
  isCustomizable: boolean;
};

const empty: ProductFormValues = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  price: "",
  leadTimeDays: 5,
  categoryId: "",
  colors: [],
  beads: [],
  imageUrl: "",
  optionsText: "",
  isActive: true,
  isFeatured: false,
  isCustomizable: false,
};

export function ProductForm({
  categories,
  photos,
  threads,
  beads,
  product,
}: {
  categories: { id: string; name: string }[];
  photos: string[];
  threads: Supply[];
  beads: Supply[];
  product?: ProductFormValues;
}) {
  const [state, action] = useActionState<AdminState, FormData>(saveProduct, {});
  const v = product ?? { ...empty, categoryId: categories[0]?.id ?? "" };
  const [photo, setPhoto] = useState(v.imageUrl);
  const photoList = photo && !photos.includes(photo) ? [photo, ...photos] : photos;

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_340px]">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <div className="space-y-5 rounded-lg border border-line bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name">Nom</label>
            <input id="name" name="name" className="field" defaultValue={v.name} required />
          </div>
          <div>
            <label className="label" htmlFor="slug">Slug (URL)</label>
            <input id="slug" name="slug" className="field" defaultValue={v.slug} placeholder="perle-d-ecume" required />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="tagline">Accroche</label>
          <input id="tagline" name="tagline" className="field" defaultValue={v.tagline} />
        </div>
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={5} className="field" defaultValue={v.description} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="price">Prix (€)</label>
            <input id="price" name="price" className="field" defaultValue={v.price} inputMode="decimal" placeholder="22,00" required />
          </div>
          <div>
            <label className="label" htmlFor="leadTimeDays">Délai de confection (jours)</label>
            <input id="leadTimeDays" name="leadTimeDays" type="number" min={1} max={90} className="field" defaultValue={v.leadTimeDays} required />
          </div>
          <div>
            <label className="label" htmlFor="categoryId">Catégorie</label>
            <select id="categoryId" name="categoryId" className="field" defaultValue={v.categoryId}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <SupplyPicker name="colors" label="Fils" hint="coche les couleurs de la pièce, dans l'ordre" empty="Aucun fil en stock : ajoute tes couleurs dans l'onglet « Stock »." supplies={threads} initial={v.colors} />
        <SupplyPicker name="beads" label="Perles" hint="laisse vide s'il n'y en a pas" empty="Aucune perle en stock : ajoute-les dans l'onglet « Stock »." supplies={beads} initial={v.beads} />

        <fieldset>
          <legend className="label">
            Photo <span className="font-normal text-ink-3">· dépose tes images dans <code>public/images/produits</code>, elles apparaissent ici</span>
          </legend>
          <input type="hidden" name="imageUrl" value={photo} />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            <button
              type="button"
              onClick={() => setPhoto("")}
              aria-pressed={photo === ""}
              className={cn(
                "flex aspect-[4/5] items-center justify-center rounded-lg border bg-paper-2 px-2 text-center text-xs text-ink-3 transition-[border-color,box-shadow] duration-200",
                photo === "" ? "border-accent ring-2 ring-accent/15" : "border-line-2 hover:border-accent-strong",
              )}
            >
              Sans photo
            </button>
            {photoList.map((src) => {
              const active = photo === src;
              const file = src.split("/").pop() ?? src;
              return (
                <button
                  type="button"
                  key={src}
                  onClick={() => setPhoto(src)}
                  aria-pressed={active}
                  title={file}
                  className={cn(
                    "relative aspect-[4/5] overflow-hidden rounded-lg border transition-[border-color,box-shadow] duration-200",
                    active ? "border-accent ring-2 ring-accent/15" : "border-line-2 hover:border-accent-strong",
                  )}
                >
                  <Image src={src} alt={file} fill sizes="160px" className="object-cover" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-ink/60 px-1.5 py-1 text-left text-[11px] text-paper">{file}</span>
                </button>
              );
            })}
          </div>
          {photos.length === 0 && <p className="mt-2 text-xs text-ink-3">Aucune image trouvée dans le dossier pour le moment.</p>}
        </fieldset>

        <div>
          <label className="label" htmlFor="optionsText">Options <span className="font-normal text-ink-3">(une par ligne)</span></label>
          <textarea
            id="optionsText"
            name="optionsText"
            rows={4}
            className="field font-mono text-sm"
            defaultValue={v.optionsText}
            placeholder={"Taille de poignet: S=S · 14 à 15 cm, M=M · 15 à 17 cm, L=L · 17 à 19 cm\nPerle: aucune=Sans perle, bois=Perle en bois (+2), lave=Pierre de lave (+4)"}
          />
          <p className="mt-1 text-xs text-ink-3">Format : <code>Nom: valeur=Libellé (+supplément), valeur2=Libellé 2</code></p>
        </div>
      </div>

      <aside className="h-fit space-y-4 rounded-lg border border-line bg-white p-6 lg:sticky lg:top-24">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={v.isActive} className="h-4 w-4 accent-accent" /> Visible dans la boutique</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isFeatured" defaultChecked={v.isFeatured} className="h-4 w-4 accent-accent" /> À la une sur l'accueil</label>
        {site.customEnabled ? (
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isCustomizable" defaultChecked={v.isCustomizable} className="h-4 w-4 accent-accent" /> Produit du configurateur</label>
        ) : (
          v.isCustomizable && <input type="hidden" name="isCustomizable" value="on" />
        )}
        {state.error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</p>}
        <SubmitButton pendingText="Enregistrement…" className="w-full">{v.id ? "Enregistrer" : "Créer le produit"}</SubmitButton>
      </aside>
    </form>
  );
}

// Cases à cocher sur le stock. Une fourniture enregistrée sur le produit mais sortie du stock reste
// cochable, pour ne rien perdre à la modification.
function SupplyPicker({
  name,
  label,
  hint,
  empty,
  supplies,
  initial,
}: {
  name: string;
  label: string;
  hint: string;
  empty: string;
  supplies: Supply[];
  initial: string[];
}) {
  const [picked, setPicked] = useState<string[]>(initial);
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const known = new Set(supplies.map((s) => s.hex.toLowerCase()));
  const palette = [
    ...supplies.map(({ id, name, hex }) => ({ code: id, name, hex })),
    ...initial.filter((h) => !known.has(h.toLowerCase())).map((hex) => ({ code: hex, name: `${hex} (hors stock)`, hex })),
  ];
  const nameOf = (hex: string) => palette.find((c) => same(c.hex, hex))?.name ?? hex;

  function toggle(hex: string) {
    setPicked((c) => (c.some((x) => same(x, hex)) ? c.filter((x) => !same(x, hex)) : [...c, hex]));
  }

  return (
    <fieldset>
      <legend className="label">
        {label} <span className="font-normal text-ink-3">· {picked.length ? picked.map(nameOf).join(", ") : hint}</span>
      </legend>
      {supplies.length === 0 && <p className="mb-2 text-xs text-ink-3">{empty}</p>}
      {picked.map((hex) => (
        <input key={hex} type="hidden" name={name} value={hex} />
      ))}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {palette.map((c) => {
          const order = picked.findIndex((h) => same(h, c.hex));
          const active = order >= 0;
          return (
            <button
              type="button"
              key={c.code}
              onClick={() => toggle(c.hex)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-2.5 rounded-lg border bg-white px-3 py-2 text-left text-sm transition-[border-color,box-shadow] duration-200",
                active ? "border-accent ring-2 ring-accent/15" : "border-line-2 hover:border-accent-strong",
              )}
            >
              <span className="h-6 w-6 shrink-0 rounded-full ring-1 ring-ink/15" style={{ backgroundColor: c.hex }} />
              <span className="text-ink">{c.name}</span>
              {active && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-ink">
                  {order + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
