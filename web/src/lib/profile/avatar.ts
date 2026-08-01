import { MAX_AVATAR_DATA_LENGTH } from "@/lib/security/constants";

const AVATAR_PX = 256;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Resize and compress an image file to a JPEG data URL for local profile storage. */
export async function readAvatarFromFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a photo (JPG, PNG, or WebP).");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Photo is too large. Try one under 5 MB.");
  }

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_PX;
  canvas.height = AVATAR_PX;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not process photo.");
  }

  const min = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - min) / 2;
  const sy = (bitmap.height - min) / 2;
  ctx.drawImage(bitmap, sx, sy, min, min, 0, 0, AVATAR_PX, AVATAR_PX);
  bitmap.close();

  let quality = 0.88;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_AVATAR_DATA_LENGTH && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > MAX_AVATAR_DATA_LENGTH) {
    throw new Error("Photo is too large after compression. Try a simpler image.");
  }
  return dataUrl;
}
