-- Restore profiles table RLS policies to original working state
-- This fixes the infinite recursion error caused by admin/feature flag changes

-- Drop ALL existing policies on profiles table
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Admins and moderators can view all profiles" on public.profiles;
drop policy if exists "Admins can update user roles" on public.profiles;
drop policy if exists "Anyone can view profiles" on public.profiles;

-- Recreate the original policies from 001_create_schema.sql
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Add INSERT policy needed for subscription checkout flow
-- This allows users to create their own profile if it doesn't exist
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Verify policies are correct
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where tablename = 'profiles'
order by policyname;
