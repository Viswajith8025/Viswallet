"use client";

import { useEffect, useState } from "react";
import { PageHeader, PageContainer } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProfile, updateProfile } from "@/lib/db";
import { sanitizeName, sanitizeEmail } from "@/lib/security";
import { showToast } from "@/lib/store/toast-store";

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setDisplayName(p.displayName);
        setEmail(p.email ?? "");
      })
      .catch(() => {
        showToast("Could not load profile.", { tone: "error" });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!displayName.trim()) {
      setFormError("Enter a display name.");
      return;
    }
    const cleanEmail = email.trim() ? sanitizeEmail(email) : undefined;
    if (email.trim() && !cleanEmail) {
      setFormError("Enter a valid email address or leave it blank.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        displayName: sanitizeName(displayName),
        email: cleanEmail,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      showToast("Could not save profile.", { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="Profile"
        description="Personalize how Viswallet greets you."
      />

      <Card>
        <CardContent className="p-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          ) : (
            <form onSubmit={handleSave} className="mx-auto max-w-md space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-2xl font-semibold text-primary-foreground">
                  {displayName.charAt(0).toUpperCase() || "V"}
                </div>
                <div>
                  <p className="font-semibold">{displayName || "You"}</p>
                  <p className="text-sm text-muted-foreground">Local profile · stored on this device</p>
                </div>
              </div>
              <Input
                label="Display name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
              <Input
                label="Email (optional)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address (optional)"
                hint="Stored locally only — never sent to a server."
              />
              {formError && (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Saving..." : saved ? "Saved!" : "Save profile"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
