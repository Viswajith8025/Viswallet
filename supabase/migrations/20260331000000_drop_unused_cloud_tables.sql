-- Viswallet: remove cloud tables not used by the app yet.
-- The Flutter app stores expenses, budgets, loans, etc. in local SQLite (Drift).
-- Supabase is used today only for Auth + profiles (password hint, connection check).

-- Drop updated_at triggers only when the legacy tables still exist.
do $$
declare
  t record;
begin
  for t in
    select *
    from (values
      ('public.user_settings', 'user_settings_updated_at'),
      ('public.income_sources', 'income_sources_updated_at'),
      ('public.monthly_salaries', 'monthly_salaries_updated_at'),
      ('public.categories', 'categories_updated_at'),
      ('public.expenses', 'expenses_updated_at'),
      ('public.subscriptions', 'subscriptions_updated_at'),
      ('public.loans', 'loans_updated_at'),
      ('public.budget_plans', 'budget_plans_updated_at'),
      ('public.savings_goals', 'savings_goals_updated_at')
    ) as v(tbl, trg)
  loop
    if to_regclass(t.tbl) is not null then
      execute format('drop trigger if exists %I on %s', t.trg, t.tbl);
    end if;
  end loop;
end;
$$;

-- Child tables first, then parents.
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

-- Signup hook: profiles only (no user_settings row).
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
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    ),
    nullif(trim(new.raw_user_meta_data ->> 'password_hint'), '')
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    password_hint = coalesce(excluded.password_hint, public.profiles.password_hint),
    updated_at = now();

  return new;
end;
$$;
