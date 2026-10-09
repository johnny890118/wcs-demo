import { Button } from "../../components/ui/button";
import { Input, FieldLabel } from "../../components/ui/field";
import { formatOperationalTime } from "../../src/ui/format-operational-time";
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
  isLoadPage,
  type LoadPage,
} from "../../src/application/operations/load-projection";
import { fetchLoads } from "../../src/infrastructure/http/wcs-api-client";
import { operationalPageAccess } from "../../src/ui/auth/operational-page-access";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { authOptions } from "../api/auth/[...nextauth]";
type Props = {
  initialPage: LoadPage | null;
  search: string;
  warehouseId: string;
  canViewAudit: boolean;
  exactFilters?: { id?: string; locationId?: string };
};
const control =
  "ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold ui-link";
function Loads({
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
        `/api/operations/loads?${new URLSearchParams({
          search,
          cursor,
          ...exactFilters,
        })}`,
      );
      const payload: unknown = await response.json();
      if (!response.ok || !isLoadPage(payload)) throw new Error();
      setItems((current) => {
        const ids = new Set(current.map((item) => item.loadId));
        return [
          ...current,
          ...payload.items.filter((item) => !ids.has(item.loadId)),
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
      <h1 className="text-3xl font-black">{t("loads")}</h1>
      {Object.keys(exactFilters).length ? (
        <div className="mt-3">
          <p className="text-sm text-[var(--text-muted)]">
            {t("exactContextFiltered")}
          </p>
          {exactFilters.locationId ? (
            <Link
              className={control}
              href={`/operations/locations?${new URLSearchParams({
                id: exactFilters.locationId,
              })}`}
            >
              {t("exactContextReturnRecord")}
            </Link>
          ) : null}
        </div>
      ) : null}
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
        {t("loadsDescription")}
      </p>
      <form
        action="/operations/loads"
        method="get"
        className="mt-5 flex flex-wrap items-end gap-2"
      >
        {Object.entries(exactFilters).map(([key, value]) => (
          <Input key={key} type="hidden" name={key} value={value} />
        ))}
        <FieldLabel className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
          {t("inventorySearch")}
          <Input
            name="search"
            defaultValue={search}
            maxLength={100}
            className="w-full"
          />
        </FieldLabel>
        <Button variant="secondary" type="submit" className="shrink-0">
          {t("inventorySearchAction")}
        </Button>
        <Link className={control} href="/operations/loads">
          {t("inventoryClearSearch")}
        </Link>
      </form>
      {failed ? (
        <p role="alert" className="mt-4 text-sm">
          {t("loadsUnavailable")}
        </p>
      ) : null}
      {initialPage ? (
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          {t("refreshedAt")} · {formatOperationalTime(initialPage.generatedAt)}
        </p>
      ) : null}
      <ul className="mt-5 space-y-4">
        {items.map((item) => (
          <li
            key={item.loadId}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <h2 className="break-words text-xl font-bold">{item.externalId}</h2>
            <p className="mt-2 text-sm font-semibold">
              {t(
                item.status === "received"
                  ? "loadReceived"
                  : item.status === "in_transit"
                    ? "loadInTransit"
                    : "loadStored",
              )}
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              {(
                [
                  ["sku", item.sku],
                  ["taskLoadLocation", item.location],
                  ["loadReceivedQuantity", item.receivedQuantity],
                  [
                    "inventoryBalance",
                    item.inventory?.quantity ?? t("loadInventoryUnknown"),
                  ],
                  ["inventoryOrigin", item.receiptReference],
                ] as const
              ).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-sm text-[var(--text-muted)]">{t(key)}</dt>
                  <dd className="mt-1 break-words font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            {item.inventory ? (
              <p className="mt-3 text-sm font-semibold">
                <span>
                  {t(
                    item.inventory.status === "shipped"
                      ? "inventoryStateShipped"
                      : item.inventory.status === "quarantined"
                        ? "inventoryStateQuarantined"
                        : item.inventory.status === "reserved"
                          ? "inventoryStateReserved"
                          : "inventoryStateAvailable",
                  )}
                </span>{" "}
                · {item.inventory.location}
              </p>
            ) : null}
            {item.inventory && item.inventory.location !== item.location ? (
              <p className="mt-3 text-sm font-semibold">
                {t("inventoryReviewRequired")}
              </p>
            ) : null}
            <Link
              className={`${control} mt-3`}
              href={`/operations/inventory?${new URLSearchParams({
                loadId: item.loadId,
              })}`}
            >
              {t("loadViewInventory")}
            </Link>
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
              <p className="break-all">{item.loadId}</p>
            </details>
          </li>
        ))}
      </ul>
      {!failed && items.length === 0 ? (
        <p className="mt-5 text-sm">{t("loadsEmpty")}</p>
      ) : null}
      {cursor ? (
        <Button
          variant="secondary"
          type="button"
          className={`${control} mt-5`}
          disabled={loading}
          onClick={() => void loadMore()}
        >
          {loading ? t("loadingAudit") : t("loadMoreLoads")}
        </Button>
      ) : null}
      <p className="mt-6 max-w-3xl text-xs leading-5 text-[var(--text-muted)]">
        {t("loadsEvidenceNotice")}
      </p>
      <Link
        className={control}
        href={`/operations/loads?${new URLSearchParams({
          search,
          ...exactFilters,
        })}`}
      >
        {t("loadsRefresh")}
      </Link>
    </>
  );
}
export default function LoadsPage(props: Props) {
  return (
    <OperationsShell current="inventory" titleKey="loads">
      <InventoryNavigation current="loads" />
      <Loads
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
      context.resolvedUrl ?? "/operations/loads",
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
    const exactFilters: { id?: string; locationId?: string } = {};
    for (const key of ["id", "locationId"] as const) {
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
    let initialPage: LoadPage | null = null;
    try {
      initialPage = await fetchLoads(access.access, {
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
