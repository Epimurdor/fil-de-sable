"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";

// Confirmation du paiement simulé (remplacé par un webhook avec un vrai fournisseur).
export async function confirmMockPayment(formData: FormData): Promise<void> {
  const user = await requireUser("/panier");
  const orderId = String(formData.get("orderId") ?? "");
  const outcome = String(formData.get("outcome") ?? "");

  const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id } });
  if (!order) redirect("/compte/commandes");
  if (order.status !== "pending") redirect(`/compte/commandes/${order.number}`);

  if (outcome !== "success") {
    await prisma.orderEvent.create({
      data: { orderId: order.id, status: "pending", note: "Paiement simulé refusé" },
    });
    redirect(`/paiement/simulation/${order.id}?echec=1`);
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: "paid", paidAt: new Date(), paymentRef: `mock_${Date.now()}` },
    }),
    prisma.orderEvent.create({
      data: { orderId: order.id, status: "paid", note: "Paiement simulé accepté" },
    }),
  ]);

  revalidatePath("/compte", "layout");
  revalidatePath("/admin", "layout");
  redirect(`/compte/commandes/${order.number}?merci=1`);
}
