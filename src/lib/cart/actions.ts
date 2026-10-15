"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { consumeRateLimit, getClientIp, tooManyAttemptsMessage } from "@/lib/security/rate-limit";
import { getOrCreateCartId, getUsableCartId } from "./cart";
import { productInclude } from "@/lib/products/queries";
import { resolveOptions } from "@/lib/products/pricing";
import { customConfigSchema, customPriceCents } from "@/lib/configurator";
import type { SelectedOptions } from "@/lib/types";

export type CartActionState = { error?: string };

const MAX_QTY = 10;
// Chaque ajout peut créer un panier en base : on borne le spam par IP.
const ADDS_PER_IP = { limit: 30, windowMs: 60_000 };

async function checkAddLimit(): Promise<CartActionState | null> {
  const limit = consumeRateLimit(`cart:add:${await getClientIp()}`, ADDS_PER_IP);
  return limit.ok ? null : { error: tooManyAttemptsMessage(limit.retryAfterSeconds) };
}

function selectedFromForm(formData: FormData): SelectedOptions {
  const out: SelectedOptions = Object.create(null);
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("opt:") && typeof value === "string" && value) {
      const optName = key.slice(4);
      if (optName !== "__proto__" && optName !== "constructor" && optName !== "prototype") {
        out[optName] = value.slice(0, 100);
      }
    }
  }
  return Object.assign({}, out);
}

function clampQty(raw: FormDataEntryValue | null): number {
  const n = Number(raw ?? 1);
  return Number.isFinite(n) ? Math.min(MAX_QTY, Math.max(1, Math.floor(n))) : 1;
}

export async function addToCart(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const limited = await checkAddLimit();
  if (limited) return limited;

  const productId = String(formData.get("productId") ?? "");
  const quantity = clampQty(formData.get("quantity"));

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    include: productInclude,
  });
  if (!product) return { error: "Produit introuvable." };

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
  const limited = await checkAddLimit();
  if (limited) return limited;

  const rawConfig = String(formData.get("config") ?? "");
  if (!rawConfig || rawConfig.length > 2000) {
    return { error: "Configuration invalide ou trop volumineuse." };
  }
  let json: unknown;
  try {
    json = JSON.parse(rawConfig);
  } catch {
    return { error: "Configuration illisible." };
  }
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
  const cartId = await getUsableCartId();
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
  const cartId = await getUsableCartId();
  if (!cartId) return;
  await prisma.cartItem.deleteMany({ where: { id: String(formData.get("itemId") ?? ""), cartId } });
  revalidatePath("/", "layout");
}
