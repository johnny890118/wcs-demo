import type { GetServerSideProps } from "next";
import { withReadOnlyOperationalNavigation } from "../../src/infrastructure/http/operational-request-context";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
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
};
const control =
  "ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold text-[var(--accent-strong)]";
function Loads({
  initialPage,
  search,
  canViewAudit,
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
        `/api/operations/loads?${new URLSearchParams({ search, cursor })}`,
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
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
        {t("loadsDescription")}
      </p>
      <form
        action="/operations/loads"
        method="get"
        className="mt-5 flex flex-wrap items-end gap-2"
      >
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
                search: item.externalId,
              })}`}
            >
              {t("loadViewInventory")}
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
        <button
          type="button"
          className={`${control} mt-5`}
          disabled={loading}
          onClick={() => void loadMore()}
        >
          {loading ? t("loadingAudit") : t("loadMoreLoads")}
        </button>
      ) : null}
      <p className="mt-6 max-w-3xl text-xs leading-5 text-[var(--text-muted)]">
        {t("loadsEvidenceNotice")}
      </p>
      <Link
        className={control}
        href={`/operations/loads?${new URLSearchParams({ search })}`}
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
        key={`${props.warehouseId}:${props.search}:${
          props.initialPage?.generatedAt ?? "none"
        }`}
        initialPage={props.initialPage}
        search={props.search}
        canViewAudit={props.canViewAudit}
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
      "/operations/loads",
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
    let initialPage: LoadPage | null = null;
    try {
      initialPage = await fetchLoads(access.access, { search });
    } catch {
      initialPage = null;
    }
    return {
      props: {
        session,
        initialPage,
        search,
        warehouseId: access.access.currentWarehouseId,
        canViewAudit: hasUserPermission(access.access, "audit.view"),
      },
    };
  });
