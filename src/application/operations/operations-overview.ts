import { isOperationsHome, type OperationsHome } from "./operations-home";
import {
  isOperationsSummary,
  type OperationsSummary,
} from "./operations-summary";
export type OperationsOverview = Readonly<{
  home: OperationsHome | null;
  summary: OperationsSummary | null;
}>;
export function isOperationsOverview(
  value: unknown,
): value is OperationsOverview {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as OperationsOverview;
  return (
    (item.home === null || isOperationsHome(item.home)) &&
    (item.summary === null || isOperationsSummary(item.summary))
  );
}
