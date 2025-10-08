-- Add role column to profiles table
alter table public.profiles 
add column if not exists role text not null default 'user' 
check (role in ('user', 'moderator', 'admin'));

-- Create feature_flags table
create table if not exists public.feature_flags (
  id uuid primary key default uuid_generate_v4(),
  feature_key text unique not null,
  feature_name text not null,
  description text,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on feature_flags
alter table public.feature_flags enable row level security;

-- RLS Policies for feature_flags (everyone can read, only admins can modify)
create policy "Anyone can view feature flags"
  on public.feature_flags for select
  using (true);

create policy "Only admins can insert feature flags"
  on public.feature_flags for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Only admins can update feature flags"
  on public.feature_flags for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Only admins can delete feature flags"
  on public.feature_flags for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Add RLS policy for admins/moderators to view all profiles
create policy "Admins and moderators can view all profiles"
  on public.profiles for select
  using (
    auth.uid() = id or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'moderator')
    )
  );

-- Add RLS policy for admins to update user roles
create policy "Admins can update user roles"
  on public.profiles for update
  using (
    auth.uid() = id or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Insert default feature flags
insert into public.feature_flags (feature_key, feature_name, description, is_enabled) values
  ('analytics', 'Analytics Dashboard', 'Enable access to the analytics dashboard', true),
  ('shooting_sessions', 'Shooting Sessions', 'Enable shooting session tracking', true),
  ('reloading', 'Reloading Data', 'Enable reloading data management', true),
  ('inventory', 'Inventory Management', 'Enable inventory tracking', true),
  ('firearms', 'Firearms Management', 'Enable firearms management', true)
on conflict (feature_key) do nothing;

-- Add updated_at trigger for feature_flags
create trigger set_updated_at
  before update on public.feature_flags
  for each row
  execute function public.handle_updated_at();

-- Create index for feature flags
create index idx_feature_flags_key on public.feature_flags(feature_key);
create index idx_profiles_role on public.profiles(role);
