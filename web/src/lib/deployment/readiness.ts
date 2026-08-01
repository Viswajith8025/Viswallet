import { isGroqConfigured } from "@/lib/ai/groq-server";
import { getSupabaseConfig } from "@/lib/security/env";
import type { DeploymentReadiness } from "@/lib/deployment/types";

export function getDeploymentReadiness(): DeploymentReadiness {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";
  const appUrlRaw = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "";
  const appUrl =
    appUrlRaw.length > 0 &&
    appUrlRaw.startsWith("https://") &&
    !appUrlRaw.includes("localhost");

  let supabase = false;
  try {
    supabase = getSupabaseConfig() !== null;
  } catch {
    supabase = false;
  }

  let groq = false;
  try {
    groq = isGroqConfigured();
  } catch {
    groq = false;
  }

  const cloudVault = process.env.NEXT_PUBLIC_CLOUD_VAULT === "true";
  const ok = appUrl && supabase && cloudVault;

  return {
    ok,
    service: "viswallet-web",
    version,
    timestamp: new Date().toISOString(),
    checks: {
      appUrl,
      supabase,
      cloudVault,
      groq,
    },
  };
}
