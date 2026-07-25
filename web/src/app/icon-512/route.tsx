import { ImageResponse } from "next/og";
import { OgLogoMark } from "@/lib/brand/logo-og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(<OgLogoMark size={512} />, { width: 512, height: 512 });
}
