"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  cloudAuthEnabled,
  cloudAuthRequired,
  getAuthSession,
  onAuthStateChange,
  signInWithEmail,
  signOut as authSignOut,
  signUpWithEmail,
} from "@/lib/supabase/auth";
import { syncCloudOnLogin, clearCloudSyncState } from "@/lib/supabase/cloud-sync";
import { resetLocalDatabase } from "@/lib/db";

type AuthContextValue = {
  configured: boolean;
  required: boolean;
  user: User | null;
  loading: boolean;
  syncing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = cloudAuthEnabled();
  const required = cloudAuthRequired();
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(!configured);
  const [syncing, setSyncing] = useState(false);

  const loading = configured && !sessionReady;

  const runCloudSync = useCallback(async () => {
    if (!configured) return;
    setSyncing(true);
    try {
      await syncCloudOnLogin();
    } catch (err) {
      // Never block sign-in / sign-up when cloud backup isn't ready yet.
      console.warn("[Viswallet] Cloud sync skipped:", err);
    } finally {
      setSyncing(false);
    }
  }, [configured]);

  useEffect(() => {
    if (!configured) return;

    let mounted = true;

    getAuthSession().then((session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setSessionReady(true);
      if (session?.user) {
        void runCloudSync();
      }
    });

    const unsubscribe = onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [configured, runCloudSync]);

  const signIn = useCallback(async (email: string, password: string) => {
    const signedInUser = await signInWithEmail(email, password);
    setUser(signedInUser);
    void runCloudSync();
  }, [runCloudSync]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const newUser = await signUpWithEmail(email, password, displayName);
    setUser(newUser);
    void runCloudSync();
  }, [runCloudSync]);

  const signOut = useCallback(async () => {
    await authSignOut();
    clearCloudSyncState();
    await resetLocalDatabase();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      configured,
      required,
      user,
      loading,
      syncing,
      signIn,
      signUp,
      signOut,
    }),
    [configured, required, user, loading, syncing, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}
