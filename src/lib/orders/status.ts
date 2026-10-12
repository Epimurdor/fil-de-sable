// Cycle de vie d'une commande « sur commande » : du paiement à la livraison.
export const ORDER_STATUSES = [
  "pending",
  "paid",
  "in_progress",
  "ready",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_INFO: Record<
  OrderStatus,
  { label: string; customer: string; tone: "neutral" | "info" | "warm" | "success" | "danger" }
> = {
  pending: { label: "En attente de paiement", customer: "On attend la confirmation du paiement.", tone: "neutral" },
  paid: { label: "Payée", customer: "Commande reçue, elle entre dans la file de l'atelier.", tone: "info" },
  in_progress: { label: "En confection", customer: "Les fils sont sur l'établi, on noue ta pièce.", tone: "warm" },
  ready: { label: "Prête", customer: "Terminée et vérifiée, elle part au prochain passage à la poste.", tone: "warm" },
  shipped: { label: "Expédiée", customer: "En route vers toi.", tone: "info" },
  delivered: { label: "Livrée", customer: "Arrivée à bon port. Porte-la bien !", tone: "success" },
  cancelled: { label: "Annulée", customer: "Cette commande a été annulée.", tone: "danger" },
};

// Étapes affichées dans la frise de suivi côté client (hors annulation).
export const TIMELINE_STEPS: OrderStatus[] = ["paid", "in_progress", "ready", "shipped", "delivered"];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function timelineIndex(status: string): number {
  return TIMELINE_STEPS.indexOf(status as OrderStatus);
}
