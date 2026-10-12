import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500/40 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-terracotta-500 text-white shadow-soft hover:bg-terracotta-600",
  secondary: "border border-bark-800/15 bg-white text-bark-800 hover:border-bark-800/40",
  ghost: "text-bark-700 hover:bg-sand-100",
  dark: "bg-bark-900 text-sand-50 hover:bg-bark-800",
};

export function buttonClass(variant: ButtonVariant = "primary", className?: string): string {
  return cn(base, variants[variant], className);
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}
