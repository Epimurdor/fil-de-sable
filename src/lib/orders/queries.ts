import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";

export const orderInclude = {
  items: { include: { product: { select: { slug: true, imageUrl: true, options: true } } } },
  events: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.OrderInclude;

export type OrderFull = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

const userSelect = { id: true, email: true, firstName: true, lastName: true } as const;

export async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}

export async function getOrderForUser(number: string, userId: string): Promise<OrderFull | null> {
  return prisma.order.findFirst({ where: { number, userId }, include: orderInclude });
}

export async function getOrderForPayment(id: string, userId: string) {
  return prisma.order.findFirst({ where: { id, userId }, include: { items: true } });
}

// Lectures admin : le rôle est revérifié ici, quel que soit l'appelant (défense en profondeur).
export async function getAdminOrders(status?: string) {
  await requireAdmin();
  return prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    include: { user: { select: userSelect }, _count: { select: { items: true } } },
  });
}

export async function getAdminOrder(id: string) {
  await requireAdmin();
  return prisma.order.findUnique({
    where: { id },
    include: { ...orderInclude, user: { select: userSelect } },
  });
}

export async function getAdminStats() {
  await requireAdmin();
  const [pending, inProgress, toShip, customers, products] = await Promise.all([
    prisma.order.count({ where: { status: "paid" } }),
    prisma.order.count({ where: { status: "in_progress" } }),
    prisma.order.count({ where: { status: "ready" } }),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.product.count({ where: { isActive: true } }),
  ]);
  const revenue = await prisma.order.aggregate({
    _sum: { totalCents: true },
    where: { status: { notIn: ["pending", "cancelled"] } },
  });
  return { pending, inProgress, toShip, customers, products, revenueCents: revenue._sum.totalCents ?? 0 };
}
