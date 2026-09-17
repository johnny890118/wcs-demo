import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import type { OperationsDetails } from "../../../src/application/operations/operations-details";
import { fetchOperationsDetails } from "../../../src/infrastructure/http/wcs-api-client";
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
  if (!session) {
    response.status(401).json({
      code: "UNAUTHENTICATED",
      message: "Authentication is required.",
    });
    return;
  }
  try {
    response.status(200).json(await fetchOperationsDetails());
  } catch {
    response.status(503).json({
      code: "OPERATIONS_API_UNAVAILABLE",
      message: "Operations data is temporarily unavailable.",
    });
  }
}
