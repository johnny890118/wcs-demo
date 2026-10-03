import { describe, expect, it } from "vitest";
import { userPermissions } from "../../src/application/access/operational-access";
import { version as packageVersion } from "../../package.json";
import {
  manualArticles,
  manualTopic,
  manualVersion,
  manualSoftwareVersion,
  normalizeManualSearch,
  searchManual,
} from "../../src/ui/manual/manual-content";
describe("single-source operational manual", () => {
  it("documents the shipped queue traversal instead of claiming unavailable task search", () => {
    const daily = manualArticles.find(
      (article) => article.id === "daily-work",
    )!;
    const english = daily.paragraphs.map((paragraph) => paragraph.en).join(" ");
    const chinese = daily.paragraphs
      .map((paragraph) => paragraph["zh-TW"])
      .join(" ");
    expect(english).toContain("All work and use Load more");
    expect(english).toContain(
      "Text search is not provided in the task queue yet",
    );
    expect(chinese).toContain("切換全部工作並使用載入更多");
    expect(chinese).toContain("目前尚未提供文字搜尋");
    expect(english).not.toContain("use task search");
  });
  it("has stable unique topics and complete localized content with only internal operational links", () => {
    expect(manualVersion).toMatch(/^\d{4}-\d{2}-\d{2}\.\d+$/);
    expect(manualSoftwareVersion).toBe(packageVersion);
    expect(new Set(manualArticles.map((a) => a.id)).size).toBe(
      manualArticles.length,
    );
    for (const article of manualArticles) {
      expect(article.id).toMatch(/^[a-z-]+$/);
      for (const locale of ["en", "zh-TW"] as const) {
        expect(article.title[locale].length).toBeGreaterThan(0);
        expect(article.paragraphs.every((p) => p[locale].length > 0)).toBe(
          true,
        );
        expect(article.links.every((l) => l.label[locale].length > 0)).toBe(
          true,
        );
      }
      for (const link of article.links) {
        expect(link.href).toMatch(/^\/operations(?:\/|$)/);
        expect(link.href).not.toMatch(/legacy|https:|github/);
        expect(userPermissions).toContain(link.permission);
      }
    }
    expect(
      manualArticles.find((a) => a.id === "audit")?.links[0].permission,
    ).toBe("audit.view");
  });
  it("searches bounded literal localized content without interpreting patterns", () => {
    expect(searchManual("LAST-KNOWN", "en").map((a) => a.id)).toContain(
      "live-view",
    );
    expect(searchManual("未知", "zh-TW").map((a) => a.id)).toContain(
      "exceptions",
    );
    expect(searchManual(".*", "en")).toEqual([]);
    expect(searchManual(["audit"], "en")).toEqual(manualArticles);
    expect(normalizeManualSearch(" x ")).toBe("x");
    expect(normalizeManualSearch("x".repeat(500))).toHaveLength(120);
    expect(manualTopic("live-view")).toBe("live-view");
    expect(manualTopic("//external.invalid")).toBeNull();
    expect(manualTopic(["audit"])).toBeNull();
  });
});
