import type { User } from "@supabase/supabase-js";
import { getProfile, updateProfile } from "@/lib/db";
import { sanitizeName } from "@/lib/security";

const DEFAULT_PROFILE_NAME = "You";

export function getDisplayNameFromAuthUser(user: User | null): string | null {
  if (!user) return null;
  const meta = user.user_metadata?.display_name;
  if (typeof meta === "string" && meta.trim()) return meta.trim();
  return null;
}

/** Copy Supabase sign-up name into local profile when still on the default placeholder. */
export async function syncProfileFromAuthUser(user: User | null): Promise<string | null> {
  const authName = getDisplayNameFromAuthUser(user);
  if (!authName) return null;

  const profile = await getProfile();
  const current = profile.displayName?.trim();
  if (current && current !== DEFAULT_PROFILE_NAME) return current;

  const clean = sanitizeName(authName);
  await updateProfile({ displayName: clean });
  return clean;
}
