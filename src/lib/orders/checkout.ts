import { z } from "zod";
import type { Prisma, ShippingMethod } from "@prisma/client";
import { prisma } from "@/lib/db";
import { site } from "@/config/site";
import { cartSummary, type CartWithItems } from "@/lib/cart/cart";
import { computeShippingCents } from "@/lib/shipping";
import { parseCustomConfig } from "@/lib/types";

const optionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Nom complet requis."),
  line1: z.string().trim().min(3, "Adresse requise."),
  line2: optionalText(),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Code postal à 5 chiffres."),
  city: z.string().trim().min(1, "Ville requise."),
  phone: optionalText(30),
  customerNote: optionalText(500),
  shippingCode: z.string().min(1, "Choisis un mode de livraison."),
  saveAddress: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${site.orderPrefix}-${year}-`;
  const count = await tx.order.count({ where: { number: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

export async function createOrderFromCart(params: {
  userId: string;
  cart: CartWithItems;
  method: ShippingMethod;
  input: CheckoutInput;
}) {
  const { userId, cart, method, input } = params;
  const { subtotalCents } = cartSummary(cart);
  const shippingCents = computeShippingCents(method, subtotalCents);
  const totalCents = subtotalCents + shippingCents;

  return prisma.$transaction(async (tx) => {
    const number = await nextOrderNumber(tx);
    const order = await tx.order.create({
      data: {
        number,
        userId,
        status: "pending",
        subtotalCents,
        shippingCents,
        totalCents,
        shippingCode: method.code,
        shippingName: method.name,
        shipFullName: input.fullName,
        shipLine1: input.line1,
        shipLine2: input.line2 ?? null,
        shipPostalCode: input.postalCode,
        shipCity: input.city,
        shipPhone: input.phone ?? null,
        customerNote: input.customerNote ?? null,
        paymentProvider: process.env.PAYMENT_PROVIDER ?? "mock",
        items: {
          create: cart.items.map((it) => {
            const custom = parseCustomConfig(it.customConfig);
            return {
              productId: it.productId,
              name: it.product.name,
              colors: custom ? JSON.stringify(custom.threads) : it.product.colors,
              unitPriceCents: it.unitPriceCents,
              quantity: it.quantity,
              selectedOptions: it.selectedOptions,
              customConfig: it.customConfig,
            };
          }),
        },
        events: { create: { status: "pending", note: "Commande créée, en attente de paiement" } },
      },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    if (input.saveAddress) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      await tx.address.create({
        data: {
          userId,
          fullName: input.fullName,
          line1: input.line1,
          line2: input.line2 ?? null,
          postalCode: input.postalCode,
          city: input.city,
          phone: input.phone ?? null,
          isDefault: true,
        },
      });
    }

    return order;
  });
}

export async function getDefaultAddress(userId: string) {
  return prisma.address.findFirst({ where: { userId, isDefault: true } });
}
