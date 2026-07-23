-- DEPRECATED — use supabase/setup.sql instead (canonical, complete RLS for all 22 tables).
-- Viswallet Postgres schema (Supabase) — migration 002
-- Apply after enabling Auth. All user data scoped to auth.uid().

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) <= 120),
  email TEXT CHECK (char_length(email) <= 254),
  avatar_url TEXT CHECK (char_length(avatar_url) <= 2048),
  currency_code CHAR(3) NOT NULL DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_mode TEXT NOT NULL DEFAULT 'system' CHECK (theme_mode IN ('system', 'light', 'dark')),
  accent_color TEXT NOT NULL DEFAULT 'ocean',
  salary_day SMALLINT NOT NULL DEFAULT 1 CHECK (salary_day BETWEEN 1 AND 28),
  major_expense_threshold_paise BIGINT NOT NULL DEFAULT 50000 CHECK (major_expense_threshold_paise >= 0),
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  dashboard_widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  app_lock_enabled BOOLEAN NOT NULL DEFAULT false,
  biometric_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_lock_minutes SMALLINT NOT NULL DEFAULT 15 CHECK (auto_lock_minutes BETWEEN 1 AND 120),
  last_backup_at TIMESTAMPTZ,
  row_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 120),
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'wallet', 'credit', 'investment', 'other')),
  institution TEXT,
  balance_paise BIGINT NOT NULL DEFAULT 0 CHECK (balance_paise >= 0),
  color TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  row_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_accounts_user_active ON accounts(user_id, is_active);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 120),
  slug TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  color TEXT NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  counts_toward_spending BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  row_version INTEGER NOT NULL DEFAULT 1,
  UNIQUE (user_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_categories_user_active ON categories(user_id, is_deleted, sort_order);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('expense', 'income')),
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0 AND amount_paise <= 10000000000),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  description TEXT CHECK (char_length(description) <= 2000),
  occurred_at TIMESTAMPTZ NOT NULL,
  month_key TEXT NOT NULL CHECK (char_length(month_key) <= 16),
  payment_method TEXT NOT NULL CHECK (char_length(payment_method) <= 32),
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT CHECK (char_length(notes) <= 2000),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  row_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_txn_user_cycle ON transactions(user_id, month_key, is_deleted);
CREATE INDEX IF NOT EXISTS idx_txn_user_active_date ON transactions(user_id, is_deleted, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_txn_user_kind ON transactions(user_id, kind) WHERE is_deleted = false;
-- Duplicate prevention: same user, day, category, amount, normalized title
CREATE UNIQUE INDEX IF NOT EXISTS uq_txn_daily_fingerprint ON transactions (
  user_id,
  category_id,
  amount_paise,
  (date_trunc('day', occurred_at AT TIME ZONE 'UTC')),
  lower(trim(title))
) WHERE is_deleted = false;

CREATE TABLE IF NOT EXISTS transaction_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attachments_txn ON transaction_attachments(transaction_id);

CREATE TABLE IF NOT EXISTS monthly_salaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  received_at TIMESTAMPTZ,
  notes TEXT,
  row_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_key)
);

CREATE TABLE IF NOT EXISTS budget_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  salary_paise BIGINT NOT NULL,
  allocation_mode TEXT NOT NULL CHECK (allocation_mode IN ('percentage', 'manual')),
  rollover_enabled BOOLEAN NOT NULL DEFAULT true,
  row_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_key)
);

CREATE TABLE IF NOT EXISTS budget_buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES budget_plans(id) ON DELETE CASCADE,
  bucket_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  bucket_type TEXT NOT NULL CHECK (bucket_type IN ('spending', 'reserve', 'investment')),
  allocated_paise BIGINT NOT NULL DEFAULT 0,
  allocated_percent NUMERIC(5,2),
  rollover_paise BIGINT NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (plan_id, bucket_key)
);
CREATE INDEX IF NOT EXISTS idx_buckets_plan ON budget_buckets(plan_id);

CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('lent_by_me', 'borrowed_by_me')),
  principal_paise BIGINT NOT NULL,
  balance_paise BIGINT NOT NULL,
  reason TEXT,
  borrowed_at TIMESTAMPTZ NOT NULL,
  expected_return_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('pending', 'partial', 'returned')),
  notes TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  row_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_loans_user_open ON loans(user_id, is_deleted, status);

CREATE TABLE IF NOT EXISTS loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  paid_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON loan_payments(loan_id, paid_at);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount_paise BIGINT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly')),
  next_renewal_at TIMESTAMPTZ,
  payment_method TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  row_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subs_user_active ON subscriptions(user_id, is_active);

CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount_paise BIGINT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'paid', 'overdue')),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  row_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bills_user_status_due ON bills(user_id, status, due_at);

CREATE TABLE IF NOT EXISTS emis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lender TEXT NOT NULL,
  principal_paise BIGINT NOT NULL,
  emi_amount_paise BIGINT NOT NULL,
  balance_paise BIGINT NOT NULL,
  interest_rate NUMERIC(6,3) NOT NULL DEFAULT 0,
  tenure_months INTEGER NOT NULL,
  paid_months INTEGER NOT NULL DEFAULT 0,
  next_due_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  row_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_emis_user_active_due ON emis(user_id, is_active, next_due_at);

CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_paise BIGINT NOT NULL,
  saved_paise BIGINT NOT NULL DEFAULT 0,
  monthly_contribution_paise BIGINT NOT NULL DEFAULT 0,
  target_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  row_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS monthly_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  income_paise BIGINT NOT NULL,
  expense_paise BIGINT NOT NULL,
  net_worth_paise BIGINT NOT NULL,
  savings_rate SMALLINT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, month_key)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  detail TEXT CHECK (char_length(detail) <= 500),
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_user_created ON audit_logs(user_id, created_at DESC);

-- Optimistic locking: enforce in application layer (WHERE row_version = $expected).
-- Do not use a blind trigger; clients must read-modify-write with version checks.

-- RLS: enable on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE emis ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Generic owner policies (SELECT/INSERT/UPDATE/DELETE)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles','app_settings','accounts','categories','transactions',
    'transaction_attachments','monthly_salaries','budget_plans','budget_buckets',
    'loans','loan_payments','subscriptions','bills','emis','savings_goals','monthly_snapshots'
  ]
  LOOP
    EXECUTE format('CREATE POLICY %I_select ON %I FOR SELECT USING (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY %I_insert ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY %I_update ON %I FOR UPDATE USING (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY %I_delete ON %I FOR DELETE USING (auth.uid() = user_id)', t, t);
  END LOOP;
END $$;

-- Audit logs: insert + select only (immutable)
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT USING (auth.uid() = user_id);
