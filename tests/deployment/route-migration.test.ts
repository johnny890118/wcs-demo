import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config.js";

describe("supported entry migration", () => {
  it("keeps previous public and legacy deep links on explicit redirects", async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toEqual(
      expect.arrayContaining([
        { source: "/platform", destination: "/", permanent: true },
        { source: "/fdp", destination: "/legacy/fdp", permanent: true },
        {
          source: "/engineeringMode",
          destination: "/legacy/engineering-mode",
          permanent: true,
        },
      ]),
    );
  });
});
