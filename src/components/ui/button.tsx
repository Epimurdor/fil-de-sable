import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 py-3 text-sm font-medium transition-[background-color,box-shadow,transform,color] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-ink shadow-soft hover:bg-[#c49b58] hover:shadow-lift",
  secondary: "border border-ink/80 bg-paper/60 text-ink hover:border-accent-strong hover:bg-accent-soft",
  ghost: "text-ink-2 hover:bg-paper-2 hover:translate-y-0",
  dark: "bg-ink text-paper shadow-soft hover:bg-ink-2 hover:shadow-lift",
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
