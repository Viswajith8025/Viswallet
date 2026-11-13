export type MergeRow = {
  id?: number;
  syncId?: string;
  updatedAt?: Date | string;
  createdAt?: Date | string;
  isDeleted?: boolean;
  [key: string]: unknown;
};

function stamp(row: MergeRow): number {
  const raw = row.updatedAt ?? row.createdAt;
  if (!raw) return 0;
  const time = new Date(raw).getTime();
  return Number.isNaN(time) ? 0 : time;
}

/** Local wins a tie so a write that shares a timestamp is not dropped. */
function prefer<T extends MergeRow>(local: T, incoming: T): T {
  return stamp(local) >= stamp(incoming) ? local : incoming;
}

export function transactionSyncKey(row: MergeRow): string {
  if (typeof row.syncId === "string" && row.syncId.length > 0) return `sync:${row.syncId}`;
  if (row.id != null) return `id:${row.id}`;
  return `anon:${String(row.title)}:${String(row.amountPaise)}:${String(row.occurredAt)}`;
}

export function idSyncKey(row: MergeRow): string {
  if (typeof row.syncId === "string" && row.syncId.length > 0) return `sync:${row.syncId}`;
  if (row.id != null) return `id:${row.id}`;
  return `anon:${JSON.stringify(row)}`;
}

export function fieldSyncKey(field: string) {
  return (row: MergeRow): string => {
    const value = row[field];
    if (typeof value === "string" && value.length > 0) return `${field}:${value}`;
    return idSyncKey(row);
  };
}

/**
 * Union of local and incoming. Newest updatedAt wins.
 * A newer local tombstone (isDeleted) is kept, so an older snapshot cannot resurrect it.
 * A local row the snapshot does not contain is kept.
 */
export function mergeRecords<T extends MergeRow>(
  local: T[],
  incoming: T[],
  keyOf: (row: T) => string,
): T[] {
  const localByKey = new Map<string, T>();
  const incomingByKey = new Map<string, T>();
  for (const row of local) localByKey.set(keyOf(row), row);
  for (const row of incoming) incomingByKey.set(keyOf(row), row);

  const keys = new Set<string>([...localByKey.keys(), ...incomingByKey.keys()]);
  const merged: T[] = [];
  for (const key of keys) {
    const left = localByKey.get(key);
    const right = incomingByKey.get(key);
    if (left && right) merged.push(prefer(left, right));
    else if (left) merged.push(left);
    else if (right) merged.push(right);
  }
  return assignPrimaryKeys(merged);
}

/** Two different records must not share a Dexie primary key. Local rows are listed first. */
export function assignPrimaryKeys<T extends MergeRow>(rows: T[]): T[] {
  const used = new Set<number>();
  const out: T[] = [];
  for (const row of rows) {
    if (row.id == null) {
      out.push(row);
      continue;
    }
    if (used.has(row.id)) {
      const copy = { ...row };
      delete copy.id;
      out.push(copy);
      continue;
    }
    used.add(row.id);
    out.push(row);
  }
  return out;
}
