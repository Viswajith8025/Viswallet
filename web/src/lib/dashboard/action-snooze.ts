import { addDays, startOfDay } from "date-fns";

const STORAGE_KEY = "viswallet_action_snoozes";

type SnoozeMap = Record<string, number>;

function readMap(): SnoozeMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SnoozeMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: SnoozeMap): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** Hide a dashboard reminder until tomorrow (start of next day). */
export function snoozeActionItem(actionId: string, days = 1): void {
  const until = startOfDay(addDays(new Date(), days)).getTime();
  const map = readMap();
  const now = Date.now();
  for (const [id, ts] of Object.entries(map)) {
    if (ts <= now) delete map[id];
  }
  map[actionId] = until;
  writeMap(map);
}

export function isActionItemSnoozed(actionId: string): boolean {
  const until = readMap()[actionId];
  return until != null && until > Date.now();
}

export function getActiveSnoozedIds(): string[] {
  const now = Date.now();
  return Object.entries(readMap())
    .filter(([, until]) => until > now)
    .map(([id]) => id);
}
