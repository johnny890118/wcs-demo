import type { NextApiRequest, NextApiResponse } from "next";
import { withReadOnlyOperationalBff } from "../../../src/infrastructure/http/operational-request-context";
import { getServerSession } from "next-auth/next";
import { authorizeOperationalSession } from "../../../src/infrastructure/auth/operational-session";
import {
  fetchLocations,
  WcsProjectionError,
} from "../../../src/infrastructure/http/wcs-api-client";
import { authOptions } from "../auth/[...nextauth]";
async function handler(request: NextApiRequest, response: NextApiResponse) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({ code: "METHOD_NOT_ALLOWED" });
    return;
  }
  const access = authorizeOperationalSession(
    await getServerSession(request, response, authOptions),
    "operations.view",
  );
  if (!access.allowed) {
    response
      .status(access.reason === "forbidden" ? 403 : 401)
      .json({ code: "LOCATION_ACCESS_DENIED" });
    return;
  }
  const { search, cursor, limit: rawLimit } = request.query;
  const limit =
    rawLimit === undefined
      ? undefined
      : typeof rawLimit === "string" && /^\d+$/.test(rawLimit)
        ? Number(rawLimit)
        : NaN;
  if (
    (search !== undefined &&
      (typeof search !== "string" || search.length > 100)) ||
    (cursor !== undefined &&
      (typeof cursor !== "string" || cursor.length > 1000)) ||
    (limit !== undefined &&
      (!Number.isInteger(limit) || limit < 1 || limit > 100))
  ) {
    response.status(400).json({ code: "INVALID_LOCATION_QUERY" });
    return;
  }
  try {
    response.status(200).json(
      await fetchLocations(access.session.access, {
        search: search as string | undefined,
        cursor: cursor as string | undefined,
        limit,
      }),
    );
  } catch (error) {
    const status =
      error instanceof WcsProjectionError && error.status === 400 ? 400 : 503;
    response.status(status).json({
      code: status === 400 ? "INVALID_LOCATION_QUERY" : "LOCATIONS_UNAVAILABLE",
    });
  }
}
export default withReadOnlyOperationalBff(handler);
