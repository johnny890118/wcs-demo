import { createContext, useContext } from "react";
import { useLocale } from "../../src/ui/i18n/locale-provider";

// Presentation only: labels come from the existing validated session. This
// context grants no authority and does not select warehouse or execution source.
export const OperationTargetLabels = createContext<{
  warehouse: string | null;
  source: string | null;
} | null>(null);

export function OperationTargetContext({
  sourceOnly = false,
}: {
  sourceOnly?: boolean;
}) {
  const labels = useContext(OperationTargetLabels);
  const { t } = useLocale();
  if (!labels) return null;
  return (
    <p
      aria-label={t("operationalContext")}
      className="mb-3 flex flex-wrap gap-x-3 text-sm text-[var(--text-muted)]"
    >
      {!sourceOnly ? (
        <span>
          {t("warehouseContext")}:{" "}
          {labels.warehouse ?? t("warehouseContextUnavailable")}
        </span>
      ) : null}
      <span>{labels.source ?? t("warehouseContextUnavailable")}</span>
    </p>
  );
}
