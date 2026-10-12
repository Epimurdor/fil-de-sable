"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { site } from "@/config/site";
import { prisma } from "@/lib/db";
import { getCartId, getOrCreateCartId } from "./cart";
import { productInclude } from "@/lib/products/queries";
import { checkAvailable } from "@/lib/products/availability";
import { resolveOptions } from "@/lib/products/pricing";
import { customConfigSchema, customPriceCents } from "@/lib/configurator";
import type { SelectedOptions } from "@/lib/types";

export type CartActionState = { error?: string };

const MAX_QTY = 10;

function selectedFromForm(formData: FormData): SelectedOptions {
  const out: SelectedOptions = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("opt:") && typeof value === "string" && value) out[key.slice(4)] = value;
  }
  return out;
}

function clampQty(raw: FormDataEntryValue | null): number {
  const n = Number(raw ?? 1);
  return Number.isFinite(n) ? Math.min(MAX_QTY, Math.max(1, Math.floor(n))) : 1;
}

export async function addToCart(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const productId = String(formData.get("productId") ?? "");
  const quantity = clampQty(formData.get("quantity"));

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    include: productInclude,
  });
  if (!product) return { error: "Produit introuvable." };
  if (!(await checkAvailable(product))) return { error: "Il manque un fil pour cette pièce, elle revient dès que le stock est refait." };

  const resolved = resolveOptions(product, selectedFromForm(formData));
  if (!resolved.ok) return { error: resolved.error };

  const cartId = await getOrCreateCartId();
  const selectedJson = JSON.stringify(resolved.selected);
  const existing = await prisma.cartItem.findFirst({
    where: { cartId, productId, selectedOptions: selectedJson, customConfig: null },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: Math.min(MAX_QTY, existing.quantity + quantity), unitPriceCents: resolved.unitPriceCents },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId, productId, quantity, selectedOptions: selectedJson, unitPriceCents: resolved.unitPriceCents },
    });
  }
  await prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });

  revalidatePath("/", "layout");
  redirect("/panier");
}

export async function addCustomBracelet(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  let json: unknown;
  try {
    json = JSON.parse(String(formData.get("config") ?? ""));
  } catch {
    return { error: "Configuration illisible." };
  }
  if (!site.customEnabled) return { error: "Le bracelet sur mesure n'est pas disponible pour le moment." };
  const parsed = customConfigSchema.safeParse(json);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Configuration invalide." };

  const product = await prisma.product.findFirst({ where: { isActive: true, isCustomizable: true } });
  if (!product) return { error: "Le bracelet sur mesure n'est pas disponible pour le moment." };

  const cartId = await getOrCreateCartId();
  await prisma.cartItem.create({
    data: {
      cartId,
      productId: product.id,
      quantity: 1,
      selectedOptions: "{}",
      customConfig: JSON.stringify(parsed.data),
      unitPriceCents: customPriceCents(product.priceCents, parsed.data),
    },
  });
  await prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });

  revalidatePath("/", "layout");
  redirect("/panier");
}

export async function updateCartItem(formData: FormData): Promise<void> {
  const cartId = await getCartId();
  if (!cartId) return;
  const itemId = String(formData.get("itemId") ?? "");
  const quantity = Number(formData.get("quantity"));
  if (!Number.isFinite(quantity)) return;

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
  } else {
    await prisma.cartItem.updateMany({
      where: { id: itemId, cartId },
      data: { quantity: Math.min(MAX_QTY, Math.floor(quantity)) },
    });
  }
  revalidatePath("/", "layout");
}

export async function removeCartItem(formData: FormData): Promise<void> {
  const cartId = await getCartId();
  if (!cartId) return;
  await prisma.cartItem.deleteMany({ where: { id: String(formData.get("itemId") ?? ""), cartId } });
  revalidatePath("/", "layout");
}
