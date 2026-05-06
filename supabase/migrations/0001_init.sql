-- Perifix P1 schema: profiles, account_requests, support_requests
-- Idempotent so it can be re-applied during development.

-- =============================================================================
-- profiles — public mirror of auth.users keyed on the same uuid
-- =============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  full_name text,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_role_idx on public.profiles (role);

-- =============================================================================
-- is_admin() — helper for RLS policies, avoids recursive policy lookups
-- =============================================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select role = 'admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- =============================================================================
-- handle_new_user() — auto-create a profile row when an auth.users row is created
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      trim(concat(
        coalesce(new.raw_user_meta_data->>'first_name', ''),
        ' ',
        coalesce(new.raw_user_meta_data->>'last_name', '')
      ))
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- account_requests — student account requests pending admin approval
-- =============================================================================
create table if not exists public.account_requests (
  id bigserial primary key,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create index if not exists account_requests_status_idx on public.account_requests (status);

-- =============================================================================
-- support_requests — Contact form + Troubleshooting "Contact Support" modal
-- =============================================================================
create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text not null,
  device text,
  issue text,
  description text not null,
  status text not null default 'pending' check (status in ('pending','priority','resolved')),
  source text not null default 'contact' check (source in ('contact','troubleshooting')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_status_idx on public.support_requests (status);
create index if not exists support_requests_created_idx on public.support_requests (created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists support_requests_touch_updated on public.support_requests;
create trigger support_requests_touch_updated
  before update on public.support_requests
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.account_requests enable row level security;
alter table public.support_requests enable row level security;

-- profiles
drop policy if exists profiles_select_self_or_admin on public.profiles;
create policy profiles_select_self_or_admin on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Block non-admins from escalating their own role
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change role';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- account_requests: anyone (incl. anon) can insert; only admins can read/update/delete
drop policy if exists account_requests_insert_anon on public.account_requests;
create policy account_requests_insert_anon on public.account_requests
  for insert with check (true);

drop policy if exists account_requests_admin_all on public.account_requests;
create policy account_requests_admin_all on public.account_requests
  for all using (public.is_admin()) with check (public.is_admin());

-- support_requests: anyone can insert; users can see their own; admins see all
drop policy if exists support_requests_insert_anyone on public.support_requests;
create policy support_requests_insert_anyone on public.support_requests
  for insert with check (true);

drop policy if exists support_requests_select_owner_or_admin on public.support_requests;
create policy support_requests_select_owner_or_admin on public.support_requests
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists support_requests_admin_write on public.support_requests;
create policy support_requests_admin_write on public.support_requests
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists support_requests_admin_delete on public.support_requests;
create policy support_requests_admin_delete on public.support_requests
  for delete using (public.is_admin());

-- =============================================================================
-- Realtime — let admin SupportRequests page subscribe to inserts/updates
-- =============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'support_requests'
  ) then
    alter publication supabase_realtime add table public.support_requests;
  end if;
end$$;
