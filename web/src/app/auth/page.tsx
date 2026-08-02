"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell } from "@/components/brand/auth-shell";
import { StepHeader } from "@/components/brand/step-header";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/input";
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

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (!configured) {
      setError("Sign-in isn't available right now. You can keep using the app on this device.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password.length > 128) {
      setError("Password must be 128 characters or fewer.");
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
      headline="Welcome back"
      subcopy="Sign in to pick up where you left off — on this phone, tablet, or computer."
      features={[
        { n: "01", title: "One account", body: "Use the same login everywhere you track money." },
        { n: "02", title: "Always ready", body: "Add expenses anytime — even without a connection." },
        { n: "03", title: "Your data", body: "We never sell your information. You're in control." },
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
            placeholder="Tony Stark"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
          />
        )}
        <Input
          label="Email"
          type="email"
          placeholder="thor@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <PasswordInput
          label="Password"
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
