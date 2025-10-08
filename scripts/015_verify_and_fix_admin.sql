-- First, check if role column exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'profiles' and column_name = 'role'
  ) then
    alter table public.profiles 
    add column role text not null default 'user' 
    check (role in ('user', 'moderator', 'admin'));
    
    raise notice 'Added role column to profiles table';
  else
    raise notice 'Role column already exists';
  end if;
end $$;

-- Drop conflicting policies if they exist
drop policy if exists "Admins and moderators can view all profiles" on public.profiles;
drop policy if exists "Admins can update user roles" on public.profiles;

-- Recreate the policies correctly
create policy "Admins and moderators can view all profiles"
  on public.profiles for select
  using (
    auth.uid() = id or
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'moderator')
    )
  );

create policy "Admins can update user roles"
  on public.profiles for update
  using (
    auth.uid() = id or
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- Create index if it doesn't exist
create index if not exists idx_profiles_role on public.profiles(role);

-- Verify your user has admin role
select id, email, role, subscription_status 
from profiles 
where id = '5b8d66fb-167a-4933-b83f-d2d6643ad0af';
