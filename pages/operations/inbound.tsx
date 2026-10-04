import type { GetServerSideProps } from "next";
import { withReadOnlyOperationalNavigation } from "../../src/infrastructure/http/operational-request-context";
import { getServerSession } from "next-auth/next";
import { InboundWorkflowPanel } from "../../components/platform/InboundWorkflowPanel";
import { OperationsShell } from "../../components/platform/OperationsShell";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import { hasUserPermission } from "../../src/application/access/operational-access";
import { fetchOperationsDetails } from "../../src/infrastructure/http/wcs-api-client";
import { operationalPageAccess } from "../../src/ui/auth/operational-page-access";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { authOptions } from "../api/auth/[...nextauth]";

type PageProps = {
  details: OperationsDetails | null;
  canCreate: boolean;
  canExecute: boolean;
  canViewAudit: boolean;
};

export default function InboundOperationsPage({
  details,
  canCreate,
  canExecute,
  canViewAudit,
}: PageProps) {
  const { t } = useLocale();
  return (
    <OperationsShell current="inbound">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
          {t("inbound")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.03em]">
          {t("inboundWorkflowTitle")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
          {t("inboundWorkflowDescription")}
        </p>
      </header>
      <div className="mt-8">
        {details ? (
          <InboundWorkflowPanel
            details={details}
            canCreate={canCreate}
            canExecute={canExecute}
            canViewAudit={canViewAudit}
          />
        ) : (
          <div
            role="status"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
          >
            <p className="font-bold">{t("serviceUnavailable")}</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {t("serviceUnavailableDescription")}
            </p>
          </div>
        )}
      </div>
    </OperationsShell>
  );
}

export const getServerSideProps: GetServerSideProps<PageProps> =
  withReadOnlyOperationalNavigation<PageProps>(async (context) => {
    const session = await getServerSession(
      context.req,
      context.res,
      authOptions,
    );
    const access = operationalPageAccess(
      session,
      "operations.view",
      "/operations/inbound",
    );
    if (!access.allowed) {
      return {
        redirect: {
          destination: access.destination,
          permanent: false,
        },
      };
    }
    const capabilities = {
      canCreate: hasUserPermission(access.access, "inbound.create"),
      canExecute: hasUserPermission(access.access, "transport.execute"),
      canViewAudit: hasUserPermission(access.access, "audit.view"),
    };
    try {
      return {
        props: {
          session,
          details: await fetchOperationsDetails(access.access),
          ...capabilities,
        },
      };
    } catch {
      return { props: { session, details: null, ...capabilities } };
    }
  });
