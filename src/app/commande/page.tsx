import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { requireUser } from "@/lib/auth/session";
import { cartSummary, getCart } from "@/lib/cart/cart";
import { getDefaultAddress } from "@/lib/orders/checkout";
import { computeShippingCents, getShippingMethods } from "@/lib/shipping";

export const metadata: Metadata = { title: "Commande" };

export default async function CheckoutPage() {
  const user = await requireUser("/commande");
  const cart = await getCart();
  const { items, subtotalCents, maxLeadTimeDays } = cartSummary(cart);
  if (items.length === 0) redirect("/panier");

  const [methods, address] = await Promise.all([getShippingMethods(), getDefaultAddress(user.id)]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-bark-900">Finaliser la commande</h1>
      <p className="mt-2 text-bark-500">Une adresse, un mode de livraison, et l'atelier se met au travail.</p>
      <div className="mt-8">
        <CheckoutForm
          defaults={{
            fullName: address?.fullName ?? `${user.firstName} ${user.lastName}`,
            line1: address?.line1 ?? "",
            line2: address?.line2 ?? "",
            postalCode: address?.postalCode ?? "",
            city: address?.city ?? "",
            phone: address?.phone ?? "",
          }}
          methods={methods.map((m) => ({
            code: m.code,
            name: m.name,
            description: m.description,
            priceCents: computeShippingCents(m, subtotalCents),
          }))}
          items={items.map((it) => ({ id: it.id, name: it.product.name, quantity: it.quantity, unitPriceCents: it.unitPriceCents }))}
          subtotalCents={subtotalCents}
          leadTimeDays={maxLeadTimeDays}
        />
      </div>
    </div>
  );
}
