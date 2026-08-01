"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Banknote, Wallet } from "lucide-react";
import { Dialog, DialogBody } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR, parseRupeeInput } from "@/lib/money";
import { formatCycleLabel } from "@/lib/salary-cycle";
import {
  buildSalaryCreditPreview,
  creditSalaryForCurrentCycle,
  dismissSalaryCreditPromptForToday,
  shouldPromptSalaryCredit,
  type SalaryCreditPreview,
} from "@/lib/salary/salary-credit";
import { useInvalidateFinance } from "@/hooks/use-invalidate-finance";
import { showToast } from "@/lib/store/toast-store";

const SKIP_PATHS = ["/onboarding", "/auth"];

export function SalaryCreditModal() {
  const pathname = usePathname();
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
    if (SKIP_PATHS.some((p) => pathname.startsWith(p))) return;

    let cancelled = false;
    (async () => {
      const should = await shouldPromptSalaryCredit();
      if (cancelled || !should) return;
      await loadPreview();
      if (!cancelled) setOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, loadPreview]);

  async function handleNotYet() {
    await dismissSalaryCreditPromptForToday();
    setOpen(false);
  }

  async function handleConfirm() {
    setError(null);
    const paise =
      preview && preview.baseSalaryPaise > 0
        ? preview.baseSalaryPaise
        : parseRupeeInput(salaryInput);

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

  const needsSalaryInput = preview != null && preview.baseSalaryPaise <= 0;
  const carryOver = preview?.carryOverPaise ?? 0;
  const salaryPaise =
    preview && preview.baseSalaryPaise > 0 ? preview.baseSalaryPaise : parseRupeeInput(salaryInput);
  const totalPreview = salaryPaise + carryOver;

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
            {preview.baseSalaryPaise > 0 ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">This month&apos;s salary</span>
                <span className="font-medium tabular-nums">{formatINR(preview.baseSalaryPaise)}</span>
              </div>
            ) : (
              <Input
                label="Monthly salary (INR)"
                type="number"
                inputMode="decimal"
                required
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                placeholder="e.g. 50000"
              />
            )}
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
          <Button type="button" variant="ghost" onClick={handleNotYet} disabled={saving}>
            Not yet
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={saving || (needsSalaryInput && salaryPaise <= 0)}>
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
