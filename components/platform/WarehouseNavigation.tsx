import { ContextNavigation, ContextNavigationLink } from "../ui/navigation";
import { useLocale } from "../../src/ui/i18n/locale-provider";
export function WarehouseNavigation({
  current,
}: {
  current: "live" | "topology";
}) {
  const { t } = useLocale();
  return (
    <ContextNavigation label={t("warehouseWorkspace")}>
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
        <ContextNavigationLink
          key={item.key}
          href={item.href}
          current={current === item.key}
        >
          {t(item.label)}
        </ContextNavigationLink>
      ))}
    </ContextNavigation>
  );
}
