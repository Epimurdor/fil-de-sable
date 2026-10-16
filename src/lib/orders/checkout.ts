import "server-only";
import { randomInt } from "node:crypto";
import { z } from "zod";
import type { ShippingMethod } from "@prisma/client";
import { prisma } from "@/lib/db";
import { legal, site } from "@/config/site";
import type { CartWithItems } from "@/lib/cart/cart";
import { customPriceCents } from "@/lib/configurator";
import { getPaymentProviderName } from "@/lib/payment/provider";
import { resolveOptions } from "@/lib/products/pricing";
import { computeShippingCents } from "@/lib/shipping";
import { parseCustomConfig, parseSelectedOptions } from "@/lib/types";

const optionalText = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Nom complet requis.").max(120, "Nom complet trop long (120 caractères max)."),
  line1: z.string().trim().min(3, "Adresse requise.").max(200, "Adresse trop longue (200 caractères max)."),
  line2: optionalText(200),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Code postal à 5 chiffres."),
  city: z.string().trim().min(1, "Ville requise.").max(100, "Ville trop longue (100 caractères max)."),
  phone: optionalText(30),
  customerNote: optionalText(500),
  shippingCode: z.string().min(1, "Choisis un mode de livraison.").max(50),
  saveAddress: z.string().max(10).optional(),
  // Cases à cocher : présentes (« on ») uniquement si cochées. Contrôle serveur, pas seulement `required` HTML.
  acceptCgv: z.literal("on", "Accepte les conditions générales de vente pour commander."),
  acceptCustom: z.literal("on").optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// Alphabet sans caractères ambigus (0/O, 1/I/L) : lisible au téléphone.
const ORDER_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const ORDER_SUFFIX_LENGTH = 6;

// Numéro aléatoire (FDS-2026-X8K9MQ) : ni estimation du volume de ventes par incrément,
// ni lecture-puis-écriture concurrente. Une collision (≈ 1 sur 887 millions) est rattrapée par le réessai.
function generateOrderNumber(): string {
  let suffix = "";
  for (let i = 0; i < ORDER_SUFFIX_LENGTH; i++) suffix += ORDER_ALPHABET[randomInt(ORDER_ALPHABET.length)];
  return `${site.orderPrefix}-${new Date().getFullYear()}-${suffix}`;
}

export async function createOrderFromCart(params: {
  userId: string;
  cart: CartWithItems;
  method: ShippingMethod;
  input: CheckoutInput;
}) {
  const { userId, cart, method, input } = params;

  // Recalcul autoritaire des prix depuis le catalogue actuel (protection contre le price tampering et les prix obsolètes)
  const authoritativeItems = cart.items.map((it) => {
    let unitPriceCents = it.product.priceCents;
    const custom = parseCustomConfig(it.customConfig);
    if (custom) {
      unitPriceCents = customPriceCents(it.product.priceCents, custom);
    } else {
      const selected = parseSelectedOptions(it.selectedOptions);
      const resolved = resolveOptions(it.product, selected);
      if (resolved.ok) {
        unitPriceCents = resolved.unitPriceCents;
      }
    }
    return {
      it,
      custom,
      unitPriceCents,
    };
  });

  const subtotalCents = authoritativeItems.reduce((sum, item) => sum + item.unitPriceCents * item.it.quantity, 0);
  const shippingCents = computeShippingCents(method, subtotalCents);
  const totalCents = subtotalCents + shippingCents;

  // Tentatives avec réessai automatique pour parer aux collisions concurrentes sur le numéro de commande
  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    try {
      return await prisma.$transaction(async (tx) => {
        const number = generateOrderNumber();
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
            paymentProvider: getPaymentProviderName(),
            items: {
              create: authoritativeItems.map(({ it, custom, unitPriceCents: price }) => ({
                productId: it.productId,
                name: it.product.name,
                colors: custom ? JSON.stringify(custom.threads) : it.product.colors,
                unitPriceCents: price,
                quantity: it.quantity,
                selectedOptions: it.selectedOptions,
                customConfig: it.customConfig,
              })),
            },
            // Preuve d'acceptation des CGV (version) et de la renonciation à la rétractation pour le sur mesure.
            events: {
              create: {
                status: "pending",
                note: `Commande créée, en attente de paiement. CGV ${legal.cgvVersion} acceptées${
                  input.acceptCustom ? ", sur mesure sans rétractation reconnu" : ""
                }.`,
              },
            },
          },
          include: { items: true },
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
    } catch (err: unknown) {
      const isUniqueConstraint =
        err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002";
      if (isUniqueConstraint && attempts < 3) {
        // En cas de collision concurrente sur le numéro de commande, réessai immédiat
        continue;
      }
      throw err;
    }
  }

  throw new Error("Impossible de générer un numéro de commande unique.");
}

export async function getDefaultAddress(userId: string) {
  return prisma.address.findFirst({ where: { userId, isDefault: true } });
}
