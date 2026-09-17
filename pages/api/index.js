import { getServerSession } from "next-auth/next";
import { getDemoKernelFacade } from "../../src/infrastructure/simulator/demo-kernel";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({
      code: "UNAUTHENTICATED",
      message: "Authentication is required.",
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);

  if (req.method === "GET") {
    const snapshot = await getDemoKernelFacade().getSnapshot();
    return res.status(200).json(snapshot);
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      code: "METHOD_NOT_ALLOWED",
      message: `Method ${req.method ?? "UNKNOWN"} is not allowed.`,
    });
  }

  // The legacy endpoint used to echo equipment commands with HTTP 200 even
  // though no command was executed. The migration façade is intentionally
  // read-only until authorization, validation, audit, and orchestration exist.
  return res.status(503).json({
    code: "EQUIPMENT_COMMANDS_DISABLED",
    message: "Equipment commands are disabled during platform migration.",
  });
}
