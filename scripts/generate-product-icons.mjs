import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const source = await readFile(
  new URL("../public/swp-icon.svg", import.meta.url),
);
const png = await sharp(source).resize(32, 32).png().toBuffer();
const apple = await sharp(source).resize(180, 180).png().toBuffer();
// A single PNG-compressed 32px ICO image replaces the implicit legacy fallback.
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 32;
header[7] = 32;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
const files = [
  ["swp-icon-32.png", png],
  ["swp-apple-touch-icon.png", apple],
  ["favicon.ico", Buffer.concat([header, png])],
];
for (const [name, bytes] of files) {
  const target = new URL(`../public/${name}`, import.meta.url);
  if (process.argv.includes("--check")) {
    const current = await readFile(target);
    if (!current.equals(bytes))
      throw new Error(`Regenerate product icon: ${name}`);
  } else {
    await writeFile(target, bytes);
  }
}
console.log(
  process.argv.includes("--check")
    ? "Product icon derivatives match SVG source."
    : "Generated SWP icon derivatives.",
);
