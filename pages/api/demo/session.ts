import type { NextApiRequest, NextApiResponse } from "next";
import { loadOperationalRuntime } from "../../../src/infrastructure/runtime/operational-runtime";

type SessionResponse = Readonly<{ sessionId: string; expiresAt: string }>;
type ErrorResponse = Readonly<{ code: string; message: string }>;

export default function handler(
  request: NextApiRequest,
  response: NextApiResponse<SessionResponse | ErrorResponse>,
): void {
  response.setHeader("Cache-Control", "no-store");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({
      code: "METHOD_NOT_ALLOWED",
      message: "Only POST is supported.",
    });
    return;
  }
  const runtime = loadOperationalRuntime();
  if (
    runtime.deploymentProfile !== "public_demo" ||
    runtime.equipmentSource !== "simulation"
  ) {
    response.status(404).json({
      code: "PUBLIC_DEMO_UNAVAILABLE",
      message: "Anonymous demo sessions are unavailable in this deployment.",
    });
    return;
  }
  const publicOrigin = new URL(
    process.env.PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "",
  ).origin;
  if (request.headers.origin !== publicOrigin) {
    response.status(403).json({
      code: "ORIGIN_FORBIDDEN",
      message: "Anonymous demo sessions require the configured site origin.",
    });
    return;
  }
  // A signed carrier alone cannot isolate warehouse or simulator state.
  // Do not enable issuance until persisted provisioning/access/cleanup exist.
  response.status(503).json({
    code: "PUBLIC_DEMO_LIFECYCLE_UNAVAILABLE",
    message: "Isolated public demo sessions are not available yet.",
  });
}
