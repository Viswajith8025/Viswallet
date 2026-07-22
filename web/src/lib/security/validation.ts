import { z } from "zod";
import {
  BACKUP_VERSION,
  MAX_AMOUNT_PAISE,
  MAX_BACKUP_RECORDS,
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_URL_LENGTH,
} from "./constants";

const dateField = z.union([z.string().datetime(), z.coerce.date()]).transform((d) => new Date(d));

const boundedString = (max: number) => z.string().max(max);

const profileSchema = z.object({
  id: z.literal(1),
  displayName: boundedString(MAX_NAME_LENGTH),
  email: boundedString(MAX_EMAIL_LENGTH).optional(),
  avatarUrl: boundedString(MAX_URL_LENGTH).optional(),
  currencyCode: z.string().length(3),
  createdAt: dateField,
  updatedAt: dateField,
});

const settingsSchema = z.object({
  id: z.literal(1),
  themeMode: z.enum(["system", "light", "dark"]),
  accentColor: z.enum(["ocean", "emerald", "violet", "rose", "amber", "slate"]).optional().default("ocean"),
  salaryDay: z.number().int().min(1).max(28),
  majorExpenseThresholdPaise: z.number().int().min(0).max(MAX_AMOUNT_PAISE),
  onboardingComplete: z.boolean(),
  compactMode: z.boolean(),
  appLockEnabled: z.boolean().optional().default(false),
  biometricEnabled: z.boolean().optional().default(false),
  pinHash: z.string().max(512).optional(),
  pinSalt: z.string().max(128).optional(),
  failedPinAttempts: z.number().int().min(0).max(100).optional().default(0),
  pinLockedUntil: dateField.optional(),
  autoLockMinutes: z.number().int().min(1).max(120).optional().default(15),
  dashboardWidgets: z.array(z.string()).max(20).optional(),
  lastBackupAt: dateField.optional(),
  createdAt: dateField,
  updatedAt: dateField,
});

const categorySchema = z.object({
  id: z.number().int().positive().optional(),
  name: boundedString(MAX_NAME_LENGTH),
  slug: z.string().max(48),
  iconName: z.string().max(64),
  color: z.string().max(32),
  isSystem: z.boolean(),
  countsTowardSpending: z.boolean(),
  sortOrder: z.number().int(),
  isDeleted: z.boolean(),
});

const transactionSchema = z.object({
  id: z.number().int().positive().optional(),
  kind: z.enum(["expense", "income"]),
  amountPaise: z.number().int().min(0).max(MAX_AMOUNT_PAISE),
  categoryId: z.number().int().positive(),
  accountId: z.number().int().positive().optional(),
  title: boundedString(MAX_TITLE_LENGTH),
  description: boundedString(MAX_NOTES_LENGTH).optional(),
  occurredAt: dateField,
  monthKey: z.string().max(16),
  paymentMethod: z.string().max(32),
  tags: z.array(z.string().max(40)).max(20),
  notes: boundedString(MAX_NOTES_LENGTH).optional(),
  isRecurring: z.boolean(),
  isDeleted: z.boolean(),
  deletedAt: dateField.optional(),
  rowVersion: z.number().int().min(1).max(1_000_000).optional(),
  createdAt: dateField,
  updatedAt: dateField,
});

const arrayMax = <T extends z.ZodType>(schema: T) =>
  z.array(schema).max(MAX_BACKUP_RECORDS);

export const backupSchema = z.object({
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string().datetime(),
  profiles: arrayMax(profileSchema).optional().default([]),
  settings: arrayMax(settingsSchema).optional().default([]),
  categories: arrayMax(categorySchema).optional().default([]),
  transactions: arrayMax(transactionSchema).optional().default([]),
  expenses: arrayMax(transactionSchema).optional(),
  monthlySalaries: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
  budgetPlans: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
  budgetBuckets: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
  loans: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
  loanPayments: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
  subscriptions: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
  bills: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
  emis: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
  savingsGoals: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
  wishlistItems: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
  investments: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
  notifications: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
  accounts: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
  monthlySnapshots: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
  secureNotes: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
  achievements: z.array(z.record(z.string(), z.unknown())).max(MAX_BACKUP_RECORDS).optional().default([]),
});

export type ValidatedBackup = z.infer<typeof backupSchema>;

export const pinSchema = z
  .string()
  .regex(/^\d{4,8}$/, "PIN must be 4–8 digits");

export const emailSchema = z
  .string()
  .max(MAX_EMAIL_LENGTH)
  .email()
  .optional()
  .or(z.literal(""));

export function parseBackupJson(raw: string): ValidatedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("INVALID_JSON");
  }
  return backupSchema.parse(parsed);
}
