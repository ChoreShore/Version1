-- Run this SQL in your Supabase SQL Editor

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text not null,
  roles text[] not null default array[]::text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Create index on roles for faster queries
create index if not exists profiles_roles_idx on public.profiles using gin (roles);

-- 3. Function to auto-update updated_at timestamp
create or replace function public.handle_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4. Trigger to update timestamp on profile updates
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.handle_profiles_updated_at();

-- 5. Function to auto-create profile when user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  roles_raw text;
begin
  roles_raw := new.raw_user_meta_data->>'roles';
  insert into public.profiles (id, first_name, last_name, phone, roles)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    case
      when roles_raw is null then array[]::text[]
      else string_to_array(roles_raw, ',')
    end
  );
  return new;
exception
  when unique_violation then return new;
end;
$$;

-- 6. Trigger to create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 7. Enable Row Level Security
alter table public.profiles enable row level security;

-- 8. RLS Policy: Users can read their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select using (auth.uid() = id);

-- 9. RLS Policy: Users can update their own profile
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update using (auth.uid() = id);

-- 10. RLS Policy: Only service role can insert (via trigger)
drop policy if exists "profiles_insert_trigger_only" on public.profiles;
create policy "profiles_insert_trigger_only"
on public.profiles
for insert
with check (auth.role() = 'service_role');
