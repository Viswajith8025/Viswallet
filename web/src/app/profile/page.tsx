"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, PageContainer } from "@/components/ui/page";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { getProfile, updateProfile } from "@/lib/db";
import { sanitizeName } from "@/lib/security";
import { copy } from "@/lib/ux/copy";
import { showToast } from "@/lib/store/toast-store";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { readAvatarFromFile } from "@/lib/profile/avatar";

export default function ProfilePage() {
  const router = useRouter();
  const { configured, user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setDisplayName(p.displayName);
        setAvatarUrl(p.avatarUrl);
        setAccountEmail(p.email ?? null);
      })
      .catch(() => {
        showToast(copy.toast.profileLoadFailed, { tone: "error" });
      })
      .finally(() => setLoading(false));
  }, []);

  const signedInEmail = user?.email ?? accountEmail;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!displayName.trim()) {
      setFormError(copy.profile.displayNameRequired);
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        displayName: sanitizeName(displayName),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      showToast(copy.toast.profileSaved, { tone: "success" });
    } catch {
      showToast(copy.toast.profileSaveFailed, { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarPick(file: File) {
    setAvatarBusy(true);
    try {
      const dataUrl = await readAvatarFromFile(file);
      await updateProfile({ avatarUrl: dataUrl });
      setAvatarUrl(dataUrl);
      showToast(copy.toast.photoUpdated, { tone: "success" });
    } catch (err) {
      showToast(err instanceof Error ? err.message : copy.toast.photoUpdateFailed, { tone: "error" });
    } finally {
      setAvatarBusy(false);
    }
  }

  async function removeAvatar() {
    setAvatarBusy(true);
    try {
      await updateProfile({ avatarUrl: undefined });
      setAvatarUrl(undefined);
      showToast(copy.toast.photoRemoved, { tone: "success" });
    } catch {
      showToast(copy.toast.photoRemoveFailed, { tone: "error" });
    } finally {
      setAvatarBusy(false);
    }
  }

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader title={copy.profile.title} description={copy.profile.description} />

      <Card>
        <CardContent className="p-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">{copy.profile.loading}</p>
          ) : (
            <form onSubmit={handleSave} className="mx-auto max-w-md space-y-5">
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  displayName={displayName}
                  avatarUrl={avatarUrl}
                  size="lg"
                  editable
                  uploading={avatarBusy}
                  onPickFile={(file) => void handleAvatarPick(file)}
                />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{displayName || copy.profile.you}</p>
                  {signedInEmail ? (
                    <p className="text-sm text-muted-foreground truncate">{signedInEmail}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{copy.profile.signInHint}</p>
                  )}
                </div>
              </div>

              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={avatarBusy}
                  onClick={() => void removeAvatar()}
                >
                  {copy.profile.removePhoto}
                </Button>
              )}

              <Input
                label={copy.forms.displayName}
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={copy.onboarding.namePlaceholder}
              />

              {configured && signedInEmail && (
                <div className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
                  <p className="font-medium text-foreground">{copy.profile.accountEmail}</p>
                  <p className="mt-0.5 text-muted-foreground">{signedInEmail}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {copy.profile.accountEmailHint}
                  </p>
                </div>
              )}

              {formError && (
                <p className="text-sm text-destructive" role="alert">{formError}</p>
              )}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? copy.buttons.saving : saved ? copy.profile.saved : copy.profile.saveProfile}
              </Button>
              {configured && user && (
                <div className="border-t border-border pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      await signOut();
                      router.replace("/auth");
                    }}
                  >
                    {copy.buttons.signOut}
                  </Button>
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
