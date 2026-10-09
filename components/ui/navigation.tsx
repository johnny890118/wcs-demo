import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./utils";

// URL-backed navigation is links, not ARIA tabs with invented client panels.
// Context navigation and filtering have separate selection from the global rail.
export function ContextNavigation({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <nav aria-label={label} className="swp-context-navigation">
      {children}
    </nav>
  );
}

export function ContextNavigationLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn("swp-context-link", current && "is-current")}
    >
      {children}
    </Link>
  );
}

export function PreferenceGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="swp-preference-group" role="group" aria-label={label}>
      {children}
    </div>
  );
}
