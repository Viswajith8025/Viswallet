import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const brandDir = join(root, "public", "brand");
const iconsDir = join(root, "public", "icons");

const mark = readFileSync(join(brandDir, "mark.svg"));
const maskable = readFileSync(join(brandDir, "mark-maskable.svg"));

mkdirSync(iconsDir, { recursive: true });

async function raster(svg, size, dest) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(dest);
}

await raster(mark, 192, join(iconsDir, "icon-192.png"));
await raster(mark, 512, join(iconsDir, "icon-512.png"));
await raster(maskable, 512, join(iconsDir, "icon-maskable-512.png"));
await raster(maskable, 180, join(iconsDir, "apple-touch-icon.png"));
await raster(mark, 32, join(iconsDir, "favicon-32.png"));
await raster(mark, 48, join(iconsDir, "favicon-48.png"));
await raster(mark, 256, join(brandDir, "logo.png"));
await raster(mark, 512, join(brandDir, "logo@2x.png"));

copyFileSync(join(iconsDir, "favicon-48.png"), join(root, "public", "favicon.ico"));

console.log("PWA icons and retina logo generated.");
