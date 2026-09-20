import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { AlarmRecoveryPanel } from "../../components/platform/AlarmRecoveryPanel";
import { OperationsShell } from "../../components/platform/OperationsShell";
import type { OperationsDetails } from "../../src/application/operations/operations-details";
import { fetchOperationsDetails } from "../../src/infrastructure/http/wcs-api-client";
import { operationalPageAccess } from "../../src/ui/auth/operational-page-access";
import { useLocale } from "../../src/ui/i18n/locale-provider";
import { authOptions } from "../api/auth/[...nextauth]";

type PageProps = { details: OperationsDetails | null };

export default function AlarmOperationsPage({ details }: PageProps) {
  const { t } = useLocale();
  return (
    <OperationsShell current="alarms">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
          {t("alarmOperations")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.03em]">
          {t("alarmWorkflowTitle")}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
          {t("alarmWorkflowDescription")}
        </p>
      </header>
      <div className="mt-8">
        {details ? (
          <AlarmRecoveryPanel details={details} />
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

export const getServerSideProps: GetServerSideProps<PageProps> = async (
  context,
) => {
  const session = await getServerSession(context.req, context.res, authOptions);
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
  try {
    return {
      props: {
        session,
        details: await fetchOperationsDetails(access.access),
      },
    };
  } catch {
    return { props: { session, details: null } };
  }
};
