import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { catalogs } from "../../src/ui/i18n/catalogs";
import {
  PRODUCT_NAME,
  PRODUCT_ICON,
  PRODUCT_ICON_PNG,
  PRODUCT_APP_ICON,
} from "../../src/ui/identity/product-identity";
describe("active product identity contract", () => {
  it("uses the exact product identity in both language catalogs", () => {
    for (const catalog of Object.values(catalogs)) {
      expect(catalog.brand).toBe(PRODUCT_NAME);
      expect(catalog.platformMetaTitle).toBe(PRODUCT_NAME);
      expect(catalog.loginMetaTitle).toContain(PRODUCT_NAME);
    }
  });
  it("does not reference legacy icons or brand in shared active metadata", () => {
    const app = readFileSync("pages/_app.js", "utf8");
    expect(app).not.toMatch(/female\.png|wcs.?demo/i);
    expect(app).toContain("PRODUCT_ICON");
    expect(app).toContain("og:site_name");
    const svg = readFileSync(`public${PRODUCT_ICON}`, "utf8");
    expect(svg).toContain(`<title>${PRODUCT_NAME}</title>`);
    expect(svg).not.toMatch(/<script|<image|href=|<text/);
  });
  it("ships valid raster and implicit browser fallback formats", () => {
    for (const [href, size] of [
      [PRODUCT_ICON_PNG, 32],
      [PRODUCT_APP_ICON, 180],
    ] as const) {
      const png = readFileSync(`public${href}`);
      expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(png.readUInt32BE(16)).toBe(size);
      expect(png.readUInt32BE(20)).toBe(size);
    }
    const icon = readFileSync("public/favicon.ico");
    expect(icon.readUInt16LE(2)).toBe(1);
    expect(icon.readUInt16LE(4)).toBe(1);
    expect(icon.readUInt32LE(18)).toBe(22);
    expect(icon.subarray(22)).toEqual(
      readFileSync(`public${PRODUCT_ICON_PNG}`),
    );
  });
});
