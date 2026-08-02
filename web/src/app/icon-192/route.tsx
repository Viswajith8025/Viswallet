import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET() {
  const buffer = await readFile(join(process.cwd(), "public/icons/icon-192.png"));
  return new Response(buffer, { headers: { "Content-Type": "image/png" } });
}
