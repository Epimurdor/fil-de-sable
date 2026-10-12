"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { isOrderStatus } from "@/lib/orders/status";
import { parseOptionsText } from "./options-text";

export type AdminState = { error?: string; success?: string };

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Nom requis."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug : minuscules, chiffres et tirets uniquement."),
  tagline: z.string().trim().max(120).optional(),
  description: z.string().trim().min(10, "Description trop courte."),
  price: z.string().trim().regex(/^\d+([.,]\d{1,2})?$/, "Prix invalide (ex : 22 ou 22,50)."),
  leadTimeDays: z.coerce.number().int().min(1, "Délai minimum : 1 jour.").max(90),
  categoryId: z.string().min(1, "Catégorie requise."),
  colors: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  optionsText: z.string().optional(),
  isActive: z.string().optional(),
  isFeatured: z.string().optional(),
  isCustomizable: z.string().optional(),
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
  if (id) await prisma.product.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/admin/produits");
}

export async function updateOrderStatus(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;
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
