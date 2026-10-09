import type { GetServerSideProps } from "next";
import { withReadOnlyOperationalNavigation } from "../../src/infrastructure/http/operational-request-context";
import { getServerSession } from "next-auth/next";
import { AlarmRecoveryPanel } from "../../components/platform/AlarmRecoveryPanel";
import { ExceptionAttention } from "../../components/platform/ExceptionAttention";
import { OperationsShell } from "../../components/platform/OperationsShell";
import { PageHeading } from "../../components/ui/workspace";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import { hasUserPermission } from "../../src/application/access/operational-access";
import { fetchOperationsDetails } from "../../src/infrastructure/http/wcs-api-client";
import { operationalPageAccess } from "../../src/ui/auth/operational-page-access";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { authOptions } from "../api/auth/[...nextauth]";

type PageProps = {
  details: OperationsDetails | null;
  canAcknowledge: boolean;
  canRecover: boolean;
  canViewAudit: boolean;
};

export default function AlarmOperationsPage({
  details,
  canAcknowledge,
  canRecover,
  canViewAudit,
}: PageProps) {
  const { t } = useLocale();
  return (
    <OperationsShell current="alarms">
      <PageHeading
        title={t("operatorExceptions")}
        description={t("alarmWorkflowDescription")}
      />
      {details ? <ExceptionAttention details={details} /> : null}
      <div className="mt-8">
        {details ? (
          <AlarmRecoveryPanel
            details={details}
            canAcknowledge={canAcknowledge}
            canRecover={canRecover}
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
      "/operations/alarms",
    );
    if (!access.allowed)
      return {
        redirect: {
          destination: access.destination,
          permanent: false,
        },
      };
    const capabilities = {
      canAcknowledge: hasUserPermission(access.access, "alarm.acknowledge"),
      canRecover: hasUserPermission(access.access, "alarm.recover"),
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
