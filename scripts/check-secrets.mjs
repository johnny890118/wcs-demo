import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const repositoryFiles = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter(Boolean);

const forbiddenEnvironmentFiles = repositoryFiles.filter(
  (file) =>
    file === ".env" || (file.startsWith(".env.") && file !== ".env.example"),
);

if (forbiddenEnvironmentFiles.length > 0) {
  console.error(
    `Tracked environment files are forbidden: ${forbiddenEnvironmentFiles.join(
      ", ",
    )}`,
  );
  process.exit(1);
}

const sourceFiles = repositoryFiles.filter(
  (file) =>
    file !== "package-lock.json" &&
    /\.(?:[cm]?[jt]sx?|json|ya?ml|toml)$/.test(file),
);
const hardCodedCredentialPattern =
  /(?:password|secret|api[_-]?key)\s*[:=]\s*["'][^"']{4,}["']/i;

for (const file of sourceFiles) {
  const contents = readFileSync(file, "utf8");

  if (hardCodedCredentialPattern.test(contents)) {
    console.error(`Possible hard-coded credential in tracked file: ${file}`);
    process.exit(1);
  }
}

console.log("Secret hygiene checks passed.");
