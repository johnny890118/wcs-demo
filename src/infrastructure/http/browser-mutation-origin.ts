import type { NextApiRequest, NextApiResponse } from "next";

type MutationOriginError = Readonly<{ code: string; message: string }>;

export function requireTrustedMutationOrigin(
  request: Pick<NextApiRequest, "headers">,
  response: NextApiResponse<MutationOriginError>,
): boolean {
  const configured = process.env.NEXTAUTH_URL;
  const supplied = request.headers.origin;
  let trusted = false;
  if (typeof configured === "string" && typeof supplied === "string") {
    try {
      const application = new URL(configured);
      const origin = new URL(supplied);
      trusted =
        (application.protocol === "https:" ||
          application.protocol === "http:") &&
        !application.username &&
        !application.password &&
        !origin.username &&
        !origin.password &&
        supplied === origin.origin &&
        origin.origin === application.origin;
    } catch {
      trusted = false;
    }
  }
  if (trusted) return true;

  response.status(403).json({
    code: "ORIGIN_FORBIDDEN",
    message: "Operational mutations require the configured application origin.",
  });
  return false;
}
