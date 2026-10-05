import Link from "next/link";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import { projectOperationsHome } from "../../src/application/operations/operations-home";
import { contextPath } from "../../src/application/operations/exact-context";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import type { MessageKey } from "../../src/ui/i18n/catalogs";

export function ExceptionAttention({
  details,
}: {
  details: OperationsDetails;
}) {
  const { locale, t } = useLocale();
  const home = projectOperationsHome(details);
  // Preserve alarm identity directly; code/display text is never a resolver.
  const alarms = details.alarms.filter(
    (alarm) => alarm.status === "active" || alarm.status === "acknowledged",
  );
  const items = [
    ...alarms.map((alarm) => ({
      key: `alarm-${alarm.alarmId}`,
      reference: alarm.code,
      reason: alarm.status === "active" ? "active_alarm" : "acknowledged_alarm",
      href: contextPath(alarm.taskId, "exception", alarm.alarmId),
    })),
    ...home.attention
      .filter((item) => item.kind !== "alarm")
      .map((item) => ({
        key: `${item.kind}-${
          item.kind === "equipment" ? item.equipmentId : item.taskId
        }`,
        reference: item.reference,
        reason: item.reason,
        href:
          item.kind === "task" && item.taskId
            ? contextPath(item.taskId, "exception")
            : `/operations/warehouse?${new URLSearchParams({
                equipmentId: item.equipmentId!,
              })}`,
      })),
  ];
  return (
    <section
      aria-labelledby="exception-attention"
      className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
    >
      <h2 id="exception-attention" className="text-xl font-bold">
        {t("attentionRequired")}
      </h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {t("exceptionSnapshotNotice")}
      </p>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        {t("refreshedAt")} ·{" "}
        {new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(details.generatedAt))}
      </p>
      {Object.values(home.coverage).some(Boolean) ? (
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {t("homeCoverageNotice")}
        </p>
      ) : null}
      {items.length ? (
        <ul className="mt-4 divide-y divide-[var(--border)]">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-semibold">
                  {t(`homeReason_${item.reason}` as MessageKey)}
                </p>
                <p className="mt-1 break-words text-sm text-[var(--text-muted)]">
                  {item.reference}
                </p>
              </div>
              <Link
                className="ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold text-[var(--accent-strong)]"
                href={item.href}
              >
                {t("reviewOperationalEvidence")}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          {t("noAttentionRequired")}
        </p>
      )}
    </section>
  );
}
