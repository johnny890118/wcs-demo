import type { GetServerSideProps } from "next";
import { withReadOnlyOperationalNavigation } from "../../src/infrastructure/http/operational-request-context";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { useState } from "react";
import { OperationsShell } from "../../components/platform/OperationsShell";
import { InventoryNavigation } from "../../components/platform/InventoryNavigation";
import {
  isLocationPage,
  type LocationPage,
} from "../../src/application/operations/location-projection";
import { fetchLocations } from "../../src/infrastructure/http/wcs-api-client";
import { operationalPageAccess } from "../../src/ui/auth/operational-page-access";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { authOptions } from "../api/auth/[...nextauth]";
type Props = {
  initialPage: LocationPage | null;
  search: string;
  warehouseId: string;
  exactId?: string;
};
const control =
  "ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold ui-link";
function Locations({
  initialPage,
  search,
  exactId,
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
        `/api/operations/locations?${new URLSearchParams({
          search,
          cursor,
          ...(exactId ? { id: exactId } : {}),
        })}`,
      );
      const payload: unknown = await response.json();
      if (!response.ok || !isLocationPage(payload)) throw new Error();
      setItems((current) => {
        const ids = new Set(current.map((item) => item.locationId));
        return [
          ...current,
          ...payload.items.filter((item) => !ids.has(item.locationId)),
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
      <h1 className="text-3xl font-black">{t("locations")}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
        {t("locationsDescription")}
      </p>
      <form
        action="/operations/locations"
        method="get"
        className="mt-5 flex flex-wrap items-end gap-2"
      >
        {exactId ? <input type="hidden" name="id" value={exactId} /> : null}
        <label className="flex min-w-0 flex-1 flex-col gap-2 text-sm font-semibold">
          {t("locationSearch")}
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
        <Link className={control} href="/operations/locations">
          {t("inventoryClearSearch")}
        </Link>
      </form>
      {failed ? (
        <p role="alert" className="mt-4 text-sm">
          {t("locationsUnavailable")}
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
            key={item.locationId}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <h2 className="break-words text-xl font-bold">{item.code}</h2>
            <p className="mt-2 text-sm font-semibold">
              {t(
                item.status === "available"
                  ? "locationAvailable"
                  : item.status === "blocked"
                    ? "locationBlocked"
                    : "locationDisabled",
              )}
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-[var(--text-muted)]">
                  {t("locationKind")}
                </dt>
                <dd className="mt-1 font-semibold">
                  {t(
                    item.kind === "receiving"
                      ? "locationReceiving"
                      : item.kind === "storage"
                        ? "locationStorage"
                        : item.kind === "shipping"
                          ? "locationShipping"
                          : "locationCustomKind",
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--text-muted)]">
                  {t("locationRecordedLoads")}
                </dt>
                <dd className="mt-1 font-semibold">{item.recordedLoads}</dd>
              </div>
              <div>
                <dt className="text-sm text-[var(--text-muted)]">
                  {t("locationStockRecords")}
                </dt>
                <dd className="mt-1 font-semibold">{item.stockRecords}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm font-semibold">
              {t(item.binding ? "locationBound" : "locationUnbound")}
            </p>
            <Link
              className={`${control} mt-3`}
              href={`/operations/inventory?${new URLSearchParams({
                locationId: item.locationId,
              })}`}
            >
              {t("locationSearchStock")}
            </Link>
            <Link
              className={`${control} mt-3`}
              href={`/operations/loads?${new URLSearchParams({
                locationId: item.locationId,
              })}`}
            >
              {t("locationSearchLoads")}
            </Link>
            <details className="mt-3 text-xs text-[var(--text-muted)]">
              <summary className="min-h-11 cursor-pointer py-3">
                {t("homeTechnicalDetails")}
              </summary>
              <p className="break-all">
                {item.locationId} · {item.kind}
              </p>
              <p className="break-words">{item.capabilities.join(", ")}</p>
              {item.binding ? (
                <p className="break-all">
                  {item.binding.topologyId} · {item.binding.revision} ·{" "}
                  {item.binding.nodeId}
                </p>
              ) : null}
            </details>
          </li>
        ))}
      </ul>
      {!failed && items.length === 0 ? (
        <p className="mt-5 text-sm">{t("locationsEmpty")}</p>
      ) : null}
      {cursor ? (
        <button
          type="button"
          className={`${control} mt-5`}
          disabled={loading}
          onClick={() => void loadMore()}
        >
          {loading ? t("loadingAudit") : t("locationsMore")}
        </button>
      ) : null}
      <p className="mt-6 max-w-3xl text-xs leading-5 text-[var(--text-muted)]">
        {t("locationsNotice")}
      </p>
      <Link
        className={control}
        href={`/operations/locations?${new URLSearchParams({
          search,
          ...(exactId ? { id: exactId } : {}),
        })}`}
      >
        {t("locationsRefresh")}
      </Link>
    </>
  );
}
export default function LocationsPage(props: Props) {
  return (
    <OperationsShell current="inventory" titleKey="locations">
      <InventoryNavigation current="locations" />
      <Locations
        key={`${props.warehouseId}:${props.search}:${props.exactId ?? "all"}:${
          props.initialPage?.generatedAt ?? "none"
        }`}
        initialPage={props.initialPage}
        search={props.search}
        exactId={props.exactId}
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
      context.resolvedUrl ?? "/operations/locations",
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
    const exactId = context.query.id;
    if (
      exactId !== undefined &&
      (typeof exactId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          exactId,
        ))
    )
      return { notFound: true };
    let initialPage: LocationPage | null = null;
    try {
      initialPage = await fetchLocations(access.access, {
        search,
        id: exactId,
      });
    } catch {
      initialPage = null;
    }
    return {
      props: {
        session,
        initialPage,
        search,
        ...(exactId ? { exactId } : {}),
        warehouseId: access.access.currentWarehouseId,
      },
    };
  });
