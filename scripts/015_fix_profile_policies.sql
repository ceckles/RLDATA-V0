-- Fix profile RLS policies to allow profile creation
-- This fixes the "infinite recursion" error and allows checkout to work

-- First, drop any problematic policies that might cause recursion
drop policy if exists "Admins and moderators can view all profiles" on profiles;
drop policy if exists "Admins can update user roles" on profiles;

-- Add missing INSERT policy for profiles
-- This allows users to create their own profile (needed for checkout flow)
drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Verify the policies are correct
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies 
where tablename = 'profiles'
order by policyname;
