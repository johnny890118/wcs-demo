import { ContextNavigation, ContextNavigationLink } from "../ui/navigation";
import { useLocale } from "../../src/ui/i18n/locale-provider";
export function WorkNavigation({
  current,
}: {
  current: "work" | "tasks" | "inbound" | "outbound";
}) {
  const { t } = useLocale();
  return (
    <ContextNavigation label={t("workNavigation")}>
      {(
        [
          ["work", "/operations/work", "operatorWork"],
          ["inbound", "/operations/inbound", "inbound"],
          ["outbound", "/operations/outbound", "outbound"],
          ["tasks", "/operations/tasks", "workExecutionTasks"],
        ] as const
      ).map(([key, href, label]) => (
        <ContextNavigationLink key={key} href={href} current={current === key}>
          {t(label)}
        </ContextNavigationLink>
      ))}
    </ContextNavigation>
  );
}
