"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonVariant } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendingText = "Un instant…",
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingText : children}
    </Button>
  );
}
