import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/security/env";
import { markCloudUnreachable } from "@/lib/supabase/reachability";

let client: SupabaseClient | null = null;

function createGuardedFetch(getClient: () => SupabaseClient | null): typeof fetch {
  return async (input, init) => {
    try {
      return await fetch(input, init);
    } catch (error) {
      markCloudUnreachable();
      void getClient()?.auth.stopAutoRefresh();
      throw error;
    }
  };
}

/**
 * Optional cloud sync layer. Local IndexedDB remains source of truth.
 * When enabled, all Supabase access MUST go through RLS-protected tables.
 */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  let config: { url: string; anonKey: string } | null;
  try {
    config = getSupabaseConfig();
  } catch {
    return null;
  }
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
      fetch: createGuardedFetch(() => client),
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
