import { ShieldExclamationIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

export function PermissionNotice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="mt-5 flex gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4"
    >
      <ShieldExclamationIcon
        className="h-5 w-5 shrink-0 text-[var(--warning)]"
        aria-hidden="true"
      />
      <p className="text-sm leading-6 text-[var(--text-muted)]">{children}</p>
    </div>
  );
}
