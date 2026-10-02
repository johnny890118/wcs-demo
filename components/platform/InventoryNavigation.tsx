import Link from "next/link";
import { useLocale } from "../../src/ui/i18n/locale-provider";
export function InventoryNavigation({
  current,
}: {
  current: "inventory" | "loads";
}) {
  const { t } = useLocale();
  return (
    <nav
      aria-label={t("inventoryWorkspace")}
      className="mb-5 flex flex-wrap gap-2"
    >
      {(["inventory", "loads"] as const).map((surface) => (
        <Link
          key={surface}
          href={`/operations/${surface}`}
          aria-current={surface === current ? "page" : undefined}
          className={`ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold text-[var(--accent-strong)] ${
            surface === current ? "bg-[var(--accent-soft)]" : ""
          }`}
        >
          {t(surface)}
        </Link>
      ))}
    </nav>
  );
}
