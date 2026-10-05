import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { OperationsShell } from "../../../components/platform/OperationsShell";
import { workPath } from "../../../src/application/operations/work-projection";
import { workAttention } from "../../../src/application/operations/work-continuation";
import {
  parseWorkQueueQuery,
  type WorkQueuePage,
  type WorkQueueQuery,
} from "../../../src/application/operations/work-queue";
import { withReadOnlyOperationalNavigation } from "../../../src/infrastructure/http/operational-request-context";
import {
  fetchWorkQueue,
  WcsProjectionError,
} from "../../../src/infrastructure/http/wcs-api-client";
import { operationalPageAccess } from "../../../src/ui/auth/operational-page-access";
import { useLocale } from "../../../src/ui/i18n/locale-provider";
import type { MessageKey } from "../../../src/ui/i18n/catalogs";
import { authOptions } from "../../api/auth/[...nextauth]";
type Props = { page: WorkQueuePage | null; query: WorkQueueQuery };
const link =
  "ui-pressable inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm font-semibold text-[var(--accent-strong)]";
export default function WorkQueue({ page, query }: Props) {
  const { t, locale } = useLocale();
  const view = query.view ?? "active";
  return (
    <OperationsShell current="work">
      <h1 className="text-3xl font-black">{t("operatorWork")}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
        {t("workQueueDescription")}
      </p>
      <nav
        aria-label={t("workQueueView")}
        className="mt-4 flex flex-wrap gap-2"
      >
        {(["active", "all"] as const).map((v) => (
          <Link
            key={v}
            className={link}
            aria-current={view === v ? "page" : undefined}
            href={`/operations/work?view=${v}`}
          >
            {t(v === "active" ? "workQueueActive" : "workQueueAll")}
          </Link>
        ))}
      </nav>
      {!page ? (
        <p role="alert" className="mt-5">
          {t("workQueueUnavailable")}
        </p>
      ) : (
        <>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            {t("refreshedAt")} ·{" "}
            {new Intl.DateTimeFormat(locale, {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(page.generatedAt))}
          </p>
          <ul className="mt-5 space-y-3">
            {page.works.map((w) => (
              <li
                key={`${w.flow}:${w.workId}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
              >
                <h2 className="break-words text-xl font-bold">
                  {w.externalReference}
                </h2>
                <p className="mt-2 text-sm">
                  {t(w.flow)} · {t("workRecordedStatus")}:{" "}
                  {t(`workStatus_${w.status}` as MessageKey)}
                </p>
                <p className="mt-2 text-sm leading-6">
                  {t(`workAttention_${workAttention(w)}` as MessageKey)}
                </p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {t("workCoverage")}: {w.execution.qualifiedTaskCount} /{" "}
                  {w.execution.referencedTaskCount}
                </p>
                <Link
                  className={`${link} mt-2`}
                  href={workPath(w.flow, w.workId)}
                >
                  {t("openWorkContext")}
                  <span className="sr-only"> · {w.externalReference}</span>
                </Link>
              </li>
            ))}
          </ul>
          {!page.works.length ? (
            <p role="status" className="mt-5">
              {t("workQueueEmpty")}
            </p>
          ) : null}
          {page.nextCursor ? (
            <Link
              className={`${link} mt-4`}
              href={`/operations/work?${new URLSearchParams({
                view,
                cursor: page.nextCursor,
                ...(query.limit ? { limit: String(query.limit) } : {}),
              })}`}
            >
              {t("workQueueNext")}
            </Link>
          ) : null}
        </>
      )}
      <p className="mt-6 max-w-3xl text-xs leading-5 text-[var(--text-muted)]">
        {t("workQueueCurrency")}
      </p>
      <Link className={link} href={`/operations/work?view=${view}`}>
        {t("workQueueRefresh")}
      </Link>
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
      context.resolvedUrl ?? "/operations/work",
    );
    if (!access.allowed)
      return {
        redirect: { destination: access.destination, permanent: false },
      };
    const query = parseWorkQueueQuery(context.query);
    if (!query) return { notFound: true };
    let page: WorkQueuePage | null = null;
    try {
      page = await fetchWorkQueue(access.access, query);
    } catch (error) {
      if (error instanceof WcsProjectionError && error.status === 400)
        return { notFound: true };
    }
    return { props: { session, page, query } };
  });
