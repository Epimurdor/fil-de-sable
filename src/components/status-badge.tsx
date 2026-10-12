import { cn } from "@/lib/cn";
import { STATUS_INFO, isOrderStatus } from "@/lib/orders/status";

const tones = {
  neutral: "bg-paper-2 text-ink-2",
  info: "bg-slate-soft text-slate",
  warm: "bg-accent-soft text-accent-strong",
  success: "bg-emerald-50 text-emerald-800",
  danger: "bg-red-50 text-red-700",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const info = isOrderStatus(status) ? STATUS_INFO[status] : { label: status, tone: "neutral" as const };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[info.tone], className)}>
      {info.label}
    </span>
  );
}
