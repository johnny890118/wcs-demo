import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const expected = readdirSync("apps/api/migrations").filter((name) =>
  name.endsWith(".sql"),
);
function check(names: string[]) {
  return execFileSync(
    process.execPath,
    ["scripts/check-migration-manifest.mjs"],
    { input: names.join("\n"), stdio: ["pipe", "pipe", "pipe"] },
  ).toString();
}
describe("deployment migration manifest", () => {
  it("accepts the exact applied set regardless of ordering", () => {
    expect(check([...expected].reverse())).toContain("matches the repository");
  });
  it("rejects a wrong filename despite the same count", () => {
    expect(() => check(["unexpected.sql", ...expected.slice(1)])).toThrow();
  });
  it("rejects a missing migration", () => {
    expect(() => check(expected.slice(1))).toThrow();
  });
  it("rejects duplicate or empty applied manifests", () => {
    expect(() => check([...expected, expected[0]])).toThrow();
    expect(() => check([])).toThrow();
  });
});
