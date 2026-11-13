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
import { syncCloudOnLogin, clearCloudSyncState, shouldAutoCloudSync } from "@/lib/supabase/cloud-sync";
import { syncProfileFromAuthUser } from "@/lib/supabase/profile-sync";
import { isCloudUnreachable, onCloudReachabilityChange } from "@/lib/supabase/reachability";
import { resetLocalDatabase } from "@/lib/db";
import { onCloudSyncActive } from "@/lib/notifications/bus";

type AuthContextValue = {
  configured: boolean;
  required: boolean;
  user: User | null;
  loading: boolean;
  /** True when the configured cloud host cannot be reached this session. */
  cloudDown: boolean;
  /** False while login cloud restore is in progress (when vault is enabled). */
  cloudSyncReady: boolean;
  syncing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<
    { signedIn: true } | { signedIn: false; message: string }
  >;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_READY_TIMEOUT_MS = 5000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = cloudAuthEnabled();
  const required = cloudAuthRequired();
  const [user, setUser] = useState<User | null>(null);
  const [cloudDown, setCloudDown] = useState(isCloudUnreachable);
  const [sessionReady, setSessionReady] = useState(!configured || isCloudUnreachable());
  const [cloudSyncReady, setCloudSyncReady] = useState(!configured || isCloudUnreachable() || !shouldAutoCloudSync());
  const [loginSyncing, setLoginSyncing] = useState(false);
  const [autoSyncing, setAutoSyncing] = useState(false);
  const syncing = loginSyncing || autoSyncing;

  const loading = configured && !cloudDown && !sessionReady;

  useEffect(() => {
    return onCloudReachabilityChange(() => {
      setCloudDown(true);
      setSessionReady(true);
      setCloudSyncReady(true);
    });
  }, []);

  const runCloudSync = useCallback(async () => {
    if (!configured || cloudDown || !shouldAutoCloudSync()) {
      setCloudSyncReady(true);
      return;
    }
    setLoginSyncing(true);
    setCloudSyncReady(false);
    try {
      await syncCloudOnLogin();
    } catch (err) {
      console.warn("[Viswallet] Cloud sync skipped:", err);
    } finally {
      setLoginSyncing(false);
      setCloudSyncReady(true);
    }
  }, [configured, cloudDown]);

  useEffect(() => {
    return onCloudSyncActive(setAutoSyncing);
  }, []);

  useEffect(() => {
    if (!configured || cloudDown) return;

    let mounted = true;
    let resolved = false;

    const markSessionReady = () => {
      if (!mounted || resolved) return;
      resolved = true;
      setSessionReady(true);
    };

    const authTimeout = window.setTimeout(markSessionReady, SESSION_READY_TIMEOUT_MS);

    getAuthSession().then((session) => {
      if (!mounted) return;
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      markSessionReady();
      if (sessionUser && shouldAutoCloudSync()) {
        void runCloudSync();
      }
    });

    const unsubscribe = onAuthStateChange((event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        markSessionReady();
      }
      if (event === "SIGNED_IN" && session?.user && shouldAutoCloudSync()) {
        void runCloudSync();
      }
    });

    return () => {
      mounted = false;
      window.clearTimeout(authTimeout);
      unsubscribe();
    };
  }, [configured, cloudDown, runCloudSync]);

  const signIn = useCallback(async (email: string, password: string) => {
    const signedInUser = await signInWithEmail(email, password);
    await syncProfileFromAuthUser(signedInUser);
    setUser(signedInUser);
    setSessionReady(true);
    void runCloudSync();
  }, [runCloudSync]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const outcome = await signUpWithEmail(email, password, displayName);
    if (outcome.status === "signed_in") {
      await syncProfileFromAuthUser(outcome.user);
      setUser(outcome.user);
      setSessionReady(true);
      void runCloudSync();
      return { signedIn: true as const };
    }
    return { signedIn: false as const, message: outcome.message };
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
      cloudDown,
      cloudSyncReady,
      syncing,
      signIn,
      signUp,
      signOut,
    }),
    [configured, required, user, loading, cloudDown, cloudSyncReady, syncing, signIn, signUp, signOut],
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
