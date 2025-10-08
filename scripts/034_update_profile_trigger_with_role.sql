-- Update the profile creation trigger to automatically assign 'user' role
-- This ensures all new users get the 'user' role automatically

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role_id uuid;
begin
  -- Create profile
  insert into public.profiles (id, email, full_name, subscription_tier)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    'basic'
  )
  on conflict (id) do nothing;

  -- Automatically assign 'user' role to new users
  -- Get the 'user' role id
  select id into user_role_id
  from public.roles
  where name = 'user'
  limit 1;

  -- Assign the 'user' role if it exists
  if user_role_id is not null then
    insert into public.user_roles (user_id, role_id, assigned_by, assigned_at)
    values (new.id, user_role_id, new.id, now())
    on conflict (user_id, role_id) do nothing;
  end if;

  return new;
end;
$$;

-- Recreate the trigger
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Verify the trigger was created
select 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
from information_schema.triggers
where trigger_name = 'on_auth_user_created';
