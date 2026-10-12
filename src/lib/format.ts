import { site } from "@/config/site";

const priceFormatter = new Intl.NumberFormat(site.locale, {
  style: "currency",
  currency: site.currency,
});

export function formatPrice(cents: number): string {
  return priceFormatter.format(cents / 100);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat(site.locale, { dateStyle: "long" }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat(site.locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(date),
  );
}

export function leadTimeLabel(days: number): string {
  if (days <= 1) return "Noué sous 24 h";
  if (days <= 3) return `Noué sous ${days} jours`;
  return `Noué sous ${days} jours`;
}

export function plural(count: number, singular: string, pluralForm?: string): string {
  return count > 1 ? (pluralForm ?? `${singular}s`) : singular;
}
