"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getCartId, loadCart } from "@/lib/cart/cart";
import { getPaymentProvider } from "@/lib/payment/provider";
import { checkoutSchema, createOrderFromCart } from "./checkout";

export type CheckoutState = { error?: string };

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await requireUser("/commande");

  const cart = await loadCart(await getCartId());
  if (!cart || cart.items.length === 0) return { error: "Ton panier est vide." };
  if (cart.items.some((it) => !it.product.isActive)) {
    return { error: "Un article de ton panier n'est plus disponible. Retire-le pour continuer." };
  }

  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const method = await prisma.shippingMethod.findFirst({
    where: { code: parsed.data.shippingCode, isActive: true },
  });
  if (!method) return { error: "Mode de livraison invalide." };

  const order = await createOrderFromCart({ userId: user.id, cart, method, input: parsed.data });
  const { redirectUrl } = await getPaymentProvider().createCheckout({
    id: order.id,
    number: order.number,
    totalCents: order.totalCents,
    email: user.email,
  });

  revalidatePath("/", "layout");
  redirect(redirectUrl);
}
