import { afterEach, beforeEach, describe, expect, it } from "vitest";
import handler from "../../pages/api/demo/session";
import { anonymousDemoCookieName } from "../../src/infrastructure/auth/anonymous-demo-carrier";

function response() {
  const result = {
    statusCode: 0,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    setHeader(name: string, value: string) {
      result.headers[name] = value;
      return result;
    },
    status(statusCode: number) {
      result.statusCode = statusCode;
      return result;
    },
    json(body: unknown) {
      result.body = body;
      return result;
    },
  };
  return result;
}

const runtimeVariables = [
  "ANONYMOUS_DEMO_SECRET",
  "PUBLIC_SITE_URL",
  "SWP_LIFECYCLE_ENVIRONMENT",
  "SWP_DEPLOYMENT_PROFILE",
  "SWP_EQUIPMENT_SOURCE",
] as const;

describe("anonymous demo session endpoint", () => {
  beforeEach(() => {
    process.env.ANONYMOUS_DEMO_SECRET = "b".repeat(48);
    process.env.PUBLIC_SITE_URL = "https://demo.example.test";
    process.env.SWP_LIFECYCLE_ENVIRONMENT = "production";
    process.env.SWP_DEPLOYMENT_PROFILE = "public_demo";
    process.env.SWP_EQUIPMENT_SOURCE = "simulation";
  });

  afterEach(() => {
    for (const name of runtimeVariables) delete process.env[name];
  });

  it("issues an HttpOnly secure carrier only to the configured origin", () => {
    const result = response();
    handler(
      {
        method: "POST",
        headers: { origin: "https://demo.example.test" },
      } as never,
      result as never,
    );
    expect(result.statusCode).toBe(201);
    expect(result.body).toMatchObject({
      sessionId: expect.any(String),
      expiresAt: expect.any(String),
    });
    expect(result.headers["Set-Cookie"]).toContain(
      `${anonymousDemoCookieName}=`,
    );
    expect(result.headers["Set-Cookie"]).toContain("HttpOnly");
    expect(result.headers["Set-Cookie"]).toContain("Secure");
    expect(result.headers["Cache-Control"]).toBe("no-store");
  });

  it("fails closed outside public demo and for a foreign origin", () => {
    const foreign = response();
    handler(
      { method: "POST", headers: { origin: "https://evil.example" } } as never,
      foreign as never,
    );
    expect(foreign.statusCode).toBe(403);
    expect(foreign.headers["Set-Cookie"]).toBeUndefined();

    process.env.SWP_DEPLOYMENT_PROFILE = "private_demo";
    const unavailable = response();
    handler(
      {
        method: "POST",
        headers: { origin: "https://demo.example.test" },
      } as never,
      unavailable as never,
    );
    expect(unavailable.statusCode).toBe(404);
    expect(unavailable.headers["Set-Cookie"]).toBeUndefined();
  });
});
