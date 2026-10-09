import { ContextNavigation, ContextNavigationLink } from "../ui/navigation";
import { useLocale } from "../../src/ui/i18n/locale-provider";
export function InventoryNavigation({
  current,
}: {
  current: "inventory" | "loads" | "locations";
}) {
  const { t } = useLocale();
  return (
    <ContextNavigation label={t("inventoryWorkspace")}>
      {(["inventory", "loads", "locations"] as const).map((surface) => (
        <ContextNavigationLink
          key={surface}
          href={`/operations/${surface}`}
          current={surface === current}
        >
          {t(surface)}
        </ContextNavigationLink>
      ))}
    </ContextNavigation>
  );
}
