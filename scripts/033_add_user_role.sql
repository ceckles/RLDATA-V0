-- Add 'user' as a default role for all users
-- This script:
-- 1. Adds 'user' to the allowed roles
-- 2. Inserts the 'user' role into the roles table
-- 3. Assigns 'user' role to all existing users who don't have it

-- First, update the roles table constraint to include 'user'
alter table public.roles 
  drop constraint if exists roles_name_check;

alter table public.roles 
  add constraint roles_name_check 
  check (name in ('admin', 'moderator', 'subscriber', 'donator', 'tester', 'user'));

-- Insert the 'user' role
insert into public.roles (name, description) values
  ('user', 'Default role for all registered users')
on conflict (name) do nothing;

-- Assign 'user' role to all existing users who don't have any role yet
insert into public.user_roles (user_id, role_id, assigned_by, assigned_at)
select 
  u.id,
  r.id,
  u.id, -- self-assigned
  now()
from auth.users u
cross join public.roles r
where r.name = 'user'
  and not exists (
    select 1 from public.user_roles ur 
    where ur.user_id = u.id and ur.role_id = r.id
  )
on conflict (user_id, role_id) do nothing;

-- Verify all users now have the 'user' role
select 
  count(*) as total_users,
  count(ur.id) as users_with_user_role
from auth.users u
left join public.user_roles ur on ur.user_id = u.id
left join public.roles r on r.id = ur.role_id and r.name = 'user';
