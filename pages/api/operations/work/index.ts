import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { parseWorkQueueQuery } from "../../../../src/application/operations/work-queue";
import { authorizeOperationalSession } from "../../../../src/infrastructure/auth/operational-session";
import { withReadOnlyOperationalBff } from "../../../../src/infrastructure/http/operational-request-context";
import {
  fetchWorkQueue,
  WcsProjectionError,
} from "../../../../src/infrastructure/http/wcs-api-client";
import { authOptions } from "../../auth/[...nextauth]";
async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ code: "METHOD_NOT_ALLOWED" });
    return;
  }
  const access = authorizeOperationalSession(
    await getServerSession(req, res, authOptions),
    "operations.view",
  );
  if (!access.allowed) {
    res
      .status(access.reason === "forbidden" ? 403 : 401)
      .json({ code: "WORK_ACCESS_DENIED" });
    return;
  }
  const query = parseWorkQueueQuery(req.query);
  if (!query) {
    res.status(400).json({ code: "INVALID_WORK_QUEUE_QUERY" });
    return;
  }
  try {
    res.status(200).json(await fetchWorkQueue(access.session.access, query));
  } catch (error) {
    res
      .status(
        error instanceof WcsProjectionError && error.status === 400 ? 400 : 503,
      )
      .json({ code: "WORK_QUEUE_UNAVAILABLE" });
  }
}
export default withReadOnlyOperationalBff(handler);
