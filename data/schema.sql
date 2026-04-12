-- IronLog — Supabase Postgres schema
-- Run in Supabase SQL Editor after creating a project.
--
-- Dashboard: Authentication → Providers → enable "Anonymous sign-ins".
-- Copy Project URL + anon key into Vite env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

-- -----------------------------------------------------------------------------
-- Profiles: one row per auth user (anonymous JWT is fine).
-- - username: unique, immutable after insert (see trigger).
-- - display_name: optional human label (editable).
-- - app_state: full workout JSON (TMs, increments, cycle, week, sessions[], currentSession).
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  display_name text,
  app_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_len check (char_length(username) between 4 and 48)
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

create index if not exists profiles_updated_at_idx
  on public.profiles (updated_at desc);

-- Keep updated_at fresh on any row change
create or replace function public.ironlog_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.ironlog_set_updated_at();

-- Immutable username after signup
create or replace function public.ironlog_prevent_username_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.username is distinct from old.username then
    raise exception 'username is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_immutable_username on public.profiles;
create trigger trg_profiles_immutable_username
  before update on public.profiles
  for each row
  execute procedure public.ironlog_prevent_username_change();

-- Callable before sign-in (anon) to check collisions; SECURITY DEFINER, leak-safe.
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.profiles p
    where lower(p.username) = lower(trim(p_username))
  );
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- RLS: each user only sees and mutates their own profile.
-- Anonymous users receive role "authenticated" once signed in.
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
