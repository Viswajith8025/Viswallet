import { readFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const brandDir = join(root, "public", "brand");
const iconsDir = join(root, "public", "icons");
const logoPng = readFileSync(join(brandDir, "logo.png"));

mkdirSync(iconsDir, { recursive: true });

async function writePng(size, filename, { maskable = false } = {}) {
  let pipeline = sharp(logoPng);
  if (maskable) {
    const inner = Math.round(size * 0.8);
    pipeline = pipeline.resize(inner, inner, { fit: "contain" }).extend({
      top: Math.floor((size - inner) / 2),
      bottom: Math.ceil((size - inner) / 2),
      left: Math.floor((size - inner) / 2),
      right: Math.ceil((size - inner) / 2),
      background: { r: 95, g: 74, b: 139 },
    });
  } else {
    pipeline = pipeline.resize(size, size, { fit: "cover" });
  }
  await pipeline.png().toFile(join(iconsDir, filename));
}

await sharp(logoPng).resize(256, 256, { fit: "cover" }).png().toFile(join(brandDir, "logo@2x.png"));
await writePng(192, "icon-192.png");
await writePng(512, "icon-512.png");
await writePng(512, "icon-maskable-512.png", { maskable: true });
await writePng(180, "apple-touch-icon.png");
await writePng(32, "favicon-32.png");
await writePng(48, "favicon-48.png");

copyFileSync(join(iconsDir, "favicon-48.png"), join(root, "public", "favicon.ico"));

console.log("PWA icons and retina logo generated.");
