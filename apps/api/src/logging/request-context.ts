import { AsyncLocalStorage } from "node:async_hooks";

type RequestContextValue = Readonly<{ requestId: string }>;

export const requestContext = new AsyncLocalStorage<RequestContextValue>();

export function auditCorrelationId(auditEventId: string): string {
  return requestContext.getStore()?.requestId ?? `event:${auditEventId}`;
}
