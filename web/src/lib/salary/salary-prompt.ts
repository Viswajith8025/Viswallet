export const SALARY_SNOOZE_KEY = "vw_salary_snooze";

export type SalarySnooze = {
  cycleKey: string;
  date: string;
  skipCycle?: boolean;
};

/** A cloud vault must not clear a local "not yet" or "not this cycle". */
export function mergeSalaryPromptDate(local?: string, incoming?: string): string | undefined {
  if (local && incoming) return local > incoming ? local : incoming;
  return local ?? incoming;
}

export function isSalarySnoozed(snooze: SalarySnooze | null, cycleKey: string, today: string): boolean {
  if (!snooze) return false;
  if (snooze.skipCycle && snooze.cycleKey === cycleKey) return true;
  return snooze.date === today;
}

export function expectedSalaryPaise(settings: { expectedSalaryPaise?: number } | null | undefined): number {
  const value = settings?.expectedSalaryPaise ?? 0;
  return value > 0 ? value : 0;
}

const memoryStore = new Map<string, string>();

function readRaw(key: string): string | null {
  if (typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  }
  return memoryStore.get(key) ?? null;
}

function writeRaw(key: string, value: string): void {
  memoryStore.set(key, value);
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode — the in-memory copy still covers this session.
  }
}

export function readSalarySnooze(): SalarySnooze | null {
  const raw = readRaw(SALARY_SNOOZE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SalarySnooze;
    if (!parsed || typeof parsed.cycleKey !== "string" || typeof parsed.date !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSalarySnooze(snooze: SalarySnooze): void {
  writeRaw(SALARY_SNOOZE_KEY, JSON.stringify(snooze));
}
