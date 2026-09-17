import {
  isOperationsSummary,
  type OperationsSummary,
} from "../../application/operations/operations-summary";
import {
  isOperationsDetails,
  type OperationsDetails,
} from "../../application/operations/operations-details";

async function fetchWcsProjection(path: string): Promise<unknown> {
  const baseUrl = process.env.INTERNAL_API_BASE_URL ?? "http://127.0.0.1:3001";
  const token = process.env.API_SERVICE_TOKEN;
  if (!token) throw new Error("API_SERVICE_TOKEN is required.");

  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(2_000),
  });
  if (!response.ok) {
    throw new Error(`WCS API returned HTTP ${response.status}.`);
  }
  return response.json();
}

export async function fetchOperationsSummary(): Promise<OperationsSummary> {
  const payload = await fetchWcsProjection("/api/v1/operations/summary");
  if (!isOperationsSummary(payload)) {
    throw new Error("WCS operations API returned an invalid projection.");
  }
  return payload;
}

export async function fetchOperationsDetails(): Promise<OperationsDetails> {
  const payload = await fetchWcsProjection("/api/v1/operations/details");
  if (!isOperationsDetails(payload)) {
    throw new Error("WCS operations API returned invalid focused projections.");
  }
  return payload;
}
