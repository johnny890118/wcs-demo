import { afterEach, describe, expect, it, vi } from "vitest";
import { requireTrustedMutationOrigin } from "../../src/infrastructure/http/browser-mutation-origin";

const originalNextAuthUrl = process.env.NEXTAUTH_URL;

function responseHarness() {
  const response = {
    statusCode: undefined as number | undefined,
    body: undefined as unknown,
    status: vi.fn((statusCode: number) => {
      response.statusCode = statusCode;
      return response;
    }),
    json: vi.fn((body: unknown) => {
      response.body = body;
      return response;
    }),
  };
  return response;
}

afterEach(() => {
  if (originalNextAuthUrl === undefined) delete process.env.NEXTAUTH_URL;
  else process.env.NEXTAUTH_URL = originalNextAuthUrl;
});

describe("operational browser mutation origin", () => {
  it("accepts only the configured authentication application origin", () => {
    process.env.NEXTAUTH_URL = "https://app.example.test";
    const response = responseHarness();

    expect(
      requireTrustedMutationOrigin(
        { headers: { origin: "https://app.example.test" } } as never,
        response as never,
      ),
    ).toBe(true);
    expect(response.status).not.toHaveBeenCalled();
  });

  it.each([
    undefined,
    "null",
    "https://www.example.test",
    "https://app.example.test/path",
    "https://user@app.example.test",
    "not-a-url",
  ])("rejects an untrusted origin %s", (origin) => {
    process.env.NEXTAUTH_URL = "https://app.example.test";
    const response = responseHarness();

    expect(
      requireTrustedMutationOrigin(
        { headers: { origin } } as never,
        response as never,
      ),
    ).toBe(false);
    expect(response.statusCode).toBe(403);
    expect(response.body).toEqual({
      code: "ORIGIN_FORBIDDEN",
      message:
        "Operational mutations require the configured application origin.",
    });
  });
});
