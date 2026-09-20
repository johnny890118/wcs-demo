import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import {
  isExecuteOutboundWorkflowRequest,
  type OutboundExecutionCompleted,
} from "../../../../../src/application/operations/outbound-workflow";
import {
  executeOutboundTask,
  WcsCommandError,
} from "../../../../../src/infrastructure/http/wcs-api-client";
import { authOptions } from "../../../auth/[...nextauth]";

type ErrorResponse = Readonly<{ code: string; message: string }>;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<OutboundExecutionCompleted | ErrorResponse>,
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
  const taskId = request.query.taskId;
  if (
    typeof taskId !== "string" ||
    !uuidPattern.test(taskId) ||
    !isExecuteOutboundWorkflowRequest(request.body)
  ) {
    response.status(400).json({
      code: "INVALID_EXECUTION_REQUEST",
      message: "Task, equipment, or confirmation fields are invalid.",
    });
    return;
  }
  try {
    response
      .status(200)
      .json(await executeOutboundTask(taskId, request.body, operatorId));
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
      message: "Outbound execution is temporarily unavailable.",
    });
  }
}
