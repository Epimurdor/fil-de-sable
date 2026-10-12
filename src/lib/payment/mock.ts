import type { PaymentProvider } from "./provider";

// Paiement simulé : page locale avec un bouton « payer » et un bouton « échec ».
export const mockProvider: PaymentProvider = {
  name: "mock",
  async createCheckout(order) {
    return { redirectUrl: `/paiement/simulation/${order.id}` };
  },
};
