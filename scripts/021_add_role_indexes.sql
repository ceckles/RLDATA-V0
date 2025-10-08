-- Add additional indexes for role-based queries
create index if not exists idx_profiles_subscription_tier on public.profiles(subscription_tier);
create index if not exists idx_profiles_subscription_status on public.profiles(subscription_status);
create index if not exists idx_profiles_lemon_squeezy_customer_id on public.profiles(lemon_squeezy_customer_id);
create index if not exists idx_profiles_lemon_squeezy_subscription_id on public.profiles(lemon_squeezy_subscription_id);

-- Add function to check multiple roles at once
create or replace function public.user_has_any_role(user_id_param uuid, role_names_param text[])
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = user_id_param
    and r.name = any(role_names_param)
    and (ur.expires_at is null or ur.expires_at > now())
  );
end;
$$;

-- Add function to get all users with a specific role (admin only)
create or replace function public.get_users_with_role(role_name_param text)
returns table (
  user_id uuid,
  email text,
  full_name text,
  assigned_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    ur.user_id,
    p.email,
    p.full_name,
    ur.assigned_at,
    ur.expires_at
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  join public.profiles p on p.id = ur.user_id
  where r.name = role_name_param
  and (ur.expires_at is null or ur.expires_at > now())
  order by ur.assigned_at desc;
end;
$$;
