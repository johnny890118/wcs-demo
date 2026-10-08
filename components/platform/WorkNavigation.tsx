import Link from "next/link";
import { useLocale } from "../../src/ui/i18n/locale-provider";
export function WorkNavigation({
  current,
}: {
  current: "work" | "tasks" | "inbound" | "outbound";
}) {
  const { t } = useLocale();
  return (
    <nav
      aria-label={t("workNavigation")}
      className="work-subnavigation mb-5 flex flex-wrap gap-2 border-b border-[var(--border)]"
    >
      {(
        [
          ["work", "/operations/work", "operatorWork"],
          ["inbound", "/operations/inbound", "inbound"],
          ["outbound", "/operations/outbound", "outbound"],
          ["tasks", "/operations/tasks", "workExecutionTasks"],
        ] as const
      ).map(([key, href, label]) => (
        <Link
          key={key}
          href={href}
          aria-current={current === key ? "page" : undefined}
          className={`ui-pressable inline-flex min-h-11 items-center px-3 py-2 text-sm font-medium ${
            current === key
              ? "ui-current-selection"
              : "text-[var(--text-muted)]"
          }`}
        >
          {t(label)}
        </Link>
      ))}
    </nav>
  );
}
