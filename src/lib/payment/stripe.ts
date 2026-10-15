import "server-only";
import Stripe from "stripe";
import type { PaymentProvider } from "./provider";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY manquant.");
  // Client HTTP fetch : portable (Node, edge) sans dépendre du module http natif.
  client ??= new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
  return client;
}

// URL publique du site : jamais déduite de l'en-tête Host (falsifiable).
export function getAppUrl(): string {
  const raw = process.env.APP_URL;
  if (!raw) throw new Error("APP_URL manquant (ex. https://fil-de-sable.onrender.com).");
  const url = new URL(raw);
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("APP_URL doit être en https en production.");
  }
  return url.origin;
}

export const stripeProvider: PaymentProvider = {
  name: "stripe",
  async createCheckout(order) {
    const appUrl = getAppUrl();
    const orderUrl = `${appUrl}/compte/commandes/${encodeURIComponent(order.number)}`;
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map((it) => ({
      quantity: it.quantity,
      price_data: { currency: "eur", unit_amount: it.unitPriceCents, product_data: { name: it.name.slice(0, 250) } },
    }));
    if (order.shippingCents > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: order.shippingCents,
          product_data: { name: `Livraison · ${order.shippingName}`.slice(0, 250) },
        },
      });
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      locale: "fr",
      line_items: lineItems,
      customer_email: order.email,
      client_reference_id: order.id,
      metadata: { orderId: order.id, orderNumber: order.number },
      payment_intent_data: { metadata: { orderId: order.id, orderNumber: order.number } },
      success_url: `${orderUrl}?merci=1`,
      cancel_url: `${orderUrl}?paiement=annule`,
    });
    if (!session.url) throw new Error("Stripe n'a pas renvoyé d'URL de paiement.");
    return { redirectUrl: session.url };
  },
};
