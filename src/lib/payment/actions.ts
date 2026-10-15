"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { markOrderPaid } from "./confirm";
import { getPaymentProvider, isMockPaymentEnabled, toCheckoutOrder } from "./provider";

const PAYMENT_STARTS_PER_USER = { limit: 10, windowMs: 10 * 60_000 };

// Relance le paiement d'une commande en attente (paiement annulé, onglet fermé, session Stripe expirée…).
export async function startPayment(formData: FormData): Promise<void> {
  const user = await requireUser("/compte/commandes");
  const orderId = String(formData.get("orderId") ?? "");

  const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id }, include: { items: true } });
  if (!order) redirect("/compte/commandes");
  const orderPath = `/compte/commandes/${order.number}`;
  if (order.status !== "pending") redirect(orderPath);
  if (!consumeRateLimit(`payment:start:${user.id}`, PAYMENT_STARTS_PER_USER).ok) redirect(`${orderPath}?paiement=erreur`);

  let redirectUrl: string;
  try {
    const provider = getPaymentProvider();
    // Une commande se paie uniquement chez le fournisseur avec lequel elle a été créée.
    if (provider.name !== order.paymentProvider) throw new Error(`Fournisseur ${provider.name} ≠ ${order.paymentProvider}`);
    ({ redirectUrl } = await provider.createCheckout(toCheckoutOrder(order, user.email)));
  } catch (err) {
    console.error(err);
    redirect(`${orderPath}?paiement=erreur`);
  }
  redirect(redirectUrl);
}

// Confirmation du paiement simulé (en production, c'est le webhook Stripe qui confirme).
export async function confirmMockPayment(formData: FormData): Promise<void> {
  // Une Server Action exportée reste appelable directement : sans ce garde-fou, n'importe quel
  // client pourrait marquer sa commande « payée » sans paiement réel.
  if (!isMockPaymentEnabled()) throw new Error("Action non autorisée.");

  const user = await requireUser("/panier");
  const orderId = String(formData.get("orderId") ?? "");
  const outcome = String(formData.get("outcome") ?? "");

  const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id } });
  if (!order) redirect("/compte/commandes");
  if (order.status !== "pending" || order.paymentProvider !== "mock") redirect(`/compte/commandes/${order.number}`);

  if (outcome !== "success") {
    await prisma.orderEvent.create({
      data: { orderId: order.id, status: "pending", note: "Paiement simulé refusé" },
    });
    redirect(`/paiement/simulation/${order.id}?echec=1`);
  }

  await markOrderPaid({
    orderId: order.id,
    provider: "mock",
    paymentRef: `mock_${Date.now()}`,
    note: "Paiement simulé accepté",
  });

  revalidatePath("/compte", "layout");
  revalidatePath("/admin", "layout");
  redirect(`/compte/commandes/${order.number}?merci=1`);
}
