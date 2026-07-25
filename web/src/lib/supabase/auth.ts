import type { User, Session, AuthError } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";

export type { User, Session };

export function cloudAuthEnabled(): boolean {
  return isSupabaseConfigured();
}

/** Cloud login is required whenever Supabase is configured. */
export function cloudAuthRequired(): boolean {
  return isSupabaseConfigured();
}

let signInInFlight: Promise<User> | null = null;
let signUpInFlight: Promise<User> | null = null;

export async function getAuthSession(): Promise<Session | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function getAuthUser(): Promise<User | null> {
  const session = await getAuthSession();
  return session?.user ?? null;
}

function mapAuthError(error: AuthError): string {
  const msg = error.message.toLowerCase();
  const code = (error.code ?? "").toLowerCase();

  if (
    code === "invalid_credentials" ||
    msg.includes("invalid login credentials") ||
    msg.includes("invalid credentials")
  ) {
    return "Email or password is incorrect.";
  }

  if (code === "user_not_found" || msg.includes("user not found")) {
    return "No account found for this email. Create an account first.";
  }

  if (code === "email_not_confirmed" || msg.includes("email not confirmed")) {
    return "Account is not active yet. Turn off email confirmation in Supabase Auth settings.";
  }

  if (msg.includes("invalid api key") || msg.includes("invalid jwt") || code === "bad_jwt") {
    return "Cloud auth is misconfigured. Check your Supabase anon key.";
  }

  if (msg.includes("already registered") || msg.includes("user already registered")) {
    return "An account with this email already exists. Use Sign in.";
  }

  if (msg.includes("password") && (msg.includes("short") || msg.includes("least"))) {
    return "Password must be at least 6 characters.";
  }

  if (msg.includes("signup") && msg.includes("disabled")) {
    return "Sign-ups are disabled. Contact the app owner.";
  }

  if (msg.includes("invalid email") || msg.includes("unable to validate email")) {
    return "Enter a valid email address.";
  }

  if (error.status === 429 || msg.includes("rate limit") || msg.includes("too many")) {
    return "Supabase temporarily limited requests from this device. Try again in a minute.";
  }

  return error.message || "Authentication failed. Try again.";
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  if (signInInFlight) return signInInFlight;

  signInInFlight = (async () => {
    const sb = getSupabase();
    if (!sb) throw new Error("Cloud accounts are not configured.");

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      throw new Error("Enter a valid email address.");
    }

    const { data, error } = await sb.auth.signInWithPassword({ email: trimmed, password });
    if (error) throw new Error(mapAuthError(error));
    if (!data.user) throw new Error("Sign in failed.");
    return data.user;
  })().finally(() => {
    signInInFlight = null;
  });

  return signInInFlight;
}

/** Create account — one request; session returned when email confirmation is off in Supabase. */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<User> {
  if (signUpInFlight) return signUpInFlight;

  signUpInFlight = (async () => {
    const sb = getSupabase();
    if (!sb) throw new Error("Cloud accounts are not configured.");

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      throw new Error("Enter a valid email address.");
    }

    const { data, error } = await sb.auth.signUp({
      email: trimmed,
      password,
      options: {
        data: displayName?.trim() ? { display_name: displayName.trim() } : undefined,
      },
    });
    if (error) throw new Error(mapAuthError(error));

    if (data.user?.identities?.length === 0) {
      throw new Error("An account with this email already exists. Use Sign in below.");
    }

    if (data.session?.user) return data.session.user;

    const { data: sessionData } = await sb.auth.getSession();
    if (sessionData.session?.user) return sessionData.session.user;

    throw new Error(
      "Account created but sign-in failed. Turn off email confirmation in Supabase, then sign in.",
    );
  })().finally(() => {
    signUpInFlight = null;
  });

  return signUpInFlight;
}

export async function signOut(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.auth.signOut();
}

export function onAuthStateChange(
  handler: (event: string, session: Session | null) => void,
): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((event, session) => handler(event, session));
  return () => data.subscription.unsubscribe();
}
