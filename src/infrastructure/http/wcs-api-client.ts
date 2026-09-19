import {
  isOperationsSummary,
  type OperationsSummary,
} from "../../application/operations/operations-summary";
import {
  isOperationsDetails,
  type OperationsDetails,
} from "../../application/operations/operations-details";

const defaultTimeoutMs = 75_000;

export function loadWcsApiTimeoutMs(): number {
  const value = Number(process.env.INTERNAL_API_TIMEOUT_MS ?? defaultTimeoutMs);
  if (!Number.isSafeInteger(value) || value < 1_000 || value > 120_000) {
    throw new Error(
      "INTERNAL_API_TIMEOUT_MS must be an integer from 1000 to 120000.",
    );
  }
  return value;
}

async function fetchWcsProjection(path: string): Promise<unknown> {
  const baseUrl = process.env.INTERNAL_API_BASE_URL ?? "http://127.0.0.1:3001";
  const token = process.env.API_SERVICE_TOKEN;
  if (!token) throw new Error("API_SERVICE_TOKEN is required.");

  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(loadWcsApiTimeoutMs()),
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
