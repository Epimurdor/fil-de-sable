"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function NavLink({
  href,
  exact,
  className,
  activeClassName = "bg-paper-2 text-ink",
  inactiveClassName = "text-ink-2 hover:bg-paper-2",
  children,
}: {
  href: string;
  exact?: boolean;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link href={href} className={cn(className, active ? activeClassName : inactiveClassName)} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
