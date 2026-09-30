import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import type { OperationalAccess } from "../../src/application/access/operational-access";
import { isOperationalAccess } from "../../src/application/access/operational-access";
import { useLocale } from "../../src/ui/i18n/locale-provider";

export function WarehouseContextControl({
  access,
}: {
  access: OperationalAccess;
}) {
  const { t } = useLocale();
  const { update } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const current = access.principal.warehouseScopes.find(
    (scope) => scope.warehouseId === access.currentWarehouseId,
  );

  if (!current) return <span>{t("warehouseContextUnavailable")}</span>;
  if (access.principal.warehouseScopes.length === 1) {
    return (
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate font-bold text-[var(--text)]">
          {current.name}
        </span>
        <span className="shrink-0 rounded-md bg-[var(--accent-soft)] px-2 py-1 font-mono font-semibold text-[var(--accent-strong)]">
          {current.code}
        </span>
      </span>
    );
  }

  async function changeWarehouse(targetWarehouseId: string) {
    if (targetWarehouseId === access.currentWarehouseId || pending) return;
    setPending(true);
    setFailed(false);
    try {
      const updated = await update({ currentWarehouseId: targetWarehouseId });
      if (
        !isOperationalAccess(updated?.access) ||
        updated.access.currentWarehouseId !== targetWarehouseId
      ) {
        throw new Error("Warehouse context update was not confirmed.");
      }
      await router.replace(router.asPath || "/operations", undefined, {
        scroll: false,
      });
    } catch {
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <div className="min-w-0">
      <label className="flex min-w-0 items-center gap-2 font-semibold">
        <span className="sr-only">{t("warehouseContext")}</span>
        <select
          aria-label={t("warehouseContext")}
          value={access.currentWarehouseId}
          disabled={pending}
          onChange={(event) => void changeWarehouse(event.target.value)}
          className="min-w-0 max-w-64 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-bold text-[var(--text)] disabled:cursor-wait disabled:opacity-60"
        >
          {access.principal.warehouseScopes.map((scope) => (
            <option key={scope.warehouseId} value={scope.warehouseId}>
              {scope.name} · {scope.code}
            </option>
          ))}
        </select>
        {pending ? (
          <span role="status" className="text-[var(--text-muted)]">
            {t("switchingWarehouse")}
          </span>
        ) : null}
      </label>
      {failed ? (
        <p role="alert" className="mt-1 text-xs text-[var(--danger)]">
          {t("warehouseSwitchFailed")}
        </p>
      ) : null}
    </div>
  );
}
