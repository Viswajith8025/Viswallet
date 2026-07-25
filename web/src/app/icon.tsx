import { ImageResponse } from "next/og";
import { OgLogoMark } from "@/lib/brand/logo-og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<OgLogoMark size={32} />, { ...size });
}
