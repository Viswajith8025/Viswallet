import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const buffer = await readFile(join(process.cwd(), "public/icons/favicon-32.png"));
  return new Response(buffer, { headers: { "Content-Type": "image/png" } });
}
