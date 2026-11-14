"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";
import { format, subDays } from "date-fns";
import { NumberTicker } from "@/components/ui/number-ticker";
import { formatINR, paiseToRupee } from "@/lib/money";
import { formatCycleLabel, getCurrentCycleKey, getPreviousCycleKeys } from "@/lib/salary-cycle";
import { selectCycleKey, useFilterStore } from "@/lib/store/filter-store";
import { cn } from "@/lib/design/cn";
import type { FinanceSnapshot } from "@/lib/engines/finance-snapshot";

const MODE_KEY = "vw-hero-mode";
type HeroMode = "today" | "cycle" | "worth";

const MODES: { id: HeroMode; label: string }[] = [
  { id: "today", label: "SAFE TO SPEND TODAY" },
  { id: "cycle", label: "LEFT THIS CYCLE" },
  { id: "worth", label: "NET WORTH" },
];

const modeListeners = new Set<() => void>();

function readMode(): HeroMode {
  if (typeof window === "undefined") return "today";
  const stored = window.localStorage.getItem(MODE_KEY);
  return stored === "cycle" || stored === "worth" || stored === "today" ? stored : "today";
}

function writeMode(mode: HeroMode) {
  window.localStorage.setItem(MODE_KEY, mode);
  modeListeners.forEach((listener) => listener());
}

function subscribeMode(listener: () => void) {
  modeListeners.add(listener);
  return () => modeListeners.delete(listener);
}

function streakDays(data: FinanceSnapshot): number {
  const dates = new Set(
    data.transactions.map((row) => format(new Date(row.occurredAt), "yyyy-MM-dd")),
  );
  let streak = 0;
  for (let i = 0; i < 30; i += 1) {
    const day = format(subDays(new Date(), i), "yyyy-MM-dd");
    if (!dates.has(day)) break;
    streak += 1;
  }
  return streak;
}

export function HeroBalanceCard({
  data,
  greeting,
}: {
  data: FinanceSnapshot;
  greeting: string;
}) {
  const mode = useSyncExternalStore(subscribeMode, readMode, () => "today" as const);
  const cycleKey = useFilterStore(selectCycleKey);
  const setCycleKey = useFilterStore((s) => s.setCycleKey);
  const currentKey = getCurrentCycleKey(data.salaryDay);
  const options = getPreviousCycleKeys(currentKey, 6);

  function toggleMode() {
    const order: HeroMode[] = ["today", "cycle", "worth"];
    const next = order[(order.indexOf(mode) + 1) % order.length] ?? "today";
    writeMode(next);
  }

  const hasIncome = data.expectedSalaryPaise > 0 || data.salaryPaise > 0 || data.incomePaise > 0;
  const amountPaise =
    mode === "cycle" ? data.remainingPaise : mode === "worth" ? data.netWorthPaise : data.safeSpendDaily;
  const showWords = mode !== "worth" && (!hasIncome || amountPaise <= 0);
  const rupees = Math.round(paiseToRupee(Math.abs(amountPaise)));
  const spent = Math.max(0, data.expensePaise);
  const committed = Math.max(0, data.billsDuePaise + data.emiMonthlyPaise + data.subscriptionMonthlyPaise);
  const free = Math.max(0, data.remainingPaise);
  const total = spent + committed + free;
  const showBar = total > 0;
  const streak = streakDays(data);
  const salarySet = data.expectedSalaryPaise > 0 || data.salaryPaise > 0;
  const loggedExpense = data.transactions.some((row) => row.kind === "expense");
  const invited = data.lentBalance > 0 || data.borrowedBalance > 0;

  return (
    <section className="flex h-full w-full flex-col rounded-[14px] border border-hairline bg-surface p-5 lg:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="font-body text-sm text-ink-2">{greeting}</p>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-hairline px-2 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2">
              <Flame size={12} className="text-marigold" aria-hidden />
              {streak}-day streak
            </span>
          )}
          <label className="sr-only" htmlFor="cycle-chip">
            Salary cycle
          </label>
          <select
            id="cycle-chip"
            value={cycleKey ?? currentKey}
            onChange={(event) => setCycleKey(event.target.value)}
            className="h-8 rounded-full border border-hairline bg-transparent px-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink"
          >
            {options.map((key) => (
              <option key={key} value={key}>
                {formatCycleLabel(key)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleMode}
        className="mt-8 block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime"
        aria-label={`${MODES.find((item) => item.id === mode)?.label}. Tap to switch.`}
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">
          {MODES.find((item) => item.id === mode)?.label}
        </p>
        {showWords ? (
          !hasIncome ? (
            <p className="mt-3 max-w-sm font-body text-lg leading-snug text-ink">
              Set your monthly income to see what is safe to spend.
            </p>
          ) : amountPaise < 0 ? (
            <p className="mt-3 font-body text-2xl text-chili lg:text-3xl">Over by {formatINR(Math.abs(amountPaise))}</p>
          ) : (
            <p className="mt-3 font-body text-2xl text-marigold lg:text-3xl">You&apos;re at your limit for this cycle</p>
          )
        ) : (
          <p className="mt-2 font-mono text-[56px] leading-none text-ink lg:text-[72px]">
            {amountPaise < 0 ? "−" : null}
            <span className="text-ink-2">₹</span>
            <NumberTicker
              value={rupees}
              className="font-mono text-[56px] leading-none tracking-[-0.04em] text-ink lg:text-[72px]"
            />
          </p>
        )}
        {hasIncome && (
          <p className="mt-3 font-mono text-[13px] text-ink-2">
            {formatINR(data.remainingPaise)} left this cycle · {data.daysLeft} days
          </p>
        )}
      </button>

      {showBar ? (
        <div className="mt-auto pt-6">
          <div className="flex h-2 overflow-hidden rounded-full bg-sunken" aria-hidden>
            <span className="h-full bg-chili" style={{ width: `${(spent / total) * 100}%` }} />
            <span className="h-full bg-marigold" style={{ width: `${(committed / total) * 100}%` }} />
            <span className="h-full bg-lime" style={{ width: `${(free / total) * 100}%` }} />
          </div>
          <p className="mt-2 font-mono text-[11px] text-ink-2">
            spent {formatINR(spent)} · committed {formatINR(committed)} · free {formatINR(free)}
          </p>
        </div>
      ) : null}

      {!hasIncome && (
        <div className="mt-6 space-y-3">
          <Link
            href="/salary"
            className="inline-flex h-11 items-center rounded-full bg-lime px-4 font-medium text-[#0D0D0B]"
          >
            Set your monthly income
          </Link>
          <ol className="space-y-2 font-body text-sm text-ink">
            {[
              { done: salarySet, label: "Set your salary", href: "/salary" },
              { done: loggedExpense, label: "Log the first expense", href: "/transactions" },
              { done: invited, label: "Invite a friend", href: "/crew" },
            ].map((step) => (
              <li key={step.label}>
                <Link href={step.href} className="inline-flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[11px]",
                      step.done ? "border-lime bg-lime text-[#0D0D0B]" : "border-hairline text-ink-2",
                    )}
                    aria-hidden
                  >
                    {step.done ? "✓" : ""}
                  </span>
                  <span className={step.done ? "text-ink-2 line-through" : ""}>{step.label}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
