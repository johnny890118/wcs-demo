import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import {
  isCreateInboundWorkflowRequest,
  type InboundReceiptCreated,
} from "../../../../src/application/operations/inbound-workflow";
import {
  createInboundReceipt,
  WcsCommandError,
} from "../../../../src/infrastructure/http/wcs-api-client";
import { authOptions } from "../../auth/[...nextauth]";

type ErrorResponse = Readonly<{ code: string; message: string }>;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<InboundReceiptCreated | ErrorResponse>,
): Promise<void> {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({
      code: "METHOD_NOT_ALLOWED",
      message: "Only POST is supported.",
    });
    return;
  }
  const session = await getServerSession(request, response, authOptions);
  const operatorId = session?.user?.name;
  if (!operatorId) {
    response.status(401).json({
      code: "UNAUTHENTICATED",
      message: "Authentication is required.",
    });
    return;
  }
  if (!isCreateInboundWorkflowRequest(request.body)) {
    response.status(400).json({
      code: "INVALID_INBOUND_REQUEST",
      message: "Inbound request fields are invalid.",
    });
    return;
  }
  try {
    response
      .status(201)
      .json(await createInboundReceipt(request.body, operatorId));
  } catch (error) {
    if (error instanceof WcsCommandError) {
      response.status(error.status).json({
        code: error.code,
        message: error.message,
      });
      return;
    }
    response.status(503).json({
      code: "OPERATIONS_API_UNAVAILABLE",
      message: "Inbound service is temporarily unavailable.",
    });
  }
}
