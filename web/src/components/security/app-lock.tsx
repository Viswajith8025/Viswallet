"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unlockWithPin, isPinLocked } from "@/lib/security/pin";
import { toSecureMessage, SecureError } from "@/lib/security";
import { useSecurityStore } from "@/lib/store/security-store";

export function AppLockScreen() {
  const setUnlocked = useSecurityStore((s) => s.setUnlocked);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    isPinLocked().then(setLocked);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await unlockWithPin(pin);
      setUnlocked(true);
      setPin("");
    } catch (err) {
      setError(toSecureMessage(err));
      if (err instanceof SecureError && err.code === "PIN_LOCKED") {
        setLocked(true);
      }
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 backdrop-blur-md">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock size={28} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Viswallet is locked</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your PIN to access your financial data.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="PIN"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            disabled={locked}
            autoFocus
            aria-describedby={error ? "pin-error" : undefined}
          />
          {error && (
            <p id="pin-error" className="text-sm font-medium text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading || locked || pin.length < 4}>
            {locked ? "Locked" : loading ? "Verifying..." : "Unlock"}
          </Button>
        </form>
      </div>
    </div>
  );
}
