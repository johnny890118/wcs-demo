import type { GetServerSideProps } from "next";
import { withReadOnlyOperationalNavigation } from "../../src/infrastructure/http/operational-request-context";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { workPath } from "../../src/application/operations/work-projection";
import { useState } from "react";
import { OperationsShell } from "../../components/platform/OperationsShell";
import { InventoryNavigation } from "../../components/platform/InventoryNavigation";
import { hasUserPermission } from "../../src/application/access/operational-access";
import {
  isInventoryPage,
  type InventoryPage,
} from "../../src/application/operations/inventory-projection";
import { fetchInventory } from "../../src/infrastructure/http/wcs-api-client";
import { operationalPageAccess } from "../../src/ui/auth/operational-page-access";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { authOptions } from "../api/auth/[...nextauth]";
type Props = {
  initialPage: InventoryPage | null;
  search: string;
  warehouseId: string;
  canViewAudit: boolean;
  exactFilters?: { loadId?: string; locationId?: string };
};
const control =
  "ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold ui-link";
function Inventory({
  initialPage,
  search,
  canViewAudit,
  exactFilters = {},
}: Omit<Props, "warehouseId">) {
  const { t, locale } = useLocale();
  const [items, setItems] = useState(initialPage?.items ?? []);
  const [cursor, setCursor] = useState(initialPage?.nextCursor ?? null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(initialPage === null);
  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch(
        `/api/operations/inventory?${new URLSearchParams({
          search,
          cursor,
          ...exactFilters,
        })}`,
      );
      const payload: unknown = await response.json();
      if (!response.ok || !isInventoryPage(payload)) throw new Error();
      setItems((current) => {
        const ids = new Set(current.map((item) => item.inventoryUnitId));
        return [
          ...current,
          ...payload.items.filter((item) => !ids.has(item.inventoryUnitId)),
        ];
      });
      setCursor(payload.nextCursor);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <h1 className="text-3xl font-black">{t("inventory")}</h1>
      {Object.keys(exactFilters).length ? (
        <div className="mt-3">
          <p className="text-sm text-[var(--text-muted)]">
            {t("exactContextFiltered")}
          </p>
          <Link
            className={control}
            href={
              exactFilters.locationId
                ? `/operations/locations?${new URLSearchParams({
                    id: exactFilters.locationId,
                  })}`
                : `/operations/loads?${new URLSearchParams({
                    id: exactFilters.loadId!,
                  })}`
            }
          >
            {t("exactContextReturnRecord")}
          </Link>
        </div>
      ) : null}
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
        {t("inventoryDescription")}
      </p>
      <form
        action="/operations/inventory"
        method="get"
        className="mt-5 flex flex-wrap items-end gap-2"
      >
        {Object.entries(exactFilters).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm font-semibold">
          {t("inventorySearch")}
          <input
            name="search"
            defaultValue={search}
            maxLength={100}
            className="min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--text)]"
          />
        </label>
        <button type="submit" className={control}>
          {t("inventorySearchAction")}
        </button>
        <Link className={control} href="/operations/inventory">
          {t("inventoryClearSearch")}
        </Link>
      </form>
      {failed ? (
        <p role="alert" className="mt-4 text-sm">
          {t("inventoryUnavailable")}
        </p>
      ) : null}
      {initialPage ? (
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          {t("refreshedAt")} ·{" "}
          {new Intl.DateTimeFormat(locale, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(initialPage.generatedAt))}
        </p>
      ) : null}
      <ul className="mt-5 space-y-4">
        {items.map((item) => (
          <li
            key={item.inventoryUnitId}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <h2 className="break-words text-xl font-bold">
              {item.sku} · {item.location}
            </h2>
            <p className="mt-2 text-sm font-semibold">
              {t(
                item.status === "available"
                  ? "inventoryStateAvailable"
                  : item.status === "reserved"
                    ? "inventoryStateReserved"
                    : item.status === "shipped"
                      ? "inventoryStateShipped"
                      : "inventoryStateQuarantined",
              )}
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              {(
                [
                  ["inventoryBalance", item.quantity],
                  ["inventoryReserved", item.reservedQuantity],
                  ["inventoryUnreserved", item.unreservedQuantity],
                  ["externalLoadId", item.loadExternalId],
                  ["taskLoadLocation", item.loadLocation],
                  ["inventoryOrigin", item.receiptReference],
                ] as const
              ).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-sm text-[var(--text-muted)]">{t(key)}</dt>
                  <dd className="mt-1 break-words font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            {item.locationStatus !== "available" ||
            item.location !== item.loadLocation ||
            item.reservedQuantity > item.quantity ? (
              <p className="mt-4 text-sm font-semibold">
                {t("inventoryReviewRequired")}
              </p>
            ) : null}
            <Link
              className={`${control} mt-3`}
              href={workPath("inbound", item.receiptId)}
            >
              {t("openWorkContext")} · {item.receiptReference}
            </Link>
            {canViewAudit ? (
              <Link
                className={`${control} mt-3`}
                href={`/operations/audit?${new URLSearchParams({
                  resourceType: "InboundReceipt",
                  resourceId: item.receiptId,
                })}`}
              >
                {t("viewReceiptAuditEvidence")}
              </Link>
            ) : null}
            <details className="mt-3 text-xs text-[var(--text-muted)]">
              <summary className="min-h-11 cursor-pointer py-3">
                {t("homeTechnicalDetails")}
              </summary>
              <p className="break-all">{item.inventoryUnitId}</p>
            </details>
          </li>
        ))}
      </ul>
      {!failed && items.length === 0 ? (
        <p className="mt-5 text-sm">{t("inventoryEmpty")}</p>
      ) : null}
      {cursor ? (
        <button
          type="button"
          className={`${control} mt-5`}
          disabled={loading}
          onClick={() => void loadMore()}
        >
          {loading ? t("loadingAudit") : t("inventoryLoadMore")}
        </button>
      ) : null}
      <p className="mt-6 max-w-3xl text-xs leading-5 text-[var(--text-muted)]">
        {t("inventoryQuantityNotice")}
      </p>
      <Link
        className={control}
        href={`/operations/inventory?${new URLSearchParams({
          search,
          ...exactFilters,
        })}`}
      >
        {t("inventoryRefresh")}
      </Link>
    </>
  );
}
export default function InventoryPageView(props: Props) {
  return (
    <OperationsShell current="inventory">
      <InventoryNavigation current="inventory" />
      <Inventory
        key={`${props.warehouseId}:${props.search}:${JSON.stringify(
          props.exactFilters ?? {},
        )}:${props.initialPage?.generatedAt ?? "none"}`}
        initialPage={props.initialPage}
        search={props.search}
        canViewAudit={props.canViewAudit}
        exactFilters={props.exactFilters}
      />
    </OperationsShell>
  );
}
export const getServerSideProps: GetServerSideProps<Props> =
  withReadOnlyOperationalNavigation<Props>(async (context) => {
    const session = await getServerSession(
      context.req,
      context.res,
      authOptions,
    );
    const access = operationalPageAccess(
      session,
      "operations.view",
      context.resolvedUrl ?? "/operations/inventory",
    );
    if (!access.allowed)
      return {
        redirect: { destination: access.destination, permanent: false },
      };
    if (
      context.query.search !== undefined &&
      (typeof context.query.search !== "string" ||
        context.query.search.length > 100)
    )
      return { notFound: true };
    const search = ((context.query.search ?? "") as string).trim();
    const exactFilters: { loadId?: string; locationId?: string } = {};
    for (const key of ["loadId", "locationId"] as const) {
      const value = context.query[key];
      if (
        value !== undefined &&
        (typeof value !== "string" ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            value,
          ))
      )
        return { notFound: true };
      if (typeof value === "string") exactFilters[key] = value;
    }
    let initialPage: InventoryPage | null = null;
    try {
      initialPage = await fetchInventory(access.access, {
        search,
        ...exactFilters,
      });
    } catch {
      initialPage = null;
    }
    return {
      props: {
        session,
        initialPage,
        search,
        exactFilters,
        warehouseId: access.access.currentWarehouseId,
        canViewAudit: hasUserPermission(access.access, "audit.view"),
      },
    };
  });
