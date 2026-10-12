import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { STATUS_INFO, TIMELINE_STEPS, timelineIndex } from "@/lib/orders/status";

type Event = { status: string; note: string | null; createdAt: Date };

// Frise de suivi de fabrication : paiement → confection → prête → expédiée → livrée.
export function OrderTimeline({ status, events }: { status: string; events: Event[] }) {
  if (status === "cancelled") {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{STATUS_INFO.cancelled.customer}</div>
    );
  }
  const current = timelineIndex(status);
  const lastEventFor = (s: string) => [...events].reverse().find((e) => e.status === s);

  return (
    <ol className="relative space-y-5 border-l-2 border-line pl-6">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= current;
        const active = i === current;
        const event = lastEventFor(step);
        return (
          <li key={step} className="relative">
            <span
              className={cn(
                "absolute -left-[31px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-paper",
                done ? "bg-accent-strong text-white shadow-soft" : "bg-line",
                active && "animate-pulse",
              )}
            >
              {done && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
            </span>
            <p className={cn("text-sm font-semibold", done ? "text-ink" : "text-ink-3")}>
              {STATUS_INFO[step].label}
            </p>
            <p className="text-sm text-ink-3">{STATUS_INFO[step].customer}</p>
            {event && (
              <p className="mt-0.5 text-xs text-ink-3">
                {formatDateTime(event.createdAt)}
                {event.note ? ` · ${event.note}` : ""}
              </p>
            )}
          </li>
        );
      })}
      {current < 0 && (
        <li className="text-sm text-ink-3">{STATUS_INFO.pending.customer}</li>
      )}
    </ol>
  );
}
