import { readFileSync, readdirSync } from "node:fs";

// Read psql -At output from stdin. Compare the exact repository manifest, not
// a magic count that becomes stale or could accept the wrong migration names.
const expected = readdirSync("apps/api/migrations")
  .filter((name) => name.endsWith(".sql"))
  .sort();
const actual = readFileSync(0, "utf8").split(/\r?\n/).filter(Boolean).sort();
if (
  expected.length === 0 ||
  JSON.stringify(actual) !== JSON.stringify(expected)
) {
  throw new Error("Applied migration manifest differs from the repository.");
}
process.stdout.write("Applied migration manifest matches the repository.\n");
