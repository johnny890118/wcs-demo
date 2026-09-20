import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import {
  isAcknowledgeAlarmRequest,
  type AlarmAcknowledged,
} from "../../../../../src/application/operations/alarm-workflow";
import {
  acknowledgeAlarm,
  WcsCommandError,
} from "../../../../../src/infrastructure/http/wcs-api-client";
import { authOptions } from "../../../auth/[...nextauth]";

type ErrorResponse = Readonly<{ code: string; message: string }>;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<AlarmAcknowledged | ErrorResponse>,
): Promise<void> {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response
      .status(405)
      .json({ code: "METHOD_NOT_ALLOWED", message: "Only POST is supported." });
    return;
  }
  const session = await getServerSession(request, response, authOptions);
  const operatorId = session?.user?.name;
  const alarmId = request.query.alarmId;
  if (!operatorId) {
    response.status(401).json({
      code: "UNAUTHENTICATED",
      message: "Authentication is required.",
    });
    return;
  }
  if (
    typeof alarmId !== "string" ||
    !uuidPattern.test(alarmId) ||
    !isAcknowledgeAlarmRequest(request.body)
  ) {
    response.status(400).json({
      code: "INVALID_ACKNOWLEDGEMENT",
      message: "Alarm or confirmation fields are invalid.",
    });
    return;
  }
  try {
    response
      .status(200)
      .json(await acknowledgeAlarm(alarmId, request.body, operatorId));
  } catch (error) {
    if (error instanceof WcsCommandError) {
      response
        .status(error.status)
        .json({ code: error.code, message: error.message });
      return;
    }
    response.status(503).json({
      code: "OPERATIONS_API_UNAVAILABLE",
      message: "Alarm service is temporarily unavailable.",
    });
  }
}
