import { describe, expect, it } from "vitest";
import { mergeRecords, transactionSyncKey, type MergeRow } from "@/lib/db/vault-merge";

function expense(partial: MergeRow): MergeRow {
  return {
    kind: "expense",
    amountPaise: 10000,
    title: "Tea",
    isDeleted: false,
    updatedAt: "2026-11-13T08:00:00.000Z",
    ...partial,
  };
}

describe("vault merge", () => {
  it("keeps a local write when an older snapshot arrives", () => {
    const local = [expense({ id: 4, syncId: "local-tea", title: "Tea", updatedAt: "2026-11-13T09:00:00.000Z" })];
    const cloud = [expense({ id: 1, syncId: "old-rent", title: "Rent", updatedAt: "2026-11-01T09:00:00.000Z" })];

    const merged = mergeRecords(local, cloud, transactionSyncKey);
    expect(merged.map((row) => row.syncId).sort()).toEqual(["local-tea", "old-rent"]);
  });

  it("does not resurrect a deleted record from an older snapshot", () => {
    const local = [
      expense({
        id: 4,
        syncId: "tea",
        isDeleted: true,
        updatedAt: "2026-11-13T10:00:00.000Z",
      }),
    ];
    const cloud = [
      expense({
        id: 4,
        syncId: "tea",
        isDeleted: false,
        updatedAt: "2026-11-13T08:00:00.000Z",
      }),
    ];

    const merged = mergeRecords(local, cloud, transactionSyncKey);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.isDeleted).toBe(true);
  });

  it("keeps records added on two devices", () => {
    const deviceA = [expense({ id: 5, syncId: "device-a", title: "Tea" })];
    const deviceB = [expense({ id: 5, syncId: "device-b", title: "Bus" })];

    const merged = mergeRecords(deviceA, deviceB, transactionSyncKey);
    expect(merged.map((row) => row.title).sort()).toEqual(["Bus", "Tea"]);
    expect(new Set(merged.map((row) => row.id)).size).toBe(2);
  });
});
