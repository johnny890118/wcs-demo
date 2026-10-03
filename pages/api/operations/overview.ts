import type { NextApiRequest, NextApiResponse } from "next";
import { withReadOnlyOperationalBff } from "../../../src/infrastructure/http/operational-request-context";
import { getServerSession } from "next-auth/next";
import { authorizeOperationalSession } from "../../../src/infrastructure/auth/operational-session";
import { fetchOperationsOverview } from "../../../src/infrastructure/http/wcs-api-client";
import { authOptions } from "../auth/[...nextauth]";
async function handler(request: NextApiRequest, response: NextApiResponse) {
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
    response
      .status(decision.reason === "forbidden" ? 403 : 401)
      .json({ code: "OVERVIEW_ACCESS_DENIED" });
    return;
  }
  try {
    response
      .status(200)
      .json(await fetchOperationsOverview(decision.session.access));
  } catch {
    response.status(503).json({ code: "OPERATIONS_OVERVIEW_UNAVAILABLE" });
  }
}
export default withReadOnlyOperationalBff(handler);
