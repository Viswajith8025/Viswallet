-- Cloud backup: JSON snapshot of on-device SQLite per authenticated user.

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
