import {
  isOperationsSummary,
  type OperationsSummary,
} from "../../application/operations/operations-summary";

export async function fetchOperationsSummary(): Promise<OperationsSummary> {
  const baseUrl = process.env.INTERNAL_API_BASE_URL ?? "http://127.0.0.1:3001";
  const token = process.env.API_SERVICE_TOKEN;
  if (!token) throw new Error("API_SERVICE_TOKEN is required.");

  const response = await fetch(`${baseUrl}/api/v1/operations/summary`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(2_000),
  });
  if (!response.ok) {
    throw new Error(`WCS operations API returned HTTP ${response.status}.`);
  }
  const payload: unknown = await response.json();
  if (!isOperationsSummary(payload)) {
    throw new Error("WCS operations API returned an invalid projection.");
  }
  return payload;
}
