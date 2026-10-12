import { cn } from "@/lib/cn";
import { STATUS_INFO, isOrderStatus } from "@/lib/orders/status";

const tones = {
  neutral: "bg-sand-100 text-bark-700 ring-sand-300",
  info: "bg-sage-100 text-sage-700 ring-sage-400/50",
  warm: "bg-ocre-100 text-terracotta-700 ring-ocre-400/60",
  success: "bg-sage-100 text-sage-700 ring-sage-500/60",
  danger: "bg-red-50 text-red-700 ring-red-200",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const info = isOrderStatus(status) ? STATUS_INFO[status] : { label: status, tone: "neutral" as const };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        tones[info.tone],
        className,
      )}
    >
      {info.label}
    </span>
  );
}
