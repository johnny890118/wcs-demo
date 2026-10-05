import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { OperationsShell } from "../../../../../../components/platform/OperationsShell";
import { WorkExecutionPanel } from "../../../../../../components/platform/WorkExecutionPanel";
import { hasUserPermission } from "../../../../../../src/application/access/operational-access";
import type { TaskDetail } from "../../../../../../src/application/operations/task-projection";
import type { OperationsDetails } from "../../../../../../src/application/operations/operations-details";
import {
  belongsToWork,
  workResumePath,
} from "../../../../../../src/application/operations/work-continuation";
import {
  workIdPattern,
  type WorkFlow,
  workPath,
} from "../../../../../../src/application/operations/work-projection";
import {
  fetchTaskDetail,
  fetchOperationsDetails,
  WcsProjectionError,
} from "../../../../../../src/infrastructure/http/wcs-api-client";
import { withReadOnlyOperationalNavigation } from "../../../../../../src/infrastructure/http/operational-request-context";
import { operationalPageAccess } from "../../../../../../src/ui/auth/operational-page-access";
import { useLocale } from "../../../../../../src/ui/i18n/locale-provider";
import { authOptions } from "../../../../../api/auth/[...nextauth]";

type Props = {
  detail: TaskDetail | null;
  equipment: OperationsDetails["equipment"];
  canExecute: boolean;
};
export default function ResumeWorkPage({
  detail,
  equipment,
  canExecute,
}: Props) {
  const { t } = useLocale();
  return (
    <OperationsShell current="tasks" titleKey="workCase">
      <h1 className="text-3xl font-black">
        {detail?.task.externalReference ?? t("workUnavailable")}
      </h1>
      {detail ? (
        <>
          <Link
            className="ui-pressable mt-3 inline-flex min-h-11 items-center font-semibold text-[var(--accent-strong)]"
            href={workPath(detail.task.flow, detail.originResource.id)}
          >
            {t("openWorkContext")}
          </Link>
          <WorkExecutionPanel
            key={`${detail.task.taskId}:${detail.generatedAt}`}
            detail={detail}
            equipment={equipment}
            canExecute={canExecute}
          />
        </>
      ) : (
        <p role="status">{t("serviceUnavailableDescription")}</p>
      )}
    </OperationsShell>
  );
}

export const getServerSideProps: GetServerSideProps<Props> =
  withReadOnlyOperationalNavigation<Props>(async (context) => {
    const { flow, workId, taskId } = context.params ?? {};
    if (
      typeof flow !== "string" ||
      !["inbound", "outbound"].includes(flow) ||
      typeof workId !== "string" ||
      !workIdPattern.test(workId) ||
      typeof taskId !== "string" ||
      !workIdPattern.test(taskId) ||
      Object.keys(context.query).some(
        (key) => !["flow", "workId", "taskId"].includes(key),
      )
    )
      return { notFound: true };
    const session = await getServerSession(
      context.req,
      context.res,
      authOptions,
    );
    const access = operationalPageAccess(
      session,
      "operations.view",
      workResumePath(flow as WorkFlow, workId, taskId),
    );
    if (!access.allowed)
      return {
        redirect: { destination: access.destination, permanent: false },
      };
    let detail: TaskDetail | null = null;
    let equipment: OperationsDetails["equipment"] = [];
    const canExecute = hasUserPermission(access.access, "transport.execute");
    try {
      detail = await fetchTaskDetail(access.access, taskId.toLowerCase());
      if (
        detail.task.taskId !== taskId.toLowerCase() ||
        !belongsToWork(detail, flow as WorkFlow, workId)
      )
        return { notFound: true };
      if (canExecute && detail.task.status === "queued")
        equipment = (await fetchOperationsDetails(access.access)).equipment;
    } catch (error) {
      if (
        error instanceof WcsProjectionError &&
        [400, 404].includes(error.status)
      )
        return { notFound: true };
      // No usable command observation on partial failure.
      equipment = [];
    }
    return { props: { session, detail, equipment, canExecute } };
  });
