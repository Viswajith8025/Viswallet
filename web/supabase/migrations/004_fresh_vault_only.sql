-- =============================================================================
-- Viswallet — Fresh start: drop legacy per-table sync, keep vault-only cloud backup
-- =============================================================================
-- Run once in Supabase → SQL Editor.
--
-- The web app stores ALL finance data in IndexedDB on the device. Cloud sync uses
-- ONE table (user_data_vaults) — a JSON backup per signed-in user.
--
-- This script:
--   • Drops 22 legacy tables from supabase/setup.sql (NOT used by the app)
--   • Recreates user_data_vaults with RLS
--
-- Does NOT delete auth.users — your login accounts remain.
-- WARNING: Deletes all cloud backup JSON. Devices will re-push on next app use.
-- =============================================================================

-- Drop legacy tables (order + CASCADE handles foreign keys)
DROP TABLE IF EXISTS
  public.transaction_attachments,
  public.transactions,
  public.loan_payments,
  public.loans,
  public.budget_buckets,
  public.budget_plans,
  public.monthly_salaries,
  public.emis,
  public.bills,
  public.subscriptions,
  public.savings_goals,
  public.wishlist_items,
  public.investments,
  public.notifications,
  public.secure_notes,
  public.achievements,
  public.monthly_snapshots,
  public.audit_logs,
  public.categories,
  public.accounts,
  public.app_settings,
  public.profiles,
  public.user_data_vaults
CASCADE;

-- Note: Old receipt bucket "transaction-attachments" (from setup.sql) is unused by the app.
-- Delete it manually in Supabase → Storage if you want — SQL cannot delete storage.objects.

-- ─── The only table the app reads/writes for cloud sync ─────────────────────
CREATE TABLE public.user_data_vaults (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  backup_version INTEGER NOT NULL DEFAULT 3 CHECK (backup_version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_data_vaults ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_data_vaults_select ON public.user_data_vaults;
DROP POLICY IF EXISTS user_data_vaults_insert ON public.user_data_vaults;
DROP POLICY IF EXISTS user_data_vaults_update ON public.user_data_vaults;
DROP POLICY IF EXISTS user_data_vaults_delete ON public.user_data_vaults;

CREATE POLICY user_data_vaults_select ON public.user_data_vaults
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_data_vaults_insert ON public.user_data_vaults
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_data_vaults_update ON public.user_data_vaults
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_data_vaults_delete ON public.user_data_vaults
  FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON public.user_data_vaults TO authenticated;
