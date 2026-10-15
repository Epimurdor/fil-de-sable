"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { isLocalImagePath } from "@/lib/images";
import { isOrderStatus } from "@/lib/orders/status";
import { parseOptionsText } from "./options-text";

export type AdminState = { error?: string; success?: string };

const productSchema = z.object({
  id: z.string().max(50).optional(),
  name: z.string().trim().min(1, "Nom requis.").max(120, "Nom trop long (120 caractères max)."),
  slug: z
    .string()
    .trim()
    .max(100, "Slug trop long (100 caractères max).")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug : minuscules, chiffres et tirets uniquement."),
  tagline: z.string().trim().max(160).optional(),
  description: z.string().trim().min(10, "Description trop courte.").max(3000, "Description trop longue (3000 caractères max)."),
  price: z.string().trim().regex(/^\d{1,5}([.,]\d{1,2})?$/, "Prix invalide (ex : 22 ou 22,50, max 99999,99 €)."),
  leadTimeDays: z.coerce.number().int().min(1, "Délai minimum : 1 jour.").max(90),
  categoryId: z.string().min(1, "Catégorie requise.").max(50),
  colors: z.string().trim().max(500).optional(),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || isLocalImagePath(v), "Photo : chemin local du type /images/produits/mon-bracelet.jpg (jpg, png, webp, avif).")
    .optional(),
  optionsText: z.string().max(5000, "Texte d'options trop long (5000 caractères max).").optional(),
  isActive: z.string().optional(),
  isFeatured: z.string().optional(),
  isCustomizable: z.string().optional(),
  threadChoice: z.string().optional(),
});

function toCents(price: string): number {
  return Math.round(parseFloat(price.replace(",", ".")) * 100);
}

function parseColorList(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(/[\s,;]+/)
    .map((c) => c.trim())
    .filter((c) => /^#[0-9a-f]{6}$/i.test(c));
}

export async function saveProduct(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const d = parsed.data;

  const options = parseOptionsText(d.optionsText ?? "");
  if (!options.ok) return { error: options.error };

  const slugTaken = await prisma.product.findFirst({
    where: { slug: d.slug, ...(d.id ? { NOT: { id: d.id } } : {}) },
    select: { id: true },
  });
  if (slugTaken) return { error: "Ce slug est déjà utilisé par un autre produit." };

  const data = {
    name: d.name,
    slug: d.slug,
    tagline: d.tagline || null,
    description: d.description,
    priceCents: toCents(d.price),
    leadTimeDays: d.leadTimeDays,
    categoryId: d.categoryId,
    colors: JSON.stringify(parseColorList(d.colors)),
    imageUrl: d.imageUrl || null,
    isActive: d.isActive === "on",
    isFeatured: d.isFeatured === "on",
    isCustomizable: d.isCustomizable === "on",
    threadChoice: d.threadChoice === "on",
  };

  const product = d.id
    ? await prisma.product.update({ where: { id: d.id }, data })
    : await prisma.product.create({ data });

  await prisma.$transaction([
    prisma.productOption.deleteMany({ where: { productId: product.id } }),
    ...options.options.map((o, i) =>
      prisma.productOption.create({
        data: { productId: product.id, name: o.name, values: JSON.stringify(o.values), required: true, sortOrder: i },
      }),
    ),
  ]);

  revalidatePath("/", "layout");
  redirect("/admin/produits");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.product.deleteMany({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/admin/produits");
}

// Stock de fil : les cases cochées (name="stock") deviennent les seules bobines proposées au configurateur.
export async function saveThreadStock(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const codes = [...new Set(formData.getAll("stock").map(String))].filter((c) => /^[a-z0-9-]{1,60}$/.test(c));
  if (codes.length > 1000) return { error: "Trop de bobines cochées." };

  const [, stocked] = await prisma.$transaction([
    prisma.threadColor.updateMany({ where: { inStock: true, code: { notIn: codes } }, data: { inStock: false } }),
    prisma.threadColor.updateMany({ where: { code: { in: codes } }, data: { inStock: true } }),
  ]);

  // Configurateur et fiches articles (« Couleur du fil ») lisent le stock.
  revalidatePath("/", "layout");
  return { success: `Stock enregistré : ${codes.length === 0 ? "aucune bobine" : `${codes.length} bobine${codes.length > 1 ? "s" : ""}`} proposée${codes.length > 1 ? "s" : ""} au configurateur.${stocked.count < codes.length ? " (Des coloris inconnus ont été ignorés.)" : ""}` };
}

export async function updateOrderStatus(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
  if (note && note.length > 500) return { error: "Note trop longue (500 caractères max)." };
  if (!isOrderStatus(status)) return { error: "Statut inconnu." };

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) return { error: "Commande introuvable." };

  await prisma.$transaction([
    prisma.order.update({ where: { id: orderId }, data: { status } }),
    prisma.orderEvent.create({ data: { orderId, status, note } }),
  ]);

  revalidatePath("/admin", "layout");
  revalidatePath("/compte", "layout");
  return { success: "Statut mis à jour." };
}
