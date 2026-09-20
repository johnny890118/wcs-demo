import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import type { AuditEventPage } from "../../../src/application/audit/audit-projection";
import { fetchAuditEvents } from "../../../src/infrastructure/http/wcs-api-client";
import { authorizeOperationalSession } from "../../../src/infrastructure/auth/operational-session";
import { authOptions } from "../auth/[...nextauth]";

type ErrorResponse = Readonly<{ code: string; message: string }>;

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse<AuditEventPage | ErrorResponse>,
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
  const decision = authorizeOperationalSession(session, "audit.view");
  if (!decision.allowed) {
    const forbidden = decision.reason === "forbidden";
    response.status(forbidden ? 403 : 401).json({
      code: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED",
      message: forbidden
        ? "Audit view permission is required."
        : "A valid operational session is required.",
    });
    return;
  }
  const limitValue = single(request.query.limit);
  const limit = limitValue === undefined ? undefined : Number(limitValue);
  if (
    limit !== undefined &&
    (!Number.isInteger(limit) || limit < 1 || limit > 100)
  ) {
    response.status(400).json({
      code: "INVALID_AUDIT_QUERY",
      message: "limit must be an integer from 1 to 100.",
    });
    return;
  }
  try {
    response.status(200).json(
      await fetchAuditEvents(decision.session.access, {
        cursor: single(request.query.cursor),
        limit,
        resourceType: single(request.query.resourceType),
        resourceId: single(request.query.resourceId),
        correlationId: single(request.query.correlationId),
      }),
    );
  } catch {
    response.status(503).json({
      code: "AUDIT_API_UNAVAILABLE",
      message: "Audit history is temporarily unavailable.",
    });
  }
}
