import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import type { OperationsDetails } from "../../../src/application/operations/operations-details";
import { fetchOperationsDetails } from "../../../src/infrastructure/http/wcs-api-client";
import { authorizeOperationalSession } from "../../../src/infrastructure/auth/operational-session";
import { authOptions } from "../auth/[...nextauth]";

type ErrorResponse = Readonly<{ code: string; message: string }>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<OperationsDetails | ErrorResponse>,
): Promise<void> {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({
      code: "METHOD_NOT_ALLOWED",
      message: "Only GET is supported.",
    });
    return;
  }
  const session = await getServerSession(request, response, authOptions);
  const decision = authorizeOperationalSession(session, "operations.view");
  if (!decision.allowed) {
    const forbidden = decision.reason === "forbidden";
    response.status(forbidden ? 403 : 401).json({
      code: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED",
      message: forbidden
        ? "Operations view permission is required."
        : "A valid operational session is required.",
    });
    return;
  }
  try {
    response
      .status(200)
      .json(await fetchOperationsDetails(decision.session.access));
  } catch {
    response.status(503).json({
      code: "OPERATIONS_API_UNAVAILABLE",
      message: "Operations data is temporarily unavailable.",
    });
  }
}
