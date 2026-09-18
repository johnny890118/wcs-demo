import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config.js";

describe("web security headers", () => {
  it("protects all routes and keeps private surfaces out of search indexes", async () => {
    const rules = await nextConfig.headers?.();
    expect(rules).toBeDefined();

    const global = rules?.find((rule) => rule.source === "/(.*)");
    expect(global?.headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "Content-Security-Policy" }),
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
      ]),
    );

    for (const source of ["/operations/:path*", "/api/:path*"]) {
      expect(rules?.find((rule) => rule.source === source)?.headers).toEqual(
        expect.arrayContaining([
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ]),
      );
    }
  });
});
