"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, Wallet } from "lucide-react";
import { Dialog, DialogBody } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { formatCycleLabel } from "@/lib/salary-cycle";
import {
  buildSalaryCreditPreview,
  creditSalaryForCurrentCycle,
  dismissSalaryCreditForCycle,
  dismissSalaryCreditPromptForToday,
  shouldPromptSalaryCredit,
  type SalaryCreditPreview,
} from "@/lib/salary/salary-credit";
import { useInvalidateFinance } from "@/hooks/use-invalidate-finance";
import { showToast } from "@/lib/store/toast-store";
import { useUIStore } from "@/lib/store/ui-store";

const LAUNCH_GUARD_MS = 2000;
const salaryPromptArmedAt = Date.now();
let salaryPromptDecided = false;

function anotherOverlayOpen(): boolean {
  const ui = useUIStore.getState();
  if (ui.commandOpen || ui.quickAddOpen || ui.statementImportOpen || ui.mobileMenuOpen) return true;
  return document.querySelector("[role='dialog']") != null;
}

export function SalaryCreditModal() {
  const invalidate = useInvalidateFinance();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<SalaryCreditPreview | null>(null);
  const [salaryInput, setSalaryInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    const data = await buildSalaryCreditPreview();
    setPreview(data);
    if (data && data.baseSalaryPaise > 0) {
      setSalaryInput(String(data.baseSalaryPaise / 100));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const attempt = async () => {
      if (cancelled || salaryPromptDecided) return;
      const elapsed = Date.now() - salaryPromptArmedAt;
      if (elapsed < LAUNCH_GUARD_MS) {
        timer = setTimeout(() => void attempt(), LAUNCH_GUARD_MS - elapsed);
        return;
      }
      if (anotherOverlayOpen()) {
        timer = setTimeout(() => void attempt(), 1000);
        return;
      }
      const should = await shouldPromptSalaryCredit();
      if (cancelled || salaryPromptDecided) return;
      if (!should) {
        salaryPromptDecided = true;
        return;
      }
      await loadPreview();
      if (cancelled || salaryPromptDecided) return;
      salaryPromptDecided = true;
      setOpen(true);
    };

    void attempt();
    const onVisible = () => {
      if (document.visibilityState === "visible") void attempt();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadPreview]);

  async function handleNotYet() {
    await dismissSalaryCreditPromptForToday();
    setOpen(false);
  }

  async function handleSkipCycle() {
    await dismissSalaryCreditForCycle();
    setOpen(false);
  }

  async function handleConfirm() {
    setError(null);
    const paise = parseRupeeInput(salaryInput);

    if (paise <= 0) {
      setError("Enter your monthly salary amount.");
      return;
    }

    setSaving(true);
    try {
      const result = await creditSalaryForCurrentCycle(paise);
      await invalidate();
      setOpen(false);
      showToast(
        `Salary credited · ${formatINR(result.totalAvailablePaise)} available this cycle`,
        { tone: "success" },
      );
    } catch {
      setError("Could not record salary. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const carryOver = preview?.carryOverPaise ?? 0;
  const salaryPaise = parseRupeeInput(salaryInput);
  const totalPreview = salaryPaise + carryOver;
  const hasExpected = (preview?.baseSalaryPaise ?? 0) > 0;

  return (
    <Dialog open={open} onClose={handleNotYet} labelledBy="salary-credit-title" size="sm">
      <DialogBody className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">
            <Banknote size={22} strokeWidth={2.25} />
          </span>
          <div>
            <h2 id="salary-credit-title" className="text-lg font-semibold tracking-tight">
              Salary credited?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {preview
                ? `Has your salary arrived for ${formatCycleLabel(preview.monthKey)}? We will add it to what you saved last cycle.`
                : "Has your salary arrived this month?"}
            </p>
          </div>
        </div>

        {preview && (
          <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm">
            {carryOver > 0 && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Saved from last cycle</span>
                <span className="font-medium tabular-nums">{formatINR(carryOver)}</span>
              </div>
            )}
            <Input
              label={
                hasExpected
                  ? `Expected salary ${formatINR(preview.baseSalaryPaise)} (from your salary settings)`
                  : "Expected salary"
              }
              type="number"
              inputMode="decimal"
              required
              value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value)}
              placeholder="Enter the amount you expect"
              hint={hasExpected ? undefined : "No salary is saved yet. Enter what you expect this cycle."}
            />
            <div className="flex items-center justify-between gap-2 border-t border-border pt-2 font-semibold">
              <span className="flex items-center gap-1.5">
                <Wallet size={14} className="text-primary" />
                Available this cycle
              </span>
              <span className="tabular-nums text-primary">{formatINR(totalPreview)}</span>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={handleSkipCycle} disabled={saving}>
            Don&apos;t ask this cycle
          </Button>
          <Button type="button" variant="ghost" onClick={handleNotYet} disabled={saving}>
            Not yet
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={saving || salaryPaise <= 0}>
            {saving ? "Saving…" : "Yes, credited"}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          We&apos;ll ask again tomorrow until you confirm.
        </p>
      </DialogBody>
    </Dialog>
  );
}
