import { db } from "../client";
import type { Bill, Emi, Investment, Loan, SavingsGoal, Subscription } from "../types";

export async function getActiveSubscriptions(): Promise<Subscription[]> {
  return db.subscriptions.filter((s) => s.isActive).toArray();
}

export async function getSubscriptionsWithRenewal(): Promise<Subscription[]> {
  return db.subscriptions.filter((s) => s.isActive && s.nextRenewalAt != null).toArray();
}

export async function getUnpaidBills(): Promise<Bill[]> {
  return db.bills.where("status").anyOf(["upcoming", "overdue"]).sortBy("dueAt");
}

export async function getActiveEmis(): Promise<Emi[]> {
  return db.emis.filter((e) => e.isActive).toArray();
}

export async function getOpenLoans(): Promise<Loan[]> {
  return db.loans.filter((l) => !l.isDeleted && l.status !== "returned").toArray();
}

export async function getActiveSavingsGoals(): Promise<SavingsGoal[]> {
  return db.savingsGoals.filter((g) => g.isActive).toArray();
}

export async function getAllInvestments(): Promise<Investment[]> {
  return db.investments.toArray();
}
