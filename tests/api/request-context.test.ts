import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import {
  auditCorrelationId,
  requestContext,
} from "../../apps/api/src/logging/request-context";
import { RequestContextMiddleware } from "../../apps/api/src/logging/request-context.middleware";

describe("request correlation middleware", () => {
  it("preserves a safe caller request id through async context", () => {
    const middleware = new RequestContextMiddleware();
    const request = {
      header: vi.fn(() => "request-warehouse-0001"),
    } as unknown as Request;
    const response = {
      setHeader: vi.fn(),
    } as unknown as Response;
    let observed: string | undefined;

    middleware.use(request, response, (() => {
      observed = requestContext.getStore()?.requestId;
    }) as NextFunction);

    expect(observed).toBe("request-warehouse-0001");
    expect(
      requestContext.run({ requestId: observed! }, () =>
        auditCorrelationId("70000000-0000-4000-8000-000000000001"),
      ),
    ).toBe("request-warehouse-0001");
    expect(response.setHeader).toHaveBeenCalledWith(
      "X-Request-Id",
      "request-warehouse-0001",
    );
  });

  it("uses an explicit event correlation outside an HTTP request", () => {
    expect(auditCorrelationId("70000000-0000-4000-8000-000000000001")).toBe(
      "event:70000000-0000-4000-8000-000000000001",
    );
  });

  it("replaces unsafe request ids instead of reflecting them", () => {
    const middleware = new RequestContextMiddleware();
    const request = {
      header: vi.fn(() => "unsafe header\nvalue"),
    } as unknown as Request;
    const response = {
      setHeader: vi.fn(),
    } as unknown as Response;

    middleware.use(request, response, (() => undefined) as NextFunction);

    const generated = vi.mocked(response.setHeader).mock.calls[0]?.[1];
    expect(generated).toEqual(expect.any(String));
    expect(generated).not.toBe("unsafe header\nvalue");
  });
});
