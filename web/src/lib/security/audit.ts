import type { AuditLog } from "@/lib/db/types";

type AuditDb = {
  auditLogs: {
    add: (entry: Omit<AuditLog, "id">) => Promise<number | undefined>;
    orderBy: (field: keyof AuditLog) => {
      reverse: () => { limit: (n: number) => { toArray: () => Promise<AuditLog[]> } };
    };
    where: (field: keyof AuditLog) => {
      below: (date: Date) => { limit: (n: number) => { primaryKeys: () => Promise<Array<number | undefined>> } };
    };
    count: () => Promise<number>;
    bulkDelete: (keys: Array<number | undefined>) => Promise<void>;
  };
};

let auditDb: AuditDb | null = null;

export function registerAuditDb(db: AuditDb): void {
  auditDb = db;
}

export type AuditAction =
  | "app.unlock"
  | "app.lock"
  | "app.pin_set"
  | "app.pin_disabled"
  | "app.pin_failed"
  | "backup.export"
  | "backup.export_encrypted"
  | "backup.import"
  | "backup.import_failed"
  | "data.reset"
  | "onboarding.complete"
  | "settings.update";

export async function logAudit(
  action: AuditAction,
  options: { success: boolean; detail?: string; entityType?: string; entityId?: number } = {
    success: true,
  },
): Promise<void> {
  if (!auditDb) return;
  try {
    await auditDb.auditLogs.add({
      action,
      detail: options.detail?.slice(0, 500),
      entityType: options.entityType,
      entityId: options.entityId,
      success: options.success,
      createdAt: new Date(),
    });
    const count = await auditDb.auditLogs.count();
    if (count > 5_000) {
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const stale = await auditDb.auditLogs
        .where("createdAt")
        .below(cutoff)
        .limit(500)
        .primaryKeys();
      if (stale.length > 0) {
        await auditDb.auditLogs.bulkDelete(stale);
      }
    }
  } catch {
    /* Audit failure must not break app flow */
  }
}

export async function getRecentAuditLogs(limit = 50): Promise<AuditLog[]> {
  if (!auditDb) return [];
  return auditDb.auditLogs.orderBy("createdAt").reverse().limit(limit).toArray();
}
