import { describe, expect, it } from "vitest";
import { publicSiteUrl } from "../../src/ui/seo/public-site";

describe("public site origin", () => {
  it("normalizes a credential-free HTTPS origin", () => {
    expect(
      publicSiteUrl({
        NODE_ENV: "production",
        PUBLIC_SITE_URL: "https://warehouse.example.com/",
      }),
    ).toBe("https://warehouse.example.com");
  });

  it("fails closed for missing or unsafe production origins", () => {
    expect(() => publicSiteUrl({ NODE_ENV: "production" })).toThrow(/required/);
    expect(() =>
      publicSiteUrl({
        NODE_ENV: "production",
        PUBLIC_SITE_URL: "http://warehouse.example.com",
      }),
    ).toThrow(/HTTPS/);
    expect(() =>
      publicSiteUrl({
        NODE_ENV: "production",
        PUBLIC_SITE_URL: "https://operator@warehouse.example.com",
      }),
    ).toThrow(/credential-free/);
  });
});
