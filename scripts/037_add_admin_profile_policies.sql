-- =====================================================
-- ADD ADMIN POLICIES FOR PROFILES TABLE
-- Admins need to be able to view all user profiles
-- =====================================================

-- Drop existing policies if they exist
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

-- Admins can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
      and (ur.expires_at is null or ur.expires_at > now())
    )
  );

-- Admins can update all profiles (for admin management)
create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
      and (ur.expires_at is null or ur.expires_at > now())
    )
  );

-- Verify policies
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies 
where schemaname = 'public' 
and tablename = 'profiles'
order by policyname;
