import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authorizeOperationalSession } from "../../../../src/infrastructure/auth/operational-session";
import {
  fetchTaskDetail,
  fetchTaskQueue,
  WcsProjectionError,
} from "../../../../src/infrastructure/http/wcs-api-client";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(
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
      .json({ code: "TASK_ACCESS_DENIED" });
    return;
  }
  const segments = request.query.segments ?? [];
  const view = request.query.view ?? "active";
  const cursor = request.query.cursor;
  const limit =
    request.query.limit === undefined
      ? undefined
      : typeof request.query.limit === "string" &&
          /^\d+$/.test(request.query.limit)
        ? Number(request.query.limit)
        : NaN;
  if (
    !Array.isArray(segments) ||
    segments.length > 1 ||
    !["active", "all"].includes(view as string) ||
    (cursor !== undefined &&
      (typeof cursor !== "string" || cursor.length > 600)) ||
    (limit !== undefined &&
      (!Number.isInteger(limit) || limit < 1 || limit > 100))
  ) {
    response.status(400).json({ code: "INVALID_TASK_QUERY" });
    return;
  }
  try {
    response.status(200).json(
      segments.length
        ? await fetchTaskDetail(decision.session.access, segments[0])
        : await fetchTaskQueue(decision.session.access, {
            view: view as "active" | "all",
            cursor: cursor as string | undefined,
            limit,
          }),
    );
  } catch (error) {
    const status =
      error instanceof WcsProjectionError && [400, 404].includes(error.status)
        ? error.status
        : 503;
    response.status(status).json({
      code:
        status === 404
          ? "TASK_NOT_FOUND"
          : status === 400
            ? "INVALID_TASK_QUERY"
            : "TASKS_UNAVAILABLE",
    });
  }
}
