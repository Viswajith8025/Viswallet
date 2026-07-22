import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "viswallet-web",
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
