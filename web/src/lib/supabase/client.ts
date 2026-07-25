import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/security/env";

let client: SupabaseClient | null = null;

/**
 * Optional cloud sync layer. Local IndexedDB remains source of truth.
 * When enabled, all Supabase access MUST go through RLS-protected tables.
 */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const config = getSupabaseConfig();
  if (!config) return null;

  client = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
    },
    global: {
      headers: { "X-Client-Info": "viswallet-web" },
    },
  });

  return client;
}

export const isSupabaseConfigured = (): boolean => {
  try {
    return getSupabaseConfig() !== null;
  } catch {
    return false;
  }
};

/** @deprecated Use getSupabase() — lazy init with secure defaults */
export const supabase = (() => {
  try {
    return typeof window !== "undefined" ? getSupabase() : null;
  } catch {
    return null;
  }
})();
