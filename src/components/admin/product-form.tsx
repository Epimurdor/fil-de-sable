"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/forms/submit-button";
import { saveProduct, type AdminState } from "@/lib/admin/actions";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price: string;
  leadTimeDays: number;
  categoryId: string;
  colors: string;
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
  colors: "",
  imageUrl: "",
  optionsText: "",
  isActive: true,
  isFeatured: false,
  isCustomizable: false,
};

export function ProductForm({
  categories,
  product,
}: {
  categories: { id: string; name: string }[];
  product?: ProductFormValues;
}) {
  const [state, action] = useActionState<AdminState, FormData>(saveProduct, {});
  const v = product ?? { ...empty, categoryId: categories[0]?.id ?? "" };

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
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="colors">Couleurs des fils <span className="font-normal text-ink-3">(hex, séparées par des virgules)</span></label>
            <input id="colors" name="colors" className="field" defaultValue={v.colors} placeholder="#4F6478, #F2EFE6" />
          </div>
          <div>
            <label className="label" htmlFor="imageUrl">Photo <span className="font-normal text-ink-3">(chemin dans /public)</span></label>
            <input id="imageUrl" name="imageUrl" className="field" defaultValue={v.imageUrl} placeholder="/images/produits/mon-bracelet.jpg" />
          </div>
        </div>
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
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isCustomizable" defaultChecked={v.isCustomizable} className="h-4 w-4 accent-accent" /> Produit du configurateur</label>
        {state.error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{state.error}</p>}
        <SubmitButton pendingText="Enregistrement…" className="w-full">{v.id ? "Enregistrer" : "Créer le produit"}</SubmitButton>
      </aside>
    </form>
  );
}
