import type { NextApiRequest, NextApiResponse } from "next";
import { withReadOnlyOperationalBff } from "../../../src/infrastructure/http/operational-request-context";
import { getServerSession } from "next-auth/next";
import type { OperationsLiveView } from "../../../src/application/operations/operations-live-view";
import { authorizeOperationalSession } from "../../../src/infrastructure/auth/operational-session";
import { fetchOperationsLiveView } from "../../../src/infrastructure/http/wcs-api-client";
import { authOptions } from "../auth/[...nextauth]";

async function handler(
  request: NextApiRequest,
  response: NextApiResponse<OperationsLiveView | { code: string }>,
): Promise<void> {
  response.setHeader("Cache-Control", "no-store");
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
    const forbidden = decision.reason === "forbidden";
    response
      .status(forbidden ? 403 : 401)
      .json({ code: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED" });
    return;
  }
  try {
    const equipmentId = request.query?.equipmentId;
    if (
      equipmentId !== undefined &&
      (typeof equipmentId !== "string" ||
        !equipmentId.length ||
        equipmentId.length > 200)
    ) {
      response.status(400).json({ code: "INVALID_CONTEXT" });
      return;
    }
    response
      .status(200)
      .json(
        await (equipmentId === undefined
          ? fetchOperationsLiveView(decision.session.access)
          : fetchOperationsLiveView(decision.session.access, equipmentId)),
      );
  } catch {
    response.status(503).json({ code: "OPERATIONS_LIVE_VIEW_UNAVAILABLE" });
  }
}
export default withReadOnlyOperationalBff(handler);
