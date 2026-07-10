-- =============================================================================
-- Viswallet — PRODUCTION Supabase schema (run once in SQL Editor)
-- =============================================================================
-- Paste this entire file into:
--   Supabase Dashboard → SQL Editor → New query → Run
--
-- APP SCAN SUMMARY (Flutter codebase, full review)
-- -----------------------------------------------------------------------------
-- Supabase is used ONLY for:
--   • auth.signUp / signIn / signOut          (lib/features/auth/data/auth_repository.dart)
--   • public.profiles SELECT (health check)   (checkConnection → select id limit 1)
--   • RPC get_password_hint(p_email)          (Settings → View password hint)
--   • Sign-up metadata → profiles row       (display_name, password_hint via trigger)
--   • public.user_data_backups UPSERT/SELECT  (cloud restore after reinstall)
--
-- NOT stored in Supabase (local Drift/SQLite on device — mirrored to user_data_backups):
--   app_settings, monthly_salary, categories, expenses, subscriptions,
--   subscription_payments, loans, loan_payments, budget_plans, budget_buckets,
--   income_sources, savings_goals, tagging_rules, activity_log
--
-- RESULT: 2 public tables (profiles, user_data_backups) + 3 functions + 2 triggers + RLS
--
-- AFTER RUNNING (Dashboard checklist):
--   1. Authentication → Providers → Email → ON, Allow signups → ON
--   2. Production: enable "Confirm email" if you want verified accounts
--   3. Settings → API → confirm anon key matches the Flutter app build
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. REMOVE LEGACY CLOUD TABLES (unused by app; safe if never created)
-- CASCADE drops any triggers on these tables automatically.
-- Do NOT use "DROP TRIGGER ... ON table" here — that errors if the table is gone.
-- -----------------------------------------------------------------------------
drop table if exists public.activity_log cascade;
drop table if exists public.tagging_rules cascade;
drop table if exists public.loan_payments cascade;
drop table if exists public.loans cascade;
drop table if exists public.subscription_payments cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.budget_buckets cascade;
drop table if exists public.budget_plans cascade;
drop table if exists public.savings_goals cascade;
drop table if exists public.expenses cascade;
drop table if exists public.categories cascade;
drop table if exists public.monthly_salaries cascade;
drop table if exists public.income_sources cascade;
drop table if exists public.user_settings cascade;

-- -----------------------------------------------------------------------------
-- 1. PROFILES (extends auth.users — one row per signed-up user)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  password_hint text,
  currency_code text not null default 'INR',
  salary_day int not null default 1 check (salary_day between 1 and 31),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade path: existing projects may be missing password_hint (add it now)
alter table public.profiles
  add column if not exists password_hint text;

alter table public.profiles
  add column if not exists display_name text;

alter table public.profiles
  add column if not exists currency_code text not null default 'INR';

alter table public.profiles
  add column if not exists salary_day int not null default 1;

alter table public.profiles
  add column if not exists created_at timestamptz not null default now();

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

comment on table public.profiles is
  'Viswallet cloud profile per auth.users row.';

comment on column public.profiles.password_hint is
  'Optional sign-up hint; readable only via get_password_hint() RPC when authenticated.';

-- -----------------------------------------------------------------------------
-- 1b. ACCOUNT DATA BACKUP (restore after reinstall)
-- -----------------------------------------------------------------------------
create table if not exists public.user_data_backups (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  schema_version int not null default 1,
  updated_at timestamptz not null default now()
);

comment on table public.user_data_backups is
  'JSON snapshot of on-device SQLite data, keyed by auth user.';

create index if not exists user_data_backups_updated_at_idx
  on public.user_data_backups (updated_at desc);

-- -----------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS
-- -----------------------------------------------------------------------------

-- Auto-touch updated_at on profile edits
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create / merge profiles row when a user signs up (reads auth metadata)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, password_hint)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    ),
    nullif(trim(new.raw_user_meta_data ->> 'password_hint'), '')
  )
  on conflict (id) do update
  set
    display_name = coalesce(
      nullif(excluded.display_name, ''),
      public.profiles.display_name
    ),
    password_hint = coalesce(excluded.password_hint, public.profiles.password_hint),
    updated_at = now();

  return new;
end;
$$;

-- Password hint: authenticated user can read ONLY their own hint (email must match)
create or replace function public.get_password_hint(p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hint text;
  v_user_email text;
begin
  if p_email is null or length(trim(p_email)) = 0 then
    return null;
  end if;

  if auth.uid() is null then
    return null;
  end if;

  select lower(u.email)
  into v_user_email
  from auth.users u
  where u.id = auth.uid();

  if v_user_email is null or v_user_email <> lower(trim(p_email)) then
    return null;
  end if;

  select p.password_hint
  into v_hint
  from public.profiles p
  where p.id = auth.uid();

  return v_hint;
end;
$$;

revoke all on function public.get_password_hint(text) from public;
revoke all on function public.get_password_hint(text) from anon;
grant execute on function public.get_password_hint(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. TRIGGERS
-- -----------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Inserts are performed only by handle_new_user() (security definer trigger).
-- No direct INSERT policy for clients — prevents spoofed profile rows.

alter table public.user_data_backups enable row level security;

drop policy if exists "Users read own backup" on public.user_data_backups;
create policy "Users read own backup"
  on public.user_data_backups
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own backup" on public.user_data_backups;
create policy "Users insert own backup"
  on public.user_data_backups
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own backup" on public.user_data_backups;
create policy "Users update own backup"
  on public.user_data_backups
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own backup" on public.user_data_backups;
create policy "Users delete own backup"
  on public.user_data_backups
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 5. DONE — verify (optional; uncomment to run)
-- -----------------------------------------------------------------------------
-- select table_name
-- from information_schema.tables
-- where table_schema = 'public'
-- order by table_name;
-- Expected: profiles, user_data_backups

-- select column_name, data_type, is_nullable
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'profiles'
-- order by ordinal_position;
-- Expected: id, display_name, password_hint, currency_code, salary_day, created_at, updated_at

-- select policyname, cmd, roles
-- from pg_policies
-- where schemaname = 'public' and tablename = 'profiles';
-- Expected: 2 policies (select + update) for authenticated
