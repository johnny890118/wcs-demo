import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authorizeOperationalSession } from "../../../../src/infrastructure/auth/operational-session";
import { manualVersion } from "../../../../src/ui/manual/manual-content";
import { authOptions } from "../../auth/[...nextauth]";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
): Promise<void> {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Robots-Tag", "noindex, nofollow");
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
    response.status(decision.reason === "forbidden" ? 403 : 401).json({
      code: decision.reason === "forbidden" ? "FORBIDDEN" : "UNAUTHENTICATED",
    });
    return;
  }
  const locale = request.query.locale;
  if (locale !== "en" && locale !== "zh-TW") {
    response.status(400).json({ code: "INVALID_MANUAL_LOCALE" });
    return;
  }
  try {
    const content = await readFile(
      join(process.cwd(), "output/pdf", `swp-operation-manual-${locale}.pdf`),
    );
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="swp-operation-manual-${manualVersion}-${locale}.pdf"`,
    );
    response.status(200).send(content);
  } catch {
    response.status(503).json({ code: "MANUAL_UNAVAILABLE" });
  }
}
