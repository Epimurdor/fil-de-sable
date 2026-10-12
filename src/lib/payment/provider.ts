// Abstraction du paiement : la commande est créée en base, puis le fournisseur
// renvoie une URL où envoyer le client. En dev : "mock". Plus tard : Stripe Checkout.
import { mockProvider } from "./mock";

export type CheckoutOrder = { id: string; number: string; totalCents: number; email: string };

export interface PaymentProvider {
  readonly name: string;
  createCheckout(order: CheckoutOrder): Promise<{ redirectUrl: string }>;
}

export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "mock";
  switch (name) {
    case "mock":
      return mockProvider;
    default:
      throw new Error(`Fournisseur de paiement inconnu : ${name}`);
  }
}
