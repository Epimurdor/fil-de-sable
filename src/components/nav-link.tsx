"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavLink({
  href,
  exact,
  className,
  activeClassName = "bg-sand-200 text-bark-900",
  children,
}: {
  href: string;
  exact?: boolean;
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={cn(className, active && activeClassName)} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
