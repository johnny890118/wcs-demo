import { formatOperationalTime } from "../../src/ui/format-operational-time";
import { ClockIcon } from "@heroicons/react/24/outline";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  DiagnosticDetails,
  PageHeading,
  Record,
} from "../../components/ui/workspace";
import {
  auditActionLabel,
  auditResourceLabel,
} from "../../src/ui/audit-labels";
import { OperationsShell } from "../../components/platform/OperationsShell";
import {
  isAuditEventPage,
  type AuditEventPage,
} from "../../src/application/audit/audit-projection";
import { fetchAuditEvents } from "../../src/infrastructure/http/wcs-api-client";
import { operationalPageAccess } from "../../src/ui/auth/operational-page-access";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { authOptions } from "../api/auth/[...nextauth]";

type PageProps = {
  initialPage: AuditEventPage | null;
  filters: {
    resourceType?: string;
    resourceId?: string;
    correlationId?: string;
  };
};

const first = (value: string | string[] | undefined) =>
  typeof value === "string" ? value : undefined;

export default function AuditHistoryPage({ initialPage, filters }: PageProps) {
  const { locale, t } = useLocale();
  const [events, setEvents] = useState(initialPage?.events ?? []);
  const [nextCursor, setNextCursor] = useState(initialPage?.nextCursor ?? null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(initialPage === null);

  const loadOlder = async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    setFailed(false);
    const search = new URLSearchParams({ ...filters, cursor: nextCursor });
    try {
      const response = await fetch(`/api/operations/audit?${search}`);
      const payload: unknown = await response.json();
      if (!response.ok || !isAuditEventPage(payload)) throw new Error();
      setEvents((current) => [...current, ...payload.events]);
      setNextCursor(payload.nextCursor);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <OperationsShell current="audit">
      <header>
        <PageHeading
          title={t("accountableHistory")}
          description={t("auditHistoryDescription")}
        />
        {Object.keys(filters).length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-md bg-[var(--surface-muted)] px-3 py-1.5 font-mono text-[var(--text)]">
              {filters.correlationId ??
                `${filters.resourceType ?? "resource"}:${
                  filters.resourceId ?? ""
                }`}
            </span>
            <Link
              href="/operations/audit"
              className="ui-link font-bold underline underline-offset-4"
            >
              {t("clearAuditFilter")}
            </Link>
          </div>
        ) : null}
      </header>

      {failed ? (
        <div
          role="alert"
          className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
        >
          <p className="font-bold">{t("auditUnavailable")}</p>
        </div>
      ) : null}

      <section aria-label={t("auditEvents")} className="mt-8 space-y-3">
        {events.length === 0 && !failed ? (
          <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 text-sm text-[var(--text-muted)]">
            {t("noAuditEvents")}
          </p>
        ) : null}
        {events.map((event) => (
          <Record key={event.eventId}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">
                    {auditActionLabel(event.action, event.knownAction, locale)}
                  </h2>
                  {!event.knownAction ? (
                    <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                      {t("unknownAuditAction")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 break-all text-sm text-[var(--text-muted)]">
                  {auditResourceLabel(event.resource.type, locale)}
                </p>
                <p className="mt-1 break-words text-sm text-[var(--text-muted)]">
                  {t("actor")}: {event.actor.id}
                </p>
              </div>
              <p className="flex shrink-0 items-center gap-2 text-xs text-[var(--text-muted)]">
                <ClockIcon className="h-4 w-4" aria-hidden="true" />
                {formatOperationalTime(event.occurredAt)}
              </p>
            </div>
            <DiagnosticDetails title={t("homeTechnicalDetails")}>
              <p className="mb-3 break-all font-mono text-sm">{event.action}</p>
              <p className="mb-3 break-all font-mono text-sm">
                {event.resource.type}:{event.resource.id}
              </p>
              <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-[var(--text-muted)]">{t("actor")}</dt>
                  <dd className="mt-1 break-all font-mono">
                    {event.actor.type}:{event.actor.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">
                    {t("correlation")}
                  </dt>
                  <dd className="mt-1 break-all font-mono">
                    <Link
                      className="underline underline-offset-4"
                      href={`/operations/audit?correlationId=${encodeURIComponent(
                        event.correlationId,
                      )}`}
                    >
                      {event.correlationId}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">{t("eventId")}</dt>
                  <dd className="mt-1 break-all font-mono">{event.eventId}</dd>
                </div>
                {Object.entries(event.evidence).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-[var(--text-muted)]">{key}</dt>
                    <dd className="mt-1 break-all font-mono">
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </DiagnosticDetails>
          </Record>
        ))}
      </section>
      {nextCursor ? (
        <Button
          variant="primary"
          type="button"
          disabled={loading}
          onClick={() => void loadOlder()}
          className="mt-6"
        >
          {loading ? t("loadingAudit") : t("loadOlderAudit")}
        </Button>
      ) : null}
    </OperationsShell>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (
  context,
) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  const access = operationalPageAccess(
    session,
    "audit.view",
    context.resolvedUrl,
  );
  if (!access.allowed)
    return {
      redirect: {
        destination: access.destination,
        permanent: false,
      },
    };
  const filters = {
    ...(first(context.query.resourceType)
      ? { resourceType: first(context.query.resourceType) }
      : {}),
    ...(first(context.query.resourceId)
      ? { resourceId: first(context.query.resourceId) }
      : {}),
    ...(first(context.query.correlationId)
      ? { correlationId: first(context.query.correlationId) }
      : {}),
  };
  try {
    return {
      props: {
        session,
        filters,
        initialPage: await fetchAuditEvents(access.access, filters),
      },
    };
  } catch {
    return { props: { session, filters, initialPage: null } };
  }
};
