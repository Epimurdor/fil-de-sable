import "server-only";
import { prisma } from "@/lib/db";

// Passage atomique « pending » -> « paid » : idempotent (un webhook rejoué ne fait rien la seconde fois).
export async function markOrderPaid(params: {
  orderId: string;
  provider: string;
  paymentRef: string;
  note: string;
}): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: params.orderId, status: "pending", paymentProvider: params.provider },
      data: { status: "paid", paidAt: new Date(), paymentRef: params.paymentRef },
    });
    if (updated.count > 0) {
      await tx.orderEvent.create({ data: { orderId: params.orderId, status: "paid", note: params.note } });
    }
    return updated.count > 0;
  });
}
