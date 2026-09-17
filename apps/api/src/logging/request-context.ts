import { AsyncLocalStorage } from "node:async_hooks";

type RequestContextValue = Readonly<{ requestId: string }>;

export const requestContext = new AsyncLocalStorage<RequestContextValue>();
