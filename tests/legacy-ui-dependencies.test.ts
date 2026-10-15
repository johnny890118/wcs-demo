import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const retired = ["@heroicons/react", "@headlessui/react"];
const root = process.cwd();

function sources(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory()
      ? sources(file)
      : /\.(?:[cm]?js|jsx|tsx?)$/.test(file)
        ? [file]
        : [];
  });
}

it("keeps the retired UI libraries out of direct and transitive dependencies", () => {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const lock = JSON.parse(
    readFileSync(join(root, "package-lock.json"), "utf8"),
  );
  for (const library of retired) {
    for (const field of [
      "dependencies",
      "devDependencies",
      "optionalDependencies",
      "peerDependencies",
    ]) {
      expect(manifest[field]?.[library]).toBeUndefined();
    }
    expect(lock.packages[`node_modules/${library}`]).toBeUndefined();
    expect(JSON.stringify(lock)).not.toContain(library);
  }
});

it("retains no static or dynamic consumer in product, Legacy, core, API or scripts", () => {
  const files = ["pages", "components", "src", "apps", "scripts"].flatMap(
    (directory) => sources(join(root, directory)),
  );
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const library of retired) expect(source, file).not.toContain(library);
  }
  for (const file of [
    "pages/legacy/index.js",
    "pages/legacy/fdp.js",
    "pages/legacy/engineering-mode.js",
    "pages/about.tsx",
  ]) {
    expect(existsSync(join(root, file)), file).toBe(true);
  }
});
