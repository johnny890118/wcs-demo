import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import {
  workIdPattern,
  type WorkFlow,
} from "../../../../../src/application/operations/work-projection";
import { authorizeOperationalSession } from "../../../../../src/infrastructure/auth/operational-session";
import { withReadOnlyOperationalBff } from "../../../../../src/infrastructure/http/operational-request-context";
import {
  fetchWorkDetail,
  WcsProjectionError,
} from "../../../../../src/infrastructure/http/wcs-api-client";
import { authOptions } from "../../../auth/[...nextauth]";

async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
): Promise<void> {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ code: "METHOD_NOT_ALLOWED" });
    return;
  }
  const decision = authorizeOperationalSession(
    await getServerSession(request, response, authOptions),
    "operations.view",
  );
  if (!decision.allowed) {
    response
      .status(decision.reason === "forbidden" ? 403 : 401)
      .json({ code: "WORK_ACCESS_DENIED" });
    return;
  }
  const { flow, workId, cursor } = request.query;
  const limit =
    request.query.limit === undefined
      ? undefined
      : typeof request.query.limit === "string" &&
          /^\d+$/.test(request.query.limit)
        ? Number(request.query.limit)
        : NaN;
  if (
    typeof flow !== "string" ||
    !["inbound", "outbound"].includes(flow) ||
    typeof workId !== "string" ||
    !workIdPattern.test(workId) ||
    (cursor !== undefined &&
      (typeof cursor !== "string" || cursor.length > 1000)) ||
    (limit !== undefined &&
      (!Number.isInteger(limit) || limit < 1 || limit > 100))
  ) {
    response.status(400).json({ code: "INVALID_WORK_QUERY" });
    return;
  }
  try {
    response
      .status(200)
      .json(
        await fetchWorkDetail(
          decision.session.access,
          flow as WorkFlow,
          workId,
          { cursor, limit },
        ),
      );
  } catch (error) {
    const status =
      error instanceof WcsProjectionError && [400, 404].includes(error.status)
        ? error.status
        : 503;
    response.status(status).json({
      code:
        status === 404
          ? "WORK_NOT_FOUND"
          : status === 400
            ? "INVALID_WORK_QUERY"
            : "WORK_UNAVAILABLE",
    });
  }
}
export default withReadOnlyOperationalBff(handler);
