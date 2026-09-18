import type { NextFunction, Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadApiRuntimeConfig,
  validateApiRuntimeEnvironment,
} from "../../apps/api/src/config/api-runtime-config";
import { ApiSecurityHeadersMiddleware } from "../../apps/api/src/security/api-security-headers.middleware";
import { RateLimitMiddleware } from "../../apps/api/src/security/rate-limit.middleware";

const runtimeVariables = [
  "DATABASE_URL",
  "API_SERVICE_ID",
  "API_SERVICE_TOKEN",
  "API_SERVICE_PERMISSIONS",
  "API_RATE_LIMIT_MAX",
  "API_RATE_LIMIT_WINDOW_MS",
  "API_TRUST_PROXY_HOPS",
] as const;

const originalEnvironment = Object.fromEntries(
  runtimeVariables.map((name) => [name, process.env[name]]),
);

afterEach(() => {
  vi.restoreAllMocks();
  for (const name of runtimeVariables) {
    const value = originalEnvironment[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

function validEnvironment(): void {
  process.env.DATABASE_URL = "postgresql://warehouse@localhost/warehouse";
  process.env.API_SERVICE_ID = "warehouse-web";
  process.env.API_SERVICE_TOKEN = "runtime-token-with-at-least-32-characters";
  process.env.API_SERVICE_PERMISSIONS = "operations.view,transport.execute";
}

type ResponseDouble = Response & {
  headers: Map<string, string>;
  statusCode?: number;
  body?: unknown;
};

function responseDouble(): ResponseDouble {
  const headers = new Map<string, string>();
  const response: Record<string, unknown> & {
    headers: Map<string, string>;
    statusCode?: number;
    body?: unknown;
  } = {
    headers,
    setHeader(name: string, value: string) {
      headers.set(name, value);
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return response as unknown as ResponseDouble;
}

function requestDouble(ip: string): Request {
  return { ip, socket: { remoteAddress: ip } } as unknown as Request;
}

describe("API runtime security", () => {
  it("validates credentials, permissions, and bounded runtime controls", () => {
    validEnvironment();
    process.env.API_RATE_LIMIT_MAX = "75";
    process.env.API_RATE_LIMIT_WINDOW_MS = "30000";
    process.env.API_TRUST_PROXY_HOPS = "1";

    expect(validateApiRuntimeEnvironment()).toEqual({
      rateLimitMax: 75,
      rateLimitWindowMs: 30_000,
      trustProxyHops: 1,
    });

    process.env.API_SERVICE_TOKEN = "replace-with-a-long-random-service-token";
    expect(() => validateApiRuntimeEnvironment()).toThrow(/placeholder/);
    process.env.API_SERVICE_TOKEN = "runtime-token-with-at-least-32-characters";
    process.env.API_SERVICE_PERMISSIONS = "operations.view,unknown.permission";
    expect(() => validateApiRuntimeEnvironment()).toThrow(/unknown permission/);
  });

  it("rejects unsafe numeric runtime controls", () => {
    process.env.API_RATE_LIMIT_MAX = "0";
    expect(() => loadApiRuntimeConfig()).toThrow(/API_RATE_LIMIT_MAX/);
    process.env.API_RATE_LIMIT_MAX = "120";
    process.env.API_TRUST_PROXY_HOPS = "6";
    expect(() => loadApiRuntimeConfig()).toThrow(/API_TRUST_PROXY_HOPS/);
  });

  it("sets restrictive API response headers", () => {
    const response = responseDouble();
    const next = vi.fn() as NextFunction;

    new ApiSecurityHeadersMiddleware().use(
      requestDouble("127.0.0.1"),
      response,
      next,
    );

    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "default-src 'none'",
    );
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(next).toHaveBeenCalledOnce();
  });

  it("enforces a per-client fixed window without blocking other clients", () => {
    process.env.API_RATE_LIMIT_MAX = "2";
    process.env.API_RATE_LIMIT_WINDOW_MS = "60000";
    const middleware = new RateLimitMiddleware();
    const next = vi.fn() as NextFunction;

    const first = responseDouble();
    middleware.use(requestDouble("192.0.2.10"), first, next);
    expect(first.headers.get("RateLimit-Remaining")).toBe("1");

    const second = responseDouble();
    middleware.use(requestDouble("192.0.2.10"), second, next);
    expect(second.headers.get("RateLimit-Remaining")).toBe("0");

    const rejected = responseDouble();
    middleware.use(requestDouble("192.0.2.10"), rejected, next);
    expect(rejected.statusCode).toBe(429);
    expect(rejected.headers.get("Retry-After")).toBeDefined();
    expect(rejected.body).toEqual(
      expect.objectContaining({ code: "RATE_LIMITED" }),
    );

    const otherClient = responseDouble();
    middleware.use(requestDouble("192.0.2.11"), otherClient, next);
    expect(otherClient.statusCode).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(3);
  });
});
