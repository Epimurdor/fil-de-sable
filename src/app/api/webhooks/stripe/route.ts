import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { markOrderPaid } from "@/lib/payment/confirm";
import { getStripe } from "@/lib/payment/stripe";

// Seul canal qui fait passer une commande Stripe en « payée » : la redirection success_url
// du navigateur n'est jamais une preuve de paiement.
export async function POST(request: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Webhook non configuré ou non signé.", { status: 400 });

  // Corps brut indispensable : la signature HMAC porte sur les octets exacts envoyés par Stripe.
  const body = await request.text();
  if (body.length > 512 * 1024) return new Response("Corps trop volumineux.", { status: 413 });

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(body, signature, secret);
  } catch {
    return new Response("Signature invalide.", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await handlePaidSession(event.data.object);
      break;
    case "checkout.session.async_payment_failed":
      await noteSession(event.data.object, "Paiement refusé par la banque");
      break;
    default:
      break;
  }
  return Response.json({ received: true });
}

async function handlePaidSession(session: Stripe.Checkout.Session) {
  // Paiement différé (virement SEPA…) : on attendra async_payment_succeeded.
  if (session.payment_status !== "paid") return;

  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentProvider !== "stripe") return;

  // Le montant encaissé doit correspondre exactement à la commande en base.
  if (session.amount_total !== order.totalCents || session.currency !== "eur") {
    console.error(`Montant Stripe incohérent pour ${order.number} : ${session.amount_total} ${session.currency}`);
    await noteSession(session, "Paiement reçu avec un montant incohérent : vérification manuelle requise");
    return;
  }

  const paymentRef = typeof session.payment_intent === "string" ? session.payment_intent : session.id;
  const paid = await markOrderPaid({ orderId, provider: "stripe", paymentRef, note: "Paiement Stripe confirmé" });
  if (paid) {
    revalidatePath("/compte", "layout");
    revalidatePath("/admin", "layout");
  }
}

async function noteSession(session: Stripe.Checkout.Session, note: string) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
  if (order) await prisma.orderEvent.create({ data: { orderId: order.id, status: "pending", note } });
}
