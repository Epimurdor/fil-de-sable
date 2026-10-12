import { cache } from "react";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";

const CART_COOKIE = "fds_cart";
const CART_DAYS = 90;

export const cartInclude = {
  items: {
    orderBy: { id: "asc" },
    include: { product: { include: { category: true, options: true } } },
  },
} satisfies Prisma.CartInclude;

export type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;
export type CartItemWithProduct = CartWithItems["items"][number];

export async function getCartId(): Promise<string | null> {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}

// Lecture brute, non mise en cache : à utiliser dans les Server Actions.
export async function loadCart(id: string | null): Promise<CartWithItems | null> {
  if (!id) return null;
  return prisma.cart.findUnique({ where: { id }, include: cartInclude });
}

// Lecture dédupliquée par requête : à utiliser dans les composants serveur.
export const getCart = cache(async (): Promise<CartWithItems | null> => loadCart(await getCartId()));

// Crée le panier et pose le cookie : Server Actions uniquement.
export async function getOrCreateCartId(): Promise<string> {
  const existingId = await getCartId();
  if (existingId) {
    const exists = await prisma.cart.findUnique({ where: { id: existingId }, select: { id: true } });
    if (exists) return existingId;
  }
  const user = await getCurrentUser();
  const cart = await prisma.cart.create({ data: { userId: user?.id ?? null } });
  (await cookies()).set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_DAYS * 24 * 60 * 60,
  });
  return cart.id;
}

export async function attachCartToUser(userId: string): Promise<void> {
  const id = await getCartId();
  if (!id) return;
  await prisma.cart.updateMany({ where: { id, userId: null }, data: { userId } });
}

export function cartSummary(cart: CartWithItems | null) {
  const items = cart?.items ?? [];
  const itemCount = items.reduce((n, it) => n + it.quantity, 0);
  const subtotalCents = items.reduce((n, it) => n + it.quantity * it.unitPriceCents, 0);
  const maxLeadTimeDays = items.reduce((n, it) => Math.max(n, it.product.leadTimeDays), 0);
  return { items, itemCount, subtotalCents, maxLeadTimeDays };
}
