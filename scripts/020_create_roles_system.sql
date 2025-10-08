-- Create roles table
create table if not exists public.roles (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique check (name in ('admin', 'moderator', 'subscriber', 'donator', 'tester')),
  description text,
  created_at timestamptz not null default now()
);

-- Create user_roles junction table (many-to-many)
create table if not exists public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  lemon_squeezy_order_id text,
  notes text,
  unique(user_id, role_id)
);

-- Add LemonSqueezy order tracking to profiles
alter table public.profiles 
  add column if not exists lemon_squeezy_order_id text;

-- Insert default roles
insert into public.roles (name, description) values
  ('admin', 'Full system access and user management'),
  ('moderator', 'Content moderation privileges'),
  ('subscriber', 'Active paid subscription member'),
  ('donator', 'Supporter who made a donation'),
  ('tester', 'Beta testing and early access')
on conflict (name) do nothing;

-- Enable RLS on new tables
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;

-- RLS Policies for roles table (read-only for all authenticated users)
create policy "Anyone can view roles"
  on public.roles for select
  using (true);

-- RLS Policies for user_roles
create policy "Users can view own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can view all user roles"
  on public.user_roles for select
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
    )
  );

create policy "Admins can insert user roles"
  on public.user_roles for insert
  with check (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
    )
  );

create policy "Admins can update user roles"
  on public.user_roles for update
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
    )
  );

create policy "Admins can delete user roles"
  on public.user_roles for delete
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
    )
  );

-- Create indexes for performance
create index idx_user_roles_user_id on public.user_roles(user_id);
create index idx_user_roles_role_id on public.user_roles(role_id);
create index idx_user_roles_expires_at on public.user_roles(expires_at) where expires_at is not null;

-- Create function to check if user has role
create or replace function public.user_has_role(user_id_param uuid, role_name_param text)
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
    and r.name = role_name_param
    and (ur.expires_at is null or ur.expires_at > now())
  );
end;
$$;

-- Create function to get user roles
create or replace function public.get_user_roles(user_id_param uuid)
returns table (
  role_name text,
  role_description text,
  assigned_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    r.name,
    r.description,
    ur.assigned_at,
    ur.expires_at
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = user_id_param
  and (ur.expires_at is null or ur.expires_at > now())
  order by ur.assigned_at desc;
end;
$$;

-- Create function to clean up expired roles (to be called by cron)
create or replace function public.cleanup_expired_roles()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.user_roles
  where expires_at is not null
  and expires_at < now();
end;
$$;

-- Create audit log for role changes
create table if not exists public.role_audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_name text not null,
  action text not null check (action in ('assigned', 'removed', 'expired')),
  performed_by uuid references auth.users(id) on delete set null,
  reason text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS on audit log
alter table public.role_audit_log enable row level security;

-- RLS for audit log (admins only)
create policy "Admins can view audit log"
  on public.role_audit_log for select
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
    )
  );

create index idx_role_audit_log_user_id on public.role_audit_log(user_id);
create index idx_role_audit_log_created_at on public.role_audit_log(created_at desc);
