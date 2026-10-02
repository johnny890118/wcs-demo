import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import {
  isExecuteInboundWorkflowRequest,
  type InboundExecutionCompleted,
} from "../../../../../src/application/operations/inbound-workflow";
import {
  executeInboundTask,
  WcsCommandError,
} from "../../../../../src/infrastructure/http/wcs-api-client";
import { authorizeOperationalSession } from "../../../../../src/infrastructure/auth/operational-session";
import { requireTrustedMutationOrigin } from "../../../../../src/infrastructure/http/browser-mutation-origin";
import { authOptions } from "../../../auth/[...nextauth]";

type ErrorResponse = Readonly<{ code: string; message: string }>;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<InboundExecutionCompleted | ErrorResponse>,
): Promise<void> {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({
      code: "METHOD_NOT_ALLOWED",
      message: "Only POST is supported.",
    });
    return;
  }
  if (!requireTrustedMutationOrigin(request, response)) return;
  const session = await getServerSession(request, response, authOptions);
  const decision = authorizeOperationalSession(session, "transport.execute");
  if (!decision.allowed) {
    const forbidden = decision.reason === "forbidden";
    response.status(forbidden ? 403 : 401).json({
      code: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED",
      message: forbidden
        ? "Transport execute permission is required."
        : "A valid operational session is required.",
    });
    return;
  }
  const taskId = request.query.taskId;
  if (
    typeof taskId !== "string" ||
    !uuidPattern.test(taskId) ||
    !isExecuteInboundWorkflowRequest(request.body)
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
      .json(
        await executeInboundTask(taskId, request.body, decision.session.access),
      );
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
      message: "Inbound execution is temporarily unavailable.",
    });
  }
}
