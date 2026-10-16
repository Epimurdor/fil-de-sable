"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getCartId, loadCart } from "@/lib/cart/cart";
import { getPaymentProvider, toCheckoutOrder, type PaymentProvider } from "@/lib/payment/provider";
import { consumeRateLimit, tooManyAttemptsMessage } from "@/lib/security/rate-limit";
import { checkoutSchema, createOrderFromCart } from "./checkout";

// values : la saisie renvoyée au formulaire. React 19 réinitialise le formulaire après l'action :
// sans elle, une erreur effacerait l'adresse tapée et remettrait le premier mode de livraison.
export type CheckoutState = { error?: string; values?: Record<string, string> };

const ORDERS_PER_USER = { limit: 10, windowMs: 10 * 60_000 };

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await requireUser("/commande");
  const values = Object.fromEntries(
    [...formData.entries()].filter((e): e is [string, string] => typeof e[1] === "string" && !e[0].startsWith("$")),
  );
  const fail = (error: string): CheckoutState => ({ error, values });

  const cart = await loadCart(await getCartId());
  if (!cart || cart.items.length === 0) return fail("Ton panier est vide.");
  if (cart.userId && cart.userId !== user.id) {
    return fail("Session de panier invalide. Réactualise la page.");
  }
  if (cart.items.some((it) => !it.product.isActive)) {
    return fail("Un article de ton panier n'est plus disponible. Retire-le pour continuer.");
  }

  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Formulaire invalide.");

  const method = await prisma.shippingMethod.findFirst({
    where: { code: parsed.data.shippingCode, isActive: true },
  });
  if (!method) return fail("Mode de livraison invalide.");

  // Résolu avant la création : un fournisseur indisponible ne doit pas vider le panier.
  let provider: PaymentProvider;
  try {
    provider = getPaymentProvider();
  } catch (err) {
    console.error(err);
    return fail("Le paiement est indisponible pour le moment. Réessaie plus tard.");
  }

  // Compté uniquement pour les commandes réellement créées (les erreurs de saisie ne bloquent pas).
  const limit = consumeRateLimit(`order:user:${user.id}`, ORDERS_PER_USER);
  if (!limit.ok) return fail(tooManyAttemptsMessage(limit.retryAfterSeconds));

  const order = await createOrderFromCart({ userId: user.id, cart, method, input: parsed.data });
  revalidatePath("/", "layout");

  let redirectUrl: string;
  try {
    ({ redirectUrl } = await provider.createCheckout(toCheckoutOrder(order, user.email)));
  } catch (err) {
    // La commande existe déjà : le client pourra relancer le paiement depuis son suivi de commande.
    console.error(err);
    redirect(`/compte/commandes/${order.number}?paiement=erreur`);
  }
  redirect(redirectUrl);
}
