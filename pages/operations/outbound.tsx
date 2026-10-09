import type { GetServerSideProps } from "next";
import { withReadOnlyOperationalNavigation } from "../../src/infrastructure/http/operational-request-context";
import { getServerSession } from "next-auth/next";
import { OperationsShell } from "../../components/platform/OperationsShell";
import { WorkNavigation } from "../../components/platform/WorkNavigation";
import { PageHeading } from "../../components/ui/workspace";
import { OutboundWorkflowPanel } from "../../components/platform/OutboundWorkflowPanel";
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

export default function OutboundOperationsPage({
  details,
  canCreate,
  canExecute,
  canViewAudit,
}: PageProps) {
  const { t } = useLocale();
  return (
    <OperationsShell current="outbound" workNavigationAfterHeader>
      <PageHeading title={t("outboundWorkflowTitle")} />
      <div>
        <WorkNavigation current="outbound" />
      </div>
      <div className="mt-4">
        {details ? (
          <OutboundWorkflowPanel
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
      "/operations/outbound",
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
      canCreate: hasUserPermission(access.access, "outbound.create"),
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
