// Abstraction du paiement : la commande est créée en base, puis le fournisseur
// renvoie une URL où envoyer le client. En dev : "mock". En production : Stripe Checkout.
import "server-only";
import { mockProvider } from "./mock";
import { stripeProvider } from "./stripe";

export type CheckoutOrder = {
  id: string;
  number: string;
  totalCents: number;
  email: string;
  shippingName: string;
  shippingCents: number;
  items: { name: string; unitPriceCents: number; quantity: number }[];
};

export function toCheckoutOrder(
  order: Omit<CheckoutOrder, "email" | "items"> & { items: CheckoutOrder["items"] },
  email: string,
): CheckoutOrder {
  return {
    id: order.id,
    number: order.number,
    totalCents: order.totalCents,
    email,
    shippingName: order.shippingName,
    shippingCents: order.shippingCents,
    items: order.items.map(({ name, unitPriceCents, quantity }) => ({ name, unitPriceCents, quantity })),
  };
}

export interface PaymentProvider {
  readonly name: string;
  createCheckout(order: CheckoutOrder): Promise<{ redirectUrl: string }>;
}

export function getPaymentProviderName(): string {
  return process.env.PAYMENT_PROVIDER ?? "mock";
}

// Le paiement simulé valide une commande sans encaissement : jamais en production.
export function isMockPaymentEnabled(): boolean {
  return getPaymentProviderName() === "mock" && process.env.NODE_ENV !== "production";
}

export function getPaymentProvider(): PaymentProvider {
  const name = getPaymentProviderName();
  switch (name) {
    case "mock":
      if (!isMockPaymentEnabled()) {
        throw new Error("Le paiement simulé est désactivé en production : configure un vrai PAYMENT_PROVIDER.");
      }
      return mockProvider;
    case "stripe":
      if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error("STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET sont requis avec PAYMENT_PROVIDER=stripe.");
      }
      return stripeProvider;
    default:
      throw new Error(`Fournisseur de paiement inconnu : ${name}`);
  }
}
