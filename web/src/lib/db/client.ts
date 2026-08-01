import Dexie, { type EntityTable } from "dexie";
import { DEFAULT_CATEGORIES } from "@/lib/categories-default";
import { getCurrentCycleKey } from "@/lib/salary-cycle";
import type {
  Account,
  Achievement,
  AppNotification,
  AppSettings,
  AuditLog,
  Bill,
  BudgetBucket,
  BudgetPlan,
  Category,
  Emi,
  Investment,
  Loan,
  LoanPayment,
  MonthlySalary,
  MonthlySnapshot,
  Profile,
  SavingsGoal,
  SecureNote,
  Subscription,
  Transaction,
  TransactionAttachment,
  WishlistItem,
} from "./types";
import {
  ACHIEVEMENT_DEFINITIONS,
  DEFAULT_BUDGET_BUCKETS,
  DEFAULT_DASHBOARD_WIDGETS,
} from "./types";
import {
  assertExportRateLimit,
  assertImportRateLimit,
  BACKUP_VERSION,
  logAudit,
  registerAuditDb,
  sanitizeName,
  sanitizeNotes,
  sanitizeTitle,
  SecureError,
  stripSensitiveSettings,
  validateBackupPayload,
} from "@/lib/security";
import {
  getCycleTransactions as repoGetCycleTransactions,
  getActiveTransactions,
  countActiveTransactions,
} from "./repositories/transactions";
import { getActiveCategories as repoGetActiveCategories } from "./repositories/categories";
import { emitNotificationsChanged, emitDbDataChanged } from "@/lib/notifications/bus";
import {
  clearSettingsCache,
  readSettingsCache,
  rememberSettings,
  writeBootCache,
} from "./settings-cache";

class ViswalletDB extends Dexie {
  profiles!: EntityTable<Profile, "id">;
  settings!: EntityTable<AppSettings, "id">;
  categories!: EntityTable<Category, "id">;
  transactions!: EntityTable<Transaction, "id">;
  monthlySalaries!: EntityTable<MonthlySalary, "id">;
  budgetPlans!: EntityTable<BudgetPlan, "id">;
  budgetBuckets!: EntityTable<BudgetBucket, "id">;
  loans!: EntityTable<Loan, "id">;
  loanPayments!: EntityTable<LoanPayment, "id">;
  subscriptions!: EntityTable<Subscription, "id">;
  bills!: EntityTable<Bill, "id">;
  emis!: EntityTable<Emi, "id">;
  savingsGoals!: EntityTable<SavingsGoal, "id">;
  wishlistItems!: EntityTable<WishlistItem, "id">;
  investments!: EntityTable<Investment, "id">;
  notifications!: EntityTable<AppNotification, "id">;
  auditLogs!: EntityTable<AuditLog, "id">;
  accounts!: EntityTable<Account, "id">;
  monthlySnapshots!: EntityTable<MonthlySnapshot, "id">;
  secureNotes!: EntityTable<SecureNote, "id">;
  transactionAttachments!: EntityTable<TransactionAttachment, "id">;
  achievements!: EntityTable<Achievement, "id">;

  constructor() {
    super("viswallet");

    this.version(1).stores({
      settings: "id",
      categories: "++id, slug, sortOrder, isDeleted",
      expenses: "++id, monthKey, categoryId, occurredAt, isDeleted",
      monthlySalaries: "++id, monthKey",
      budgetPlans: "++id, monthKey",
      budgetBuckets: "++id, planId, bucketKey",
      loans: "++id, direction, isDeleted, status",
      loanPayments: "++id, loanId",
      subscriptions: "++id, isActive",
      savingsGoals: "++id, isActive",
    });

    this.version(2)
      .stores({
        profiles: "id",
        settings: "id",
        categories: "++id, slug, sortOrder, isDeleted",
        transactions: "++id, monthKey, kind, categoryId, occurredAt, isDeleted, *tags",
        monthlySalaries: "++id, monthKey",
        budgetPlans: "++id, monthKey",
        budgetBuckets: "++id, planId, bucketKey",
        loans: "++id, direction, isDeleted, status",
        loanPayments: "++id, loanId",
        subscriptions: "++id, isActive",
        bills: "++id, dueAt, status",
        emis: "++id, isActive, nextDueAt",
        savingsGoals: "++id, isActive",
        wishlistItems: "++id, isPurchased",
        investments: "++id, type",
        notifications: "++id, read, createdAt",
      })
      .upgrade(async (tx) => {
        const legacyExpenses = await tx.table("expenses").toArray();
        if (legacyExpenses.length > 0) {
          await tx.table("transactions").bulkAdd(
            legacyExpenses.map((e: Record<string, unknown>) => ({
              kind: "expense" as const,
              amountPaise: e.amountPaise as number,
              categoryId: e.categoryId as number,
              title: e.title as string,
              description: e.description as string | undefined,
              occurredAt: new Date(e.occurredAt as string | Date),
              monthKey: e.monthKey as string,
              paymentMethod: (e.paymentMethod as string) ?? "UPI",
              tags: (e.tags as string[]) ?? [],
              notes: e.notes as string | undefined,
              isRecurring: false,
              isDeleted: Boolean(e.isDeleted),
              deletedAt: e.deletedAt ? new Date(e.deletedAt as string | Date) : undefined,
              createdAt: new Date(e.createdAt as string | Date),
              updatedAt: new Date(e.updatedAt as string | Date),
            })),
          );
        }
        const settings = await tx.table("settings").get(1);
        if (settings && !settings.compactMode) {
          await tx.table("settings").update(1, { compactMode: false });
        }
      });

    this.version(3)
      .stores({
        profiles: "id",
        settings: "id",
        categories: "++id, slug, sortOrder, isDeleted",
        transactions: "++id, monthKey, kind, categoryId, occurredAt, isDeleted, *tags",
        monthlySalaries: "++id, monthKey",
        budgetPlans: "++id, monthKey",
        budgetBuckets: "++id, planId, bucketKey",
        loans: "++id, direction, isDeleted, status",
        loanPayments: "++id, loanId",
        subscriptions: "++id, isActive",
        bills: "++id, dueAt, status",
        emis: "++id, isActive, nextDueAt",
        savingsGoals: "++id, isActive",
        wishlistItems: "++id, isPurchased",
        investments: "++id, type",
        notifications: "++id, read, createdAt",
        auditLogs: "++id, action, createdAt, success",
      })
      .upgrade(async (tx) => {
        const settings = await tx.table("settings").get(1);
        if (settings) {
          await tx.table("settings").update(1, {
            appLockEnabled: false,
            failedPinAttempts: 0,
            autoLockMinutes: 15,
          });
        }
      });

    this.version(4)
      .stores({
        profiles: "id",
        settings: "id",
        categories: "++id, slug, sortOrder, isDeleted",
        transactions: "++id, monthKey, kind, categoryId, accountId, occurredAt, isDeleted, *tags",
        monthlySalaries: "++id, monthKey",
        budgetPlans: "++id, monthKey",
        budgetBuckets: "++id, planId, bucketKey",
        loans: "++id, direction, isDeleted, status",
        loanPayments: "++id, loanId",
        subscriptions: "++id, isActive",
        bills: "++id, dueAt, status",
        emis: "++id, isActive, nextDueAt",
        savingsGoals: "++id, isActive",
        wishlistItems: "++id, isPurchased",
        investments: "++id, type",
        notifications: "++id, read, createdAt",
        auditLogs: "++id, action, createdAt, success",
        accounts: "++id, isDefault, isActive",
        monthlySnapshots: "++id, monthKey",
        secureNotes: "++id, updatedAt",
        transactionAttachments: "++id, transactionId",
        achievements: "++id, achievementKey, unlockedAt",
      })
      .upgrade(async (tx) => {
        const settings = await tx.table("settings").get(1);
        if (settings) {
          await tx.table("settings").update(1, {
            accentColor: "violet",
            biometricEnabled: false,
            dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,
          });
        }
        const accountCount = await tx.table("accounts").count();
        if (accountCount === 0) {
          const now = new Date();
          await tx.table("accounts").add({
            name: "Primary Wallet",
            type: "wallet",
            balancePaise: 0,
            color: "#5f4a8b",
            iconName: "Wallet",
            isDefault: true,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
        }
        const achievementCount = await tx.table("achievements").count();
        if (achievementCount === 0) {
          await tx.table("achievements").bulkAdd(
            ACHIEVEMENT_DEFINITIONS.map((a) => ({
              achievementKey: a.key,
              title: a.title,
              description: a.description,
              iconName: a.iconName,
              progress: 0,
              target: a.target,
            })),
          );
        }
      });

    this.version(5)
      .stores({
        profiles: "id",
        settings: "id",
        categories: "++id, &slug, [isDeleted+sortOrder], sortOrder, isDeleted",
        transactions:
          "++id, monthKey, isDeleted, kind, [monthKey+isDeleted], [isDeleted+occurredAt], [isDeleted+kind], categoryId, accountId, occurredAt, *tags",
        monthlySalaries: "++id, &monthKey",
        budgetPlans: "++id, &monthKey",
        budgetBuckets: "++id, planId, bucketKey, [planId+bucketKey]",
        loans: "++id, [isDeleted+status], direction, isDeleted, status",
        loanPayments: "++id, loanId, [loanId+paidAt]",
        subscriptions: "++id, isActive, [isActive+nextRenewalAt]",
        bills: "++id, status, [status+dueAt], dueAt",
        emis: "++id, isActive, [isActive+nextDueAt]",
        savingsGoals: "++id, isActive",
        wishlistItems: "++id, isPurchased",
        investments: "++id, type",
        notifications: "++id, [read+createdAt], read, createdAt",
        auditLogs: "++id, action, createdAt, [createdAt+success]",
        accounts: "++id, isDefault, isActive",
        monthlySnapshots: "++id, &monthKey",
        secureNotes: "++id, updatedAt",
        transactionAttachments: "++id, transactionId",
        achievements: "++id, &achievementKey, unlockedAt",
      })
      .upgrade(async (tx) => {
        const txnTable = tx.table("transactions");
        const txns = await txnTable.toArray();
        for (const t of txns) {
          if (t.id != null && t.rowVersion == null) {
            await txnTable.update(t.id, { rowVersion: 1 });
          }
        }
        const catTable = tx.table("categories");
        const cats = await catTable.toArray();
        for (const c of cats) {
          if (c.id != null && c.rowVersion == null) {
            await catTable.update(c.id, { rowVersion: 1 });
          }
        }
      });
  }
}

export const db = new ViswalletDB();
registerAuditDb(db);

let seedPromise: Promise<void> | null = null;

async function syncDefaultCategories(): Promise<void> {
  const existing = await db.categories.toArray();
  const bySlug = new Map(existing.map((c) => [c.slug, c]));
  const maxOrder = existing.reduce((m, c) => Math.max(m, c.sortOrder), 0);

  const toAdd = DEFAULT_CATEGORIES.filter((seed) => !bySlug.has(seed.slug));
  if (toAdd.length > 0) {
    await db.categories.bulkAdd(
      toAdd.map((c, i) => ({
        name: c.name,
        slug: c.slug,
        iconName: c.iconName,
        color: c.color,
        isSystem: true,
        countsTowardSpending: c.countsTowardSpending,
        sortOrder: c.sortOrder ?? maxOrder + i + 1,
        isDeleted: false,
      })),
    );
  }

  for (const seed of DEFAULT_CATEGORIES) {
    const row = bySlug.get(seed.slug);
    if (!row?.id || !row.isSystem) continue;
    await db.categories.update(row.id, {
      name: seed.name,
      iconName: seed.iconName,
      color: seed.color,
      countsTowardSpending: seed.countsTowardSpending,
      sortOrder: seed.sortOrder,
    });
  }
}

export async function ensureDbSeeded(): Promise<void> {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const now = new Date();

    const profile = await db.profiles.get(1);
    if (!profile) {
      await db.profiles.put({
        id: 1,
        displayName: "You",
        currencyCode: "INR",
        createdAt: now,
        updatedAt: now,
      });
    }

    const settings = await db.settings.get(1);
    if (!settings) {
      await db.settings.put({
        id: 1,
        themeMode: "system",
        accentColor: "violet",
        salaryDay: 1,
        majorExpenseThresholdPaise: 50000,
        onboardingComplete: false,
        compactMode: false,
        appLockEnabled: false,
        biometricEnabled: false,
        failedPinAttempts: 0,
        autoLockMinutes: 15,
        dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,
        aiFeaturesEnabled: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    const accountCount = await db.accounts.count();
    if (accountCount === 0) {
      await db.accounts.add({
        name: "Primary Wallet",
        type: "wallet",
        balancePaise: 0,
        color: "#5f4a8b",
        iconName: "Wallet",
        isDefault: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    const achievementCount = await db.achievements.count();
    if (achievementCount === 0) {
      await db.achievements.bulkAdd(
        ACHIEVEMENT_DEFINITIONS.map((a) => ({
          achievementKey: a.key,
          title: a.title,
          description: a.description,
          iconName: a.iconName,
          progress: 0,
          target: a.target,
        })),
      );
    }

    const categoryCount = await db.categories.count();
    if (categoryCount === 0) {
      await db.categories.bulkAdd(
        DEFAULT_CATEGORIES.map((c) => ({
          name: c.name,
          slug: c.slug,
          iconName: c.iconName,
          color: c.color,
          isSystem: true,
          countsTowardSpending: c.countsTowardSpending,
          sortOrder: c.sortOrder,
          isDeleted: false,
        })),
      );
    } else {
      await syncDefaultCategories();
    }

    const latestSettings = await db.settings.get(1);
    if (latestSettings) writeBootCache(latestSettings);
  })();
  return seedPromise;
}

/** Wipe local finance data and re-seed defaults (e.g. on sign-out or account switch). */
export async function resetLocalDatabase(): Promise<void> {
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) {
      if (table.name === "auditLogs") continue;
      await table.clear();
    }
  });
  seedPromise = null;
  await ensureDbSeeded();
  clearSettingsCache();
  emitNotificationsChanged();
  emitDbDataChanged();
}

export async function getSettings(): Promise<AppSettings> {
  const cached = readSettingsCache();
  if (cached) return cached;

  await ensureDbSeeded();
  const s = await db.settings.get(1);
  if (!s) throw new Error("Settings not initialized");
  return rememberSettings(s);
}

export async function getProfile(): Promise<Profile> {
  await ensureDbSeeded();
  const p = await db.profiles.get(1);
  if (!p) throw new Error("Profile not initialized");
  return p;
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  const next = { ...current, ...partial, updatedAt: new Date() };
  await db.settings.update(1, next);
  rememberSettings(next);
  emitDbDataChanged();
}

export async function updateProfile(partial: Partial<Profile>): Promise<void> {
  await db.profiles.update(1, { ...partial, updatedAt: new Date() });
  emitDbDataChanged();
}

export async function completeOnboarding(
  displayName: string,
  salaryDay: number,
  salaryPaise: number,
): Promise<void> {
  const now = new Date();
  const monthKey = getCurrentCycleKey(salaryDay);
  await updateProfile({ displayName: sanitizeName(displayName) });
  await updateSettings({ salaryDay, onboardingComplete: true });

  const existingSalary = await db.monthlySalaries.where("monthKey").equals(monthKey).first();
  const salaryPayload = {
    monthKey,
    amountPaise: salaryPaise,
    receivedAt: now,
    updatedAt: now,
  };
  if (existingSalary?.id) {
    await db.monthlySalaries.update(existingSalary.id, salaryPayload);
  } else {
    try {
      await db.monthlySalaries.add({ ...salaryPayload, createdAt: now });
    } catch {
      const retry = await db.monthlySalaries.where("monthKey").equals(monthKey).first();
      if (retry?.id) await db.monthlySalaries.update(retry.id, salaryPayload);
      else throw new Error("Failed to save salary for this cycle.");
    }
  }

  await createBudgetPlanForCycle(monthKey, salaryPaise);
  await logAudit("onboarding.complete", { success: true });
  emitDbDataChanged();
}

export async function createBudgetPlanForCycle(monthKey: string, salaryPaise: number): Promise<number> {
  const existing = await db.budgetPlans.where("monthKey").equals(monthKey).first();
  if (existing?.id) return existing.id;

  const now = new Date();
  let planId: number;
  try {
    planId = (await db.budgetPlans.add({
      monthKey,
      salaryPaise,
      allocationMode: "percentage",
      rolloverEnabled: true,
      createdAt: now,
      updatedAt: now,
    })) as number;
  } catch {
    const retry = await db.budgetPlans.where("monthKey").equals(monthKey).first();
    if (retry?.id) return retry.id;
    throw new Error("Failed to create budget plan for this cycle.");
  }

  const categories = await db.categories.toArray();
  const slugToId = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  await db.budgetBuckets.bulkAdd(
    DEFAULT_BUDGET_BUCKETS.map((b, i) => ({
      planId,
      bucketKey: b.bucketKey,
      displayName: b.displayName,
      categoryId: slugToId[b.bucketKey] ?? slugToId.misc,
      bucketType: b.bucketType,
      allocatedPaise: Math.round((salaryPaise * b.percent) / 100),
      allocatedPercent: b.percent,
      rolloverPaise: 0,
      sortOrder: i,
    })),
  );

  return planId;
}

export async function getActiveCategories(): Promise<Category[]> {
  await ensureDbSeeded();
  return repoGetActiveCategories();
}

export async function getCycleTransactions(monthKey: string): Promise<Transaction[]> {
  return repoGetCycleTransactions(monthKey);
}

export { getActiveTransactions, countActiveTransactions };

export async function getCycleSalary(monthKey: string): Promise<MonthlySalary | undefined> {
  return db.monthlySalaries.where("monthKey").equals(monthKey).first();
}

export async function pushNotification(
  n: Omit<AppNotification, "id" | "read" | "createdAt">,
): Promise<number> {
  const id = (await db.notifications.add({ ...n, read: false, createdAt: new Date() })) as number;
  emitNotificationsChanged();
  return id;
}

export async function exportAllDataForSync(): Promise<string> {
  const data = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    profiles: await db.profiles.toArray(),
    settings: stripSensitiveSettings(await db.settings.toArray()),
    categories: await db.categories.toArray(),
    transactions: await db.transactions.toArray(),
    monthlySalaries: await db.monthlySalaries.toArray(),
    budgetPlans: await db.budgetPlans.toArray(),
    budgetBuckets: await db.budgetBuckets.toArray(),
    loans: await db.loans.toArray(),
    loanPayments: await db.loanPayments.toArray(),
    subscriptions: await db.subscriptions.toArray(),
    bills: await db.bills.toArray(),
    emis: await db.emis.toArray(),
    savingsGoals: await db.savingsGoals.toArray(),
    wishlistItems: await db.wishlistItems.toArray(),
    investments: await db.investments.toArray(),
    notifications: await db.notifications.toArray(),
    accounts: await db.accounts.toArray(),
    monthlySnapshots: await db.monthlySnapshots.toArray(),
    secureNotes: await db.secureNotes.toArray(),
    achievements: await db.achievements.toArray(),
  };
  return JSON.stringify(data);
}

export async function exportAllData(): Promise<string> {
  assertExportRateLimit();
  const json = await exportAllDataForSync();
  await logAudit("backup.export", { success: true });
  return json;
}

export async function importAllData(json: string, options: { skipRateLimit?: boolean } = {}): Promise<void> {
  if (!options.skipRateLimit) assertImportRateLimit();
  const validated = validateBackupPayload(json);

  const transactions =
    validated.transactions.length > 0
      ? validated.transactions.map((t) => ({
          ...t,
          title: sanitizeTitle(t.title),
          notes: sanitizeNotes(t.notes as string | undefined),
        }))
      : (validated.expenses ?? []).map((t) => ({
          ...t,
          kind: t.kind ?? ("expense" as const),
          title: sanitizeTitle(t.title),
          notes: sanitizeNotes(t.notes as string | undefined),
        }));

  try {
    await db.transaction("rw", db.tables, async () => {
      for (const table of db.tables) {
        if (table.name === "auditLogs") continue;
        await table.clear();
      }
      if (validated.profiles.length) await db.profiles.bulkAdd(validated.profiles);
      if (validated.settings.length)
        await db.settings.bulkAdd(
          stripSensitiveSettings(
            validated.settings.map((s) => ({
              ...s,
              accentColor: s.accentColor ?? "violet",
              biometricEnabled: s.biometricEnabled ?? false,
              dashboardWidgets: (s.dashboardWidgets ?? DEFAULT_DASHBOARD_WIDGETS) as AppSettings["dashboardWidgets"],
            })),
          ) as AppSettings[],
        );
      if (validated.categories.length) await db.categories.bulkAdd(validated.categories);
      if (transactions.length) await db.transactions.bulkAdd(transactions);
      if (validated.monthlySalaries.length)
        await db.monthlySalaries.bulkAdd(validated.monthlySalaries as unknown as MonthlySalary[]);
      if (validated.budgetPlans.length)
        await db.budgetPlans.bulkAdd(validated.budgetPlans as unknown as BudgetPlan[]);
      if (validated.budgetBuckets.length)
        await db.budgetBuckets.bulkAdd(validated.budgetBuckets as unknown as BudgetBucket[]);
      if (validated.loans.length) await db.loans.bulkAdd(validated.loans as unknown as Loan[]);
      if (validated.loanPayments.length)
        await db.loanPayments.bulkAdd(validated.loanPayments as unknown as LoanPayment[]);
      if (validated.subscriptions.length)
        await db.subscriptions.bulkAdd(validated.subscriptions as unknown as Subscription[]);
      if (validated.bills.length) await db.bills.bulkAdd(validated.bills as unknown as Bill[]);
      if (validated.emis.length) await db.emis.bulkAdd(validated.emis as unknown as Emi[]);
      if (validated.savingsGoals.length)
        await db.savingsGoals.bulkAdd(validated.savingsGoals as unknown as SavingsGoal[]);
      if (validated.wishlistItems.length)
        await db.wishlistItems.bulkAdd(validated.wishlistItems as unknown as WishlistItem[]);
      if (validated.investments.length)
        await db.investments.bulkAdd(validated.investments as unknown as Investment[]);
      if (validated.notifications.length)
        await db.notifications.bulkAdd(validated.notifications as unknown as AppNotification[]);
      if (validated.accounts?.length)
        await db.accounts.bulkAdd(validated.accounts as unknown as Account[]);
      if (validated.monthlySnapshots?.length)
        await db.monthlySnapshots.bulkAdd(validated.monthlySnapshots as unknown as MonthlySnapshot[]);
      if (validated.secureNotes?.length)
        await db.secureNotes.bulkAdd(validated.secureNotes as unknown as SecureNote[]);
      if (validated.achievements?.length)
        await db.achievements.bulkAdd(validated.achievements as unknown as Achievement[]);
    });
    seedPromise = null;
    clearSettingsCache();
    await ensureDbSeeded();
    const importedSettings = await db.settings.get(1);
    if (importedSettings) rememberSettings(importedSettings);
    await logAudit("backup.import", { success: true });
    emitDbDataChanged();
  } catch {
    await logAudit("backup.import_failed", { success: false });
    throw new SecureError("IMPORT_FAILED");
  }
}

export { peekBootCache, writeBootCache, clearSettingsCache, readSettingsCache } from "./settings-cache";
export * from "./types";
