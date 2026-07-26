"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/brand/auth-shell";
import { StepHeader } from "@/components/brand/step-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { getSettings } from "@/lib/db";

export default function AuthPage() {
  const router = useRouter();
  const { signIn, signUp, configured } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const submittingRef = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current || loading) return;
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (!configured) {
      setError("Cloud accounts are not configured. Add Supabase keys to .env.local and restart the dev server.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    submittingRef.current = true;
    try {
      if (mode === "signin") {
        await signIn(trimmedEmail, password);
        const settings = await getSettings();
        router.replace(settings.onboardingComplete ? "/" : "/onboarding");
      } else {
        const outcome = await signUp(trimmedEmail, password, displayName);
        if (outcome.signedIn) {
          router.replace("/onboarding");
        } else {
          setMode("signin");
          setNotice(outcome.message);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      if (message.toLowerCase().includes("already exists")) {
        setMode("signin");
      }
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthShell
      headline="Sign in once. Keep everything."
      subcopy="Cloud backup restores your ledger after reinstall — PIN and app lock still stay on this device."
      features={[
        { n: "01", title: "One account", body: "Your vault syncs automatically while you're signed in." },
        { n: "02", title: "Device-first", body: "Works offline. Cloud is the safety net, not the bottleneck." },
        { n: "03", title: "Private by design", body: "We never sell your data. You control export and deletion." },
      ]}
    >
      <StepHeader
        step={0}
        total={1}
        title={mode === "signin" ? "Sign in" : "Create your account"}
        description={
          mode === "signin"
            ? "Use the email and password you signed up with."
            : "Pick email and password — you'll go straight to setup."
        }
      />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {mode === "signup" && (
          <Input
            label="Name"
            placeholder="Vishwajit"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
          />
        )}
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
        />
        {notice && (
          <p className="text-sm text-success" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
        <button
          type="button"
          className="font-medium text-foreground underline-offset-4 hover:underline"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
        >
          {mode === "signin" ? "Create account" : "Sign in"}
        </button>
      </p>

      <p className="mt-8 text-xs leading-relaxed text-muted-foreground/80">
        By continuing you agree to our{" "}
        <Link href="/terms" className="text-foreground/70 underline-offset-2 hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-foreground/70 underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthShell>
  );
}
