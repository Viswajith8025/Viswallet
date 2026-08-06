"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { AuthShell } from "@/components/brand/auth-shell";
import { StepHeader } from "@/components/brand/step-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { completeOnboarding, getProfile, getSettings } from "@/lib/db";
import { syncProfileFromAuthUser } from "@/lib/supabase/profile-sync";
import { parseRupeeInput, formatINR } from "@/lib/money";
import { SALARY_PRESETS } from "@/lib/ux/defaults";
import { successFeedback, tapFeedback } from "@/lib/ux/feedback";
import { copy } from "@/lib/ux/copy";
import { showToast } from "@/lib/store/toast-store";
import { cn } from "@/lib/design/cn";

const MIN_SALARY_PAISE = 1_000_00;
const STEPS = copy.onboardingSteps;

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [salaryDay, setSalaryDay] = useState("1");
  const [salary, setSalary] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const synced = user ? await syncProfileFromAuthUser(user) : null;
      const profile = await getProfile();
      if (cancelled) return;

      const name =
        synced ??
        (profile.displayName?.trim() && profile.displayName !== "You"
          ? profile.displayName.trim()
          : "");

      if (name) {
        setDisplayName(name);
        setStep(1);
      }
      setBootstrapped(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!bootstrapped) return;
    void getSettings().then((settings) => {
      if (settings.onboardingComplete) {
        router.replace("/");
      }
    });
  }, [bootstrapped, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    const day = Math.min(28, Math.max(1, parseInt(salaryDay, 10) || 1));
    const paise = parseRupeeInput(salary);
    if (!displayName.trim()) {
      setFormError(copy.validationOnboarding.nameRequired);
      setLoading(false);
      return;
    }
    if (paise < MIN_SALARY_PAISE) {
      setFormError(copy.validationOnboarding.salaryMin);
      setLoading(false);
      return;
    }
    try {
      await completeOnboarding(displayName.trim(), day, paise);
      successFeedback();
      setDone(true);
      setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 1400);
    } catch {
      showToast(copy.toast.setupFailed, { tone: "error" });
      setLoading(false);
    }
  }

  function goToStep1(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!displayName.trim()) {
      setFormError(copy.validationOnboarding.nameRequired);
      return;
    }
    tapFeedback();
    setStep(1);
  }

  if (!bootstrapped) {
    return (
      <AuthShell features={[]}>
        <p className="text-sm text-muted-foreground">{copy.onboarding.loadingSetup}</p>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell
        headline={copy.onboardingSuccess.headline}
        subcopy={copy.success.onboardingSubtitle}
        features={[]}
      >
        <div className="flex flex-col items-start py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-surface text-success">
            <Check size={22} strokeWidth={2.25} />
          </div>
          <p className="mt-6 font-display text-xl font-semibold tracking-tight">
            {copy.onboarding.welcome(displayName.trim())}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{copy.onboarding.openingDashboard}</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <StepHeader
        step={step}
        total={STEPS.length}
        title={step === 0 ? copy.onboarding.nameTitle : copy.onboarding.salaryTitle}
        description={
          step === 0
            ? copy.onboarding.nameDescription
            : displayName.trim()
              ? copy.onboarding.salaryDescriptionWithName(displayName.trim())
              : copy.onboarding.salaryDescriptionDefault
        }
      />

      <form
        onSubmit={step === 1 ? handleSubmit : goToStep1}
        noValidate
        className="space-y-6"
      >
        {step === 0 ? (
          <Input
            label={copy.forms.displayName}
            placeholder={copy.onboarding.namePlaceholder}
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (formError) setFormError(null);
            }}
            autoFocus
            autoComplete="name"
          />
        ) : (
          <>
            <Input
              label={copy.forms.monthlySalary}
              type="text"
              inputMode="numeric"
              placeholder="50,000"
              value={salary}
              onChange={(e) => {
                setSalary(e.target.value.replace(/[^\d.]/g, ""));
                if (formError) setFormError(null);
              }}
              autoFocus
            />

            <div className="space-y-2.5">
              <span className="text-xs font-medium text-foreground/80">{copy.onboarding.quickSelect}</span>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-4">
                {SALARY_PRESETS.map((p) => {
                  const active = salary === String(p.value);
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => {
                        tapFeedback();
                        setSalary(String(p.value));
                        if (formError) setFormError(null);
                      }}
                      className={cn(
                        "rounded-md border px-2 py-2 text-center text-[11px] font-medium tabular-nums transition-colors",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-surface text-muted-foreground hover:border-border-strong hover:text-foreground",
                      )}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
              {salary && parseRupeeInput(salary) >= MIN_SALARY_PAISE && (
                <p className="text-xs text-muted-foreground">
                  {copy.onboarding.perMonth(formatINR(parseRupeeInput(salary)))}
                </p>
              )}
            </div>

            <Input
              label={copy.forms.salaryDay}
              type="number"
              min="1"
              max="28"
              value={salaryDay}
              onChange={(e) => setSalaryDay(e.target.value)}
              hint={copy.onboarding.salaryDayHint}
              inputMode="numeric"
            />
          </>
        )}

        {formError && (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        )}

        <div className={cn("flex gap-2 pt-2", step === 0 && "flex-col")}>
          {step === 1 && (
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(0)}>
              {copy.buttons.back}
            </Button>
          )}
          <Button
            type="submit"
            className={cn("gap-2", step === 1 ? "flex-1" : "w-full")}
            size="lg"
            disabled={loading}
          >
            {loading ? copy.buttons.saving : step === 0 ? copy.buttons.continue : copy.buttons.finishSetup}
            {!loading && step === 0 && <ArrowRight size={15} />}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
