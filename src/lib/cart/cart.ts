import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { CART_COOKIE, clearCookie, cookieBaseOptions } from "@/lib/security/cookies";

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

async function setCartCookie(id: string): Promise<void> {
  (await cookies()).set(CART_COOKIE, id, { ...cookieBaseOptions, maxAge: CART_DAYS * 24 * 60 * 60 });
}

// Un panier rattaché à un compte n'est utilisable que par ce compte : un cookie forgé, fixé
// ou resté sur un poste partagé ne donne pas accès au panier d'un autre client.
async function canUseCart(cartUserId: string | null): Promise<boolean> {
  if (cartUserId === null) return true;
  const user = await getCurrentUser();
  return user?.id === cartUserId;
}

// ID du panier du cookie, seulement s'il existe et appartient au visiteur : Server Actions.
export async function getUsableCartId(): Promise<string | null> {
  const id = await getCartId();
  if (!id) return null;
  const cart = await prisma.cart.findUnique({ where: { id }, select: { userId: true } });
  return cart && (await canUseCart(cart.userId)) ? id : null;
}

// Lecture brute, non mise en cache : à utiliser dans les Server Actions.
export async function loadCart(id: string | null): Promise<CartWithItems | null> {
  if (!id) return null;
  return prisma.cart.findUnique({ where: { id }, include: cartInclude });
}

// Lecture dédupliquée par requête : à utiliser dans les composants serveur.
export const getCart = cache(async (): Promise<CartWithItems | null> => {
  const cookieCartId = await getCartId();
  if (cookieCartId) {
    const cart = await loadCart(cookieCartId);
    if (cart && (await canUseCart(cart.userId))) return cart;
  }
  const user = await getCurrentUser();
  if (user) {
    const userCart = await prisma.cart.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: cartInclude,
    });
    return userCart;
  }
  return null;
});

// Crée le panier et pose le cookie : Server Actions uniquement.
export async function getOrCreateCartId(): Promise<string> {
  const existingId = await getUsableCartId();
  if (existingId) return existingId;

  const user = await getCurrentUser();
  if (user) {
    const userCart = await prisma.cart.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    if (userCart) {
      await setCartCookie(userCart.id);
      return userCart.id;
    }
  }

  const cart = await prisma.cart.create({ data: { userId: user?.id ?? null } });
  await setCartCookie(cart.id);
  return cart.id;
}

export async function attachCartToUser(userId: string): Promise<void> {
  const cookieCartId = await getCartId();
  const cookieCart = cookieCartId
    ? await prisma.cart.findUnique({ where: { id: cookieCartId }, include: { items: true } })
    : null;
  // Seul un panier invité (sans propriétaire) peut être fusionné ou rattaché : un cookie pointant
  // vers le panier d'un autre compte est ignoré, ce panier n'est ni lu ni supprimé.
  const guestCart = cookieCart?.userId === null ? cookieCart : null;
  const userExistingCart = await prisma.cart.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { items: true },
  });

  if (guestCart && userExistingCart) {
    // Fusionner les articles du panier invité vers le panier existant du compte
    await prisma.$transaction(async (tx) => {
      for (const item of guestCart.items) {
        const match = userExistingCart.items.find(
          (u) =>
            u.productId === item.productId &&
            u.selectedOptions === item.selectedOptions &&
            u.customConfig === item.customConfig,
        );
        if (match) {
          await tx.cartItem.update({
            where: { id: match.id },
            data: { quantity: Math.min(10, match.quantity + item.quantity) },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: userExistingCart.id,
              productId: item.productId,
              quantity: item.quantity,
              selectedOptions: item.selectedOptions,
              customConfig: item.customConfig,
              unitPriceCents: item.unitPriceCents,
            },
          });
        }
      }
      await tx.cart.deleteMany({ where: { id: guestCart.id, userId: null } });
    });
    await setCartCookie(userExistingCart.id);
    return;
  }

  if (guestCart) {
    await prisma.cart.updateMany({ where: { id: guestCart.id, userId: null }, data: { userId } });
    return;
  }

  if (userExistingCart) {
    await setCartCookie(userExistingCart.id);
  } else if (cookieCartId) {
    // Cookie vers un panier inexistant ou appartenant à un autre compte.
    await clearCookie(CART_COOKIE);
  }
}

export function cartSummary(cart: CartWithItems | null) {
  const items = cart?.items ?? [];
  const itemCount = items.reduce((n, it) => n + it.quantity, 0);
  const subtotalCents = items.reduce((n, it) => n + it.quantity * it.unitPriceCents, 0);
  const maxLeadTimeDays = items.reduce((n, it) => Math.max(n, it.product.leadTimeDays), 0);
  return { items, itemCount, subtotalCents, maxLeadTimeDays };
}
