import Link from "next/link";
import { useLocale } from "../../src/ui/i18n/locale-provider";
export function WarehouseNavigation({
  current,
}: {
  current: "live" | "topology";
}) {
  const { t } = useLocale();
  return (
    <nav
      aria-label={t("warehouseWorkspace")}
      className="mb-5 flex flex-wrap gap-2"
    >
      {(
        [
          { key: "live", href: "/operations/warehouse", label: "liveView" },
          {
            key: "topology",
            href: "/operations/warehouse/topology",
            label: "warehouseMapTitle",
          },
        ] as const
      ).map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={current === item.key ? "page" : undefined}
          className={`ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold text-[var(--text-muted)] ${
            current === item.key ? "ui-current-selection" : ""
          }`}
        >
          {t(item.label)}
        </Link>
      ))}
    </nav>
  );
}
