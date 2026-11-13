import { describe, expect, it } from "vitest";
import { selectMaxAmount, selectMinAmount, transactionMatchesAmount } from "@/lib/store/filter-store";
import {
  expectedSalaryPaise,
  isSalarySnoozed,
  mergeSalaryPromptDate,
  type SalarySnooze,
} from "@/lib/salary/salary-prompt";
import { unreadNotificationCount } from "@/hooks/use-notifications";
import { shouldRenderNetWorthTrend } from "@/lib/engines/premium/snapshot-recorder";
import { shouldShowAiEntry } from "@/lib/ai/client";

describe("search amount filters", () => {
  const state = {
    minAmountPaise: 10000,
    maxAmountPaise: 50000,
  };

  it("reads min and max as primitives so a selector does not allocate", () => {
    expect(selectMinAmount(state as never)).toBe(10000);
    expect(selectMaxAmount(state as never)).toBe(50000);
    expect(selectMinAmount(state as never)).toBe(selectMinAmount(state as never));
  });

  it("keeps amounts inside an inclusive min and max", () => {
    expect(transactionMatchesAmount(10000, 10000, 50000)).toBe(true);
    expect(transactionMatchesAmount(9999, 10000, 50000)).toBe(false);
    expect(transactionMatchesAmount(50001, 10000, 50000)).toBe(false);
    expect(transactionMatchesAmount(25000, null, null)).toBe(true);
  });
});

describe("salary prompt", () => {
  it("uses the saved expected salary, not a stale past cycle", () => {
    expect(expectedSalaryPaise({ expectedSalaryPaise: 2_000_000 })).toBe(2_000_000);
    expect(expectedSalaryPaise({ expectedSalaryPaise: 0 })).toBe(0);
    expect(expectedSalaryPaise(undefined)).toBe(0);
  });

  it("snoozes until the next calendar day and for the rest of a cycle", () => {
    const day: SalarySnooze = { cycleKey: "2026-11", date: "2026-11-13" };
    expect(isSalarySnoozed(day, "2026-11", "2026-11-13")).toBe(true);
    expect(isSalarySnoozed(day, "2026-11", "2026-11-14")).toBe(false);

    const cycle: SalarySnooze = { cycleKey: "2026-11", date: "2026-11-13", skipCycle: true };
    expect(isSalarySnoozed(cycle, "2026-11", "2026-11-20")).toBe(true);
    expect(isSalarySnoozed(cycle, "2026-12", "2026-12-01")).toBe(false);
  });

  it("keeps the later local prompt date when a vault is imported", () => {
    expect(mergeSalaryPromptDate("2026-11-13", undefined)).toBe("2026-11-13");
    expect(mergeSalaryPromptDate("2026-11-13", "2026-11-01")).toBe("2026-11-13");
    expect(mergeSalaryPromptDate(undefined, "2026-11-01")).toBe("2026-11-01");
  });
});

describe("notification unread count", () => {
  it("counts the same rows the list shows as unread", () => {
    const rows = [{ read: false }, { read: true }, { read: undefined }];
    expect(unreadNotificationCount(rows)).toBe(2);
    expect(unreadNotificationCount(rows.filter((row) => row.read !== true))).toBe(2);
  });
});

describe("net worth trend", () => {
  it("stays empty until two snapshots exist", () => {
    expect(shouldRenderNetWorthTrend(0)).toBe(false);
    expect(shouldRenderNetWorthTrend(1)).toBe(false);
    expect(shouldRenderNetWorthTrend(2)).toBe(true);
  });
});

describe("AI entry points", () => {
  it("hides AI when Groq is not configured", () => {
    expect(shouldShowAiEntry(null)).toBe(false);
    expect(shouldShowAiEntry({ groq: false })).toBe(false);
    expect(shouldShowAiEntry({ groq: true })).toBe(true);
  });
});
