import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";

it.each(["source", "version", "filename", "artifact"])(
  "fails the real PDF gate on %s drift before content extraction",
  (change) => {
    const directory = mkdtempSync(join(tmpdir(), "swp-manual-drift-"));
    try {
      const manifest = JSON.parse(
        readFileSync("output/pdf/manifest.json", "utf8"),
      );
      if (change === "source") manifest.sourceSha256 = "0".repeat(64);
      if (change === "version") manifest.version = "old-version";
      if (change === "filename")
        manifest.artifacts.en.file = "../unrelated.pdf";
      writeFileSync(join(directory, "manifest.json"), JSON.stringify(manifest));
      if (change === "artifact")
        writeFileSync(
          join(directory, manifest.artifacts.en.file),
          "%PDF-tampered",
        );
      expect(() =>
        execFileSync(
          process.execPath,
          ["--import", "tsx", "scripts/check-manual-pdfs.ts"],
          {
            env: { ...process.env, MANUAL_PDF_DIRECTORY: directory },
            stdio: "pipe",
          },
        ),
      ).toThrow(
        change === "filename"
          ? /Unexpected manual artifact path/
          : change === "artifact"
            ? /Manual PDF integrity mismatch/
            : /Manual source\/version drift/,
      );
    } finally {
      // This directory was exclusively created by this test, never repository/user data.
      rmSync(directory, { recursive: true, force: true });
    }
  },
);
