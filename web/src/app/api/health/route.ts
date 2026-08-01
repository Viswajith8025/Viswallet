import { NextResponse } from "next/server";
import { getDeploymentReadiness } from "@/lib/deployment/readiness";

export const dynamic = "force-dynamic";

export function GET() {
  const readiness = getDeploymentReadiness();
  return NextResponse.json(readiness, {
    status: readiness.ok ? 200 : 503,
  });
}
