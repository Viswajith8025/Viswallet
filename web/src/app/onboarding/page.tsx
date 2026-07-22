"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Hint } from "@/components/ui/hint";
import { SuccessMark } from "@/components/ui/success-mark";
import { EASE_OUT } from "@/components/ui/motion";
import { completeOnboarding } from "@/lib/db";
import { parseRupeeInput } from "@/lib/money";
import { SALARY_PRESETS } from "@/lib/ux/defaults";
import { successFeedback, tapFeedback } from "@/lib/ux/feedback";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [salaryDay, setSalaryDay] = useState("1");
  const [salary, setSalary] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const day = Math.min(28, Math.max(1, parseInt(salaryDay, 10) || 1));
    const paise = parseRupeeInput(salary);
    if (paise <= 0 || !displayName.trim()) {
      setLoading(false);
      return;
    }
    await completeOnboarding(displayName.trim(), day, paise);
    successFeedback();
    setDone(true);
    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1400);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <motion.div
        className="pointer-events-none absolute -left-20 top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-16 bottom-24 h-48 w-48 rounded-full bg-success/10 blur-3xl"
        animate={{ x: [0, -15, 0], y: [0, 12, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(95,74,139,0.08),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE_OUT }}
        className="relative w-full max-w-md"
      >
        <div className="mb-10 text-center">
          <motion.div
            className="mx-auto mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-xl bg-primary text-3xl font-semibold text-primary-foreground shadow-glow"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            V
          </motion.div>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome to Viswallet</h1>
          <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-muted-foreground">
            Premium personal finance — private, offline-first, and beautifully simple.
          </p>
        </div>

        <div className="mb-8 flex justify-center gap-2">
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="h-1 rounded-full bg-muted"
              animate={{
                width: step >= i ? 48 : 24,
                backgroundColor: step >= i ? "var(--primary)" : "var(--muted)",
              }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
            />
          ))}
        </div>

        <div className="surface-card p-6 md:p-8">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8"
              >
                <SuccessMark label={`You're all set, ${displayName}!`} />
                <p className="mt-3 text-center text-sm text-muted-foreground">Opening your dashboard…</p>
              </motion.div>
            ) : (
              <motion.form
                key={step}
                initial={{ opacity: 0, x: step === 0 ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: step === 0 ? 16 : -16 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                onSubmit={
                  step === 1
                    ? handleSubmit
                    : (e) => {
                        e.preventDefault();
                        tapFeedback();
                        setStep(1);
                      }
                }
                className="space-y-5"
              >
                {step === 0 ? (
                  <>
                    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                      <Sparkles size={16} className="shrink-0 text-primary" />
                      Let&apos;s personalize your experience in under a minute.
                    </div>
                    <Input
                      label="What should we call you?"
                      required
                      placeholder="e.g. Rahul"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      autoFocus
                    />
                    <Button type="submit" className="w-full gap-2" size="lg" disabled={!displayName.trim()}>
                      Continue
                      <ArrowRight size={16} />
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Hi <span className="font-medium text-foreground">{displayName}</span>! Set up your
                      salary cycle so budgets and insights work correctly.
                    </p>
                    <Input
                      label="Monthly salary (INR)"
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 50000"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      {SALARY_PRESETS.map((p) => (
                        <motion.button
                          key={p.value}
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            tapFeedback();
                            setSalary(String(p.value));
                          }}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                            salary === String(p.value)
                              ? "border-primary bg-primary/10 text-primary shadow-xs"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {p.label}
                        </motion.button>
                      ))}
                    </div>
                    <Input
                      label="Salary day of month (1–28)"
                      type="number"
                      min="1"
                      max="28"
                      required
                      value={salaryDay}
                      onChange={(e) => setSalaryDay(e.target.value)}
                      hint="Your cycle starts on this day each month."
                    />
                    <Hint>
                      Your salary cycle starts on this day each month. Budgets and insights use this window — you can change it later in Settings.
                    </Hint>
                    <div className="flex items-center gap-2 rounded-xl bg-success-muted/60 p-3 text-xs text-success">
                      <Shield size={14} className="shrink-0" />
                      Your data stays on this device. No account required.
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(0)}>
                        Back
                      </Button>
                      <Button type="submit" className="flex-1" size="lg" disabled={loading}>
                        {loading ? "Setting up..." : "Get started"}
                      </Button>
                    </div>
                  </>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
