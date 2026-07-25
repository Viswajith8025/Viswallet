-- =============================================================================
-- Viswallet — Complete Supabase Setup (run once in SQL Editor)
-- =============================================================================
-- Creates every table, index, trigger, RLS policy, and storage bucket needed
-- for optional cloud sync. The web app works offline-first via IndexedDB;
-- Supabase is the secure multi-device backup/sync layer when enabled.
--
-- How to run:
--   1. Open your Supabase project → SQL Editor → New query
--   2. Paste this entire file and click Run
--   3. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
--
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS where possible.
-- =============================================================================

-- ─── Extensions ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Helpers ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_updated_at_trigger(table_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', table_name, table_name);
  EXECUTE format(
    'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
    table_name,
    table_name
  );
END;
$$;

-- ─── Core user tables ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 120),
  email TEXT CHECK (email IS NULL OR char_length(email) <= 254),
  avatar_url TEXT CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 2048),
  currency_code CHAR(3) NOT NULL DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_mode TEXT NOT NULL DEFAULT 'system' CHECK (theme_mode IN ('system', 'light', 'dark')),
  accent_color TEXT NOT NULL DEFAULT 'violet' CHECK (accent_color IN ('ocean', 'emerald', 'violet', 'rose', 'amber', 'slate')),
  salary_day SMALLINT NOT NULL DEFAULT 1 CHECK (salary_day BETWEEN 1 AND 28),
  major_expense_threshold_paise BIGINT NOT NULL DEFAULT 50000 CHECK (major_expense_threshold_paise >= 0),
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  compact_mode BOOLEAN NOT NULL DEFAULT false,
  dashboard_widgets JSONB NOT NULL DEFAULT '["hero","stats","insights","recent","obligations","forecast","net-worth","achievements","heatmap"]'::jsonb,
  app_lock_enabled BOOLEAN NOT NULL DEFAULT false,
  biometric_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_lock_minutes SMALLINT NOT NULL DEFAULT 15 CHECK (auto_lock_minutes BETWEEN 1 AND 120),
  last_backup_at TIMESTAMPTZ,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'wallet', 'credit', 'investment', 'other')),
  institution TEXT CHECK (institution IS NULL OR char_length(institution) <= 120),
  balance_paise BIGINT NOT NULL DEFAULT 0 CHECK (balance_paise >= 0),
  color TEXT NOT NULL CHECK (char_length(color) <= 32),
  icon_name TEXT NOT NULL CHECK (char_length(icon_name) <= 64),
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_accounts_user_active ON public.accounts(user_id, is_active);

CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  slug TEXT NOT NULL CHECK (char_length(slug) <= 48),
  icon_name TEXT NOT NULL CHECK (char_length(icon_name) <= 64),
  color TEXT NOT NULL CHECK (char_length(color) <= 32),
  is_system BOOLEAN NOT NULL DEFAULT false,
  counts_toward_spending BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_categories_user_active ON public.categories(user_id, is_deleted, sort_order);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('expense', 'income')),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0 AND amount_paise <= 10000000000),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
  occurred_at TIMESTAMPTZ NOT NULL,
  month_key TEXT NOT NULL CHECK (char_length(month_key) <= 16),
  payment_method TEXT NOT NULL CHECK (char_length(payment_method) <= 32),
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_txn_user_cycle ON public.transactions(user_id, month_key, is_deleted);
CREATE INDEX IF NOT EXISTS idx_txn_user_active_date ON public.transactions(user_id, is_deleted, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_txn_user_kind ON public.transactions(user_id, kind) WHERE is_deleted = false;
CREATE UNIQUE INDEX IF NOT EXISTS uq_txn_daily_fingerprint ON public.transactions (
  user_id,
  category_id,
  amount_paise,
  (date_trunc('day', occurred_at AT TIME ZONE 'UTC')),
  lower(trim(title))
) WHERE is_deleted = false;

CREATE TABLE IF NOT EXISTS public.transaction_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL CHECK (char_length(file_name) <= 255),
  mime_type TEXT NOT NULL CHECK (char_length(mime_type) <= 128),
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  storage_path TEXT NOT NULL CHECK (char_length(storage_path) <= 1024),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attachments_txn ON public.transaction_attachments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user ON public.transaction_attachments(user_id);

CREATE TABLE IF NOT EXISTS public.monthly_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL CHECK (char_length(month_key) <= 16),
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  received_at TIMESTAMPTZ,
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_key)
);

CREATE TABLE IF NOT EXISTS public.budget_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL CHECK (char_length(month_key) <= 16),
  salary_paise BIGINT NOT NULL CHECK (salary_paise >= 0),
  allocation_mode TEXT NOT NULL CHECK (allocation_mode IN ('percentage', 'manual')),
  rollover_enabled BOOLEAN NOT NULL DEFAULT true,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_key)
);

CREATE TABLE IF NOT EXISTS public.budget_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.budget_plans(id) ON DELETE CASCADE,
  bucket_key TEXT NOT NULL CHECK (char_length(bucket_key) <= 48),
  display_name TEXT NOT NULL CHECK (char_length(display_name) <= 120),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  bucket_type TEXT NOT NULL CHECK (bucket_type IN ('spending', 'reserve', 'investment')),
  allocated_paise BIGINT NOT NULL DEFAULT 0 CHECK (allocated_paise >= 0),
  allocated_percent NUMERIC(5,2) CHECK (allocated_percent IS NULL OR (allocated_percent >= 0 AND allocated_percent <= 100)),
  rollover_paise BIGINT NOT NULL DEFAULT 0 CHECK (rollover_paise >= 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, bucket_key)
);
CREATE INDEX IF NOT EXISTS idx_buckets_plan ON public.budget_buckets(plan_id);
CREATE INDEX IF NOT EXISTS idx_buckets_user ON public.budget_buckets(user_id);

CREATE TABLE IF NOT EXISTS public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL CHECK (char_length(person_name) <= 120),
  direction TEXT NOT NULL CHECK (direction IN ('lent_by_me', 'borrowed_by_me')),
  principal_paise BIGINT NOT NULL CHECK (principal_paise >= 0),
  balance_paise BIGINT NOT NULL CHECK (balance_paise >= 0),
  reason TEXT CHECK (reason IS NULL OR char_length(reason) <= 500),
  borrowed_at TIMESTAMPTZ NOT NULL,
  expected_return_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending', 'partial', 'returned')),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_loans_user_open ON public.loans(user_id, is_deleted, status);

CREATE TABLE IF NOT EXISTS public.loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  paid_at TIMESTAMPTZ NOT NULL,
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON public.loan_payments(loan_id, paid_at);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 120),
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly')),
  next_renewal_at TIMESTAMPTZ,
  payment_method TEXT NOT NULL CHECK (char_length(payment_method) <= 32),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subs_user_active ON public.subscriptions(user_id, is_active);

CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 120),
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'paid', 'overdue')),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bills_user_status_due ON public.bills(user_id, status, due_at);

CREATE TABLE IF NOT EXISTS public.emis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 120),
  lender TEXT NOT NULL CHECK (char_length(lender) <= 120),
  principal_paise BIGINT NOT NULL CHECK (principal_paise >= 0),
  emi_amount_paise BIGINT NOT NULL CHECK (emi_amount_paise >= 0),
  balance_paise BIGINT NOT NULL CHECK (balance_paise >= 0),
  interest_rate NUMERIC(6,3) NOT NULL DEFAULT 0 CHECK (interest_rate >= 0 AND interest_rate <= 100),
  tenure_months INTEGER NOT NULL CHECK (tenure_months >= 1),
  paid_months INTEGER NOT NULL DEFAULT 0 CHECK (paid_months >= 0),
  next_due_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_emis_user_active_due ON public.emis(user_id, is_active, next_due_at);

CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 120),
  target_paise BIGINT NOT NULL CHECK (target_paise >= 0),
  saved_paise BIGINT NOT NULL DEFAULT 0 CHECK (saved_paise >= 0),
  monthly_contribution_paise BIGINT NOT NULL DEFAULT 0 CHECK (monthly_contribution_paise >= 0),
  target_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_goals_user_active ON public.savings_goals(user_id, is_active);

CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 120),
  target_paise BIGINT NOT NULL CHECK (target_paise >= 0),
  saved_paise BIGINT NOT NULL DEFAULT 0 CHECK (saved_paise >= 0),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  url TEXT CHECK (url IS NULL OR char_length(url) <= 2048),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  is_purchased BOOLEAN NOT NULL DEFAULT false,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_active ON public.wishlist_items(user_id, is_purchased);

CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 120),
  type TEXT NOT NULL CHECK (type IN ('mutual_fund', 'stock', 'fd', 'gold', 'crypto', 'other')),
  invested_paise BIGINT NOT NULL DEFAULT 0 CHECK (invested_paise >= 0),
  current_value_paise BIGINT NOT NULL DEFAULT 0 CHECK (current_value_paise >= 0),
  platform TEXT CHECK (platform IS NULL OR char_length(platform) <= 120),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_investments_user ON public.investments(user_id);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'bill', 'emi', 'insight', 'goal', 'duplicate', 'subscription')),
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  body TEXT NOT NULL CHECK (char_length(body) <= 2000),
  read BOOLEAN NOT NULL DEFAULT false,
  href TEXT CHECK (href IS NULL OR char_length(href) <= 512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read, created_at DESC);

CREATE TABLE IF NOT EXISTS public.secure_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  body TEXT NOT NULL CHECK (char_length(body) <= 20000),
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_secure_notes_user ON public.secure_notes(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL CHECK (char_length(achievement_key) <= 64),
  title TEXT NOT NULL CHECK (char_length(title) <= 120),
  description TEXT NOT NULL CHECK (char_length(description) <= 500),
  icon_name TEXT NOT NULL CHECK (char_length(icon_name) <= 64),
  unlocked_at TIMESTAMPTZ,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  target INTEGER NOT NULL DEFAULT 1 CHECK (target >= 1),
  row_version INTEGER NOT NULL DEFAULT 1 CHECK (row_version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_key)
);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id);

CREATE TABLE IF NOT EXISTS public.monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL CHECK (char_length(month_key) <= 16),
  income_paise BIGINT NOT NULL CHECK (income_paise >= 0),
  expense_paise BIGINT NOT NULL CHECK (expense_paise >= 0),
  net_worth_paise BIGINT NOT NULL,
  savings_rate SMALLINT NOT NULL CHECK (savings_rate >= -100 AND savings_rate <= 100),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_key)
);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_month ON public.monthly_snapshots(user_id, month_key);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (char_length(action) <= 64),
  entity_type TEXT CHECK (entity_type IS NULL OR char_length(entity_type) <= 64),
  entity_id UUID,
  detail TEXT CHECK (detail IS NULL OR char_length(detail) <= 500),
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_user_created ON public.audit_logs(user_id, created_at DESC);

-- ─── updated_at triggers ─────────────────────────────────────────────────────
SELECT public.apply_updated_at_trigger('profiles');
SELECT public.apply_updated_at_trigger('app_settings');
SELECT public.apply_updated_at_trigger('accounts');
SELECT public.apply_updated_at_trigger('categories');
SELECT public.apply_updated_at_trigger('transactions');
SELECT public.apply_updated_at_trigger('monthly_salaries');
SELECT public.apply_updated_at_trigger('budget_plans');
SELECT public.apply_updated_at_trigger('budget_buckets');
SELECT public.apply_updated_at_trigger('loans');
SELECT public.apply_updated_at_trigger('subscriptions');
SELECT public.apply_updated_at_trigger('bills');
SELECT public.apply_updated_at_trigger('emis');
SELECT public.apply_updated_at_trigger('savings_goals');
SELECT public.apply_updated_at_trigger('wishlist_items');
SELECT public.apply_updated_at_trigger('investments');
SELECT public.apply_updated_at_trigger('secure_notes');
SELECT public.apply_updated_at_trigger('achievements');

-- ─── Auto-provision profile + settings on signup ───────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email, currency_code)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''), 'Viswallet User'),
    NEW.email,
    'INR'
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.app_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop + recreate owner-scoped policies (idempotent re-run)
DO $$
DECLARE
  t TEXT;
  op TEXT;
  policy_sql TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','app_settings','accounts','categories','transactions',
    'transaction_attachments','monthly_salaries','budget_plans','budget_buckets',
    'loans','loan_payments','subscriptions','bills','emis','savings_goals',
    'wishlist_items','investments','notifications','secure_notes','achievements',
    'monthly_snapshots'
  ]
  LOOP
    FOREACH op IN ARRAY ARRAY['select', 'insert', 'update', 'delete']
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_' || op, t);

      policy_sql := CASE op
        WHEN 'select' THEN format(
          'CREATE POLICY %I ON public.%I FOR SELECT USING (auth.uid() = user_id)',
          t || '_select', t
        )
        WHEN 'insert' THEN format(
          'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (auth.uid() = user_id)',
          t || '_insert', t
        )
        WHEN 'update' THEN format(
          'CREATE POLICY %I ON public.%I FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)',
          t || '_update', t
        )
        WHEN 'delete' THEN format(
          'CREATE POLICY %I ON public.%I FOR DELETE USING (auth.uid() = user_id)',
          t || '_delete', t
        )
      END;

      EXECUTE policy_sql;
    END LOOP;
  END LOOP;
END $$;

-- Audit logs: immutable trail (insert + select only)
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_update ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_delete ON public.audit_logs;

CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── Storage bucket for receipt attachments ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'transaction-attachments',
  'transaction-attachments',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS txn_attachments_select ON storage.objects;
DROP POLICY IF EXISTS txn_attachments_insert ON storage.objects;
DROP POLICY IF EXISTS txn_attachments_update ON storage.objects;
DROP POLICY IF EXISTS txn_attachments_delete ON storage.objects;

CREATE POLICY txn_attachments_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'transaction-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY txn_attachments_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'transaction-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY txn_attachments_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'transaction-attachments' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'transaction-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY txn_attachments_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'transaction-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ─── Cloud vault (full backup per user — restore after reinstall) ─────────────
CREATE TABLE IF NOT EXISTS public.user_data_vaults (
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
CREATE POLICY user_data_vaults_select ON public.user_data_vaults FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_data_vaults_insert ON public.user_data_vaults FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_data_vaults_update ON public.user_data_vaults FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_data_vaults_delete ON public.user_data_vaults FOR DELETE USING (auth.uid() = user_id);

-- ─── Grants ───────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;

-- ─── Upgrade path (safe if you ran older partial migrations) ──────────────────
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS compact_mode BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.budget_buckets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.budget_buckets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.budget_buckets ADD COLUMN IF NOT EXISTS row_version INTEGER NOT NULL DEFAULT 1;

-- =============================================================================
-- Done. Tables created: 22 | RLS enabled on all | Storage bucket ready.
-- PIN / app-lock secrets stay on-device only (not stored in Supabase).
-- =============================================================================
