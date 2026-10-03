import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { manualArticles, manualVersion } from "../src/ui/manual/manual-content";
const directory =
  process.env.MANUAL_PDF_DIRECTORY ?? join(process.cwd(), "output/pdf");
const manifest = JSON.parse(
  readFileSync(join(directory, "manifest.json"), "utf8"),
);
const sha256 = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
const source = JSON.stringify({
  version: manualVersion,
  articles: manualArticles,
});
const integrityOnly = process.argv.includes("--integrity-only");
if (
  manifest.version !== manualVersion ||
  manifest.sourceSha256 !== sha256(source)
)
  throw new Error("Manual source/version drift: regenerate both PDFs.");
const normalize = (value: string) =>
  value.replace(/[\u2014\u2013\u2011]/g, "-").replace(/\s+/g, "");
for (const locale of ["en", "zh-TW"] as const) {
  const file = `swp-operation-manual-${locale}.pdf`;
  const artifact = manifest.artifacts?.[locale];
  if (artifact?.file !== file)
    throw new Error("Unexpected manual artifact path.");
  const path = join(directory, file);
  const pdf = readFileSync(path);
  if (
    pdf.subarray(0, 5).toString() !== "%PDF-" ||
    sha256(pdf) !== artifact.sha256
  )
    throw new Error("Manual PDF integrity mismatch.");
  if (integrityOnly) continue;
  const extracted = normalize(
    execFileSync(
      process.env.PDFTOTEXT_BIN ?? "pdftotext",
      ["-layout", path, "-"],
      {
        encoding: "utf8",
        maxBuffer: 2_000_000,
      },
    ),
  );
  for (const article of manualArticles) {
    for (const value of [
      article.title[locale],
      ...article.paragraphs.map((p) => p[locale]),
      ...article.links.flatMap((l) => [l.label[locale], l.href, l.permission]),
    ]) {
      if (!extracted.includes(normalize(value)))
        throw new Error(
          `Missing ${locale} manual text in topic ${article.id}.`,
        );
    }
  }
  if (!extracted.includes(manualVersion))
    throw new Error("Manual PDF version missing.");
}
console.log(
  integrityOnly
    ? "Both manual PDFs match source/version and artifact hashes (build integrity gate)."
    : "Both manual PDFs match source/version, artifact hashes and extracted bilingual content.",
);
