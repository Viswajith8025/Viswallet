/**
 * Validates environment configuration at build/runtime.
 * NEXT_PUBLIC_* vars are intentionally client-visible (Supabase anon key).
 */
export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url && !anonKey) return null;
  if (!url || !anonKey) {
    throw new Error("Supabase: both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set together.");
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      throw new Error("Supabase URL must use HTTPS.");
    }
  } catch {
    throw new Error("Supabase URL is invalid.");
  }

  if (anonKey.length < 20) {
    throw new Error("Supabase anon key appears invalid.");
  }

  if (!anonKey.startsWith("eyJ") && !anonKey.startsWith("sb_publishable_")) {
    throw new Error(
      "Supabase anon key looks wrong. Use the anon/public key from Project Settings → API.",
    );
  }

  return { url, anonKey };
}

export const isProduction = process.env.NODE_ENV === "production";
