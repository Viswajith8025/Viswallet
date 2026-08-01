import type { User } from "@supabase/supabase-js";
import { getProfile, updateProfile } from "@/lib/db";
import { sanitizeEmail, sanitizeName } from "@/lib/security";

const DEFAULT_PROFILE_NAME = "You";

export function getDisplayNameFromAuthUser(user: User | null): string | null {
  if (!user) return null;
  const meta = user.user_metadata?.display_name;
  if (typeof meta === "string" && meta.trim()) return meta.trim();
  return null;
}

/** Keep local profile aligned with the signed-in Supabase account. */
export async function syncProfileFromAuthUser(user: User | null): Promise<string | null> {
  if (!user) return null;

  const profile = await getProfile();
  const patch: { displayName?: string; email?: string } = {};

  const authName = getDisplayNameFromAuthUser(user);
  const current = profile.displayName?.trim();
  if (authName && (!current || current === DEFAULT_PROFILE_NAME)) {
    patch.displayName = sanitizeName(authName);
  }

  if (user.email) {
    const clean = sanitizeEmail(user.email);
    if (clean && clean !== profile.email) {
      patch.email = clean;
    }
  }

  if (Object.keys(patch).length > 0) {
    await updateProfile(patch);
  }

  return patch.displayName ?? current ?? null;
}
