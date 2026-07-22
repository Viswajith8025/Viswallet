"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProfile, updateProfile } from "@/lib/db";
import { sanitizeName, sanitizeEmail } from "@/lib/security";

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile().then((p) => {
      setDisplayName(p.displayName);
      setEmail(p.email ?? "");
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    await updateProfile({
      displayName: sanitizeName(displayName),
      email: sanitizeEmail(email),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Profile"
        description="Personalize how Viswallet greets you."
      />

      <Card>
        <CardContent className="p-5">
          <form onSubmit={handleSave} className="mx-auto max-w-md space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-2xl font-semibold text-primary-foreground">
                {displayName.charAt(0).toUpperCase() || "V"}
              </div>
              <div>
                <p className="font-semibold">{displayName || "You"}</p>
                <p className="text-sm text-muted-foreground">Viswallet Premium</p>
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
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Saving..." : saved ? "Saved!" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
