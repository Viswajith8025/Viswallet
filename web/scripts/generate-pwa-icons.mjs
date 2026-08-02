import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = join(root, "public", "icons");
const markSvg = readFileSync(join(root, "public", "brand", "logo-mark.svg"));
const maskableSvg = readFileSync(join(root, "public", "brand", "logo-maskable.svg"));

mkdirSync(iconsDir, { recursive: true });

async function writePng(svg, size, filename) {
  await sharp(svg).resize(size, size).png().toFile(join(iconsDir, filename));
}

await writePng(markSvg, 192, "icon-192.png");
await writePng(markSvg, 512, "icon-512.png");
await writePng(maskableSvg, 512, "icon-maskable-512.png");
await writePng(markSvg, 180, "apple-touch-icon.png");
await writePng(markSvg, 32, "favicon-32.png");

console.log("PWA icons generated in public/icons/");
