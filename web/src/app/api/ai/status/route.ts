import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/security/env";
import { isGroqConfigured } from "@/lib/ai/groq-server";

export async function GET() {
  const groq = isGroqConfigured();
  let supabase = false;
  try {
    supabase = getSupabaseConfig() !== null;
  } catch {
    supabase = false;
  }
  const cloudVault = process.env.NEXT_PUBLIC_CLOUD_VAULT === "true";

  return NextResponse.json({
    available: groq,
    groq,
    supabase,
    cloudVault,
  });
}
