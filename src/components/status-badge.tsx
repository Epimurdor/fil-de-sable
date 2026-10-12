import { cn } from "@/lib/cn";
import { STATUS_INFO, isOrderStatus } from "@/lib/orders/status";

const tones = {
  neutral: "bg-paper-2 text-ink-2",
  info: "bg-accent-soft text-accent-strong",
  warm: "bg-accent-soft text-accent-strong",
  success: "bg-accent-soft text-accent-strong",
  danger: "bg-red-50 text-red-700",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const info = isOrderStatus(status) ? STATUS_INFO[status] : { label: status, tone: "neutral" as const };
  return (
    <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", tones[info.tone], className)}>
      {info.label}
    </span>
  );
}
