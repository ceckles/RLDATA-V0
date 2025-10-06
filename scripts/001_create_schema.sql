-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  subscription_tier text not null default 'basic' check (subscription_tier in ('basic', 'premium')),
  lemon_squeezy_customer_id text,
  lemon_squeezy_subscription_id text,
  subscription_status text check (subscription_status in ('active', 'cancelled', 'expired', 'paused')),
  subscription_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create components table (primers, powder, bullets, brass)
create table if not exists public.components (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('primer', 'powder', 'bullet', 'brass')),
  manufacturer text not null,
  model text not null,
  caliber text,
  weight numeric,
  quantity integer not null default 0,
  cost_per_unit numeric,
  lot_number text,
  purchase_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create firearms table
create table if not exists public.firearms (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  manufacturer text,
  model text,
  serial_number text,
  caliber text not null,
  type text check (type in ('rifle', 'pistol', 'shotgun', 'other')),
  barrel_length numeric,
  twist_rate text,
  purchase_date date,
  image_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create maintenance logs table
create table if not exists public.maintenance_logs (
  id uuid primary key default uuid_generate_v4(),
  firearm_id uuid not null references public.firearms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  type text not null check (type in ('cleaning', 'repair', 'modification', 'inspection', 'other')),
  description text not null,
  cost numeric,
  created_at timestamptz not null default now()
);

-- Create load recipes table
create table if not exists public.load_recipes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  caliber text not null,
  primer_id uuid references public.components(id) on delete set null,
  powder_id uuid references public.components(id) on delete set null,
  powder_weight numeric not null,
  bullet_id uuid references public.components(id) on delete set null,
  brass_id uuid references public.components(id) on delete set null,
  coal numeric, -- Cartridge Overall Length
  crimp_depth numeric,
  notes text,
  is_favorite boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create shooting sessions table
create table if not exists public.shooting_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  firearm_id uuid not null references public.firearms(id) on delete cascade,
  load_recipe_id uuid references public.load_recipes(id) on delete set null,
  date date not null default current_date,
  location text,
  temperature numeric,
  humidity numeric,
  wind_speed numeric,
  wind_direction text,
  elevation numeric,
  rounds_fired integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create shot data table (individual shots within a session)
create table if not exists public.shot_data (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.shooting_sessions(id) on delete cascade,
  shot_number integer not null,
  distance numeric not null,
  group_size numeric,
  velocity numeric,
  poi_horizontal numeric, -- Point of Impact horizontal offset
  poi_vertical numeric, -- Point of Impact vertical offset
  notes text,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.components enable row level security;
alter table public.firearms enable row level security;
alter table public.maintenance_logs enable row level security;
alter table public.load_recipes enable row level security;
alter table public.shooting_sessions enable row level security;
alter table public.shot_data enable row level security;

-- RLS Policies for profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- RLS Policies for components
create policy "Users can view own components"
  on public.components for select
  using (auth.uid() = user_id);

create policy "Users can insert own components"
  on public.components for insert
  with check (auth.uid() = user_id);

create policy "Users can update own components"
  on public.components for update
  using (auth.uid() = user_id);

create policy "Users can delete own components"
  on public.components for delete
  using (auth.uid() = user_id);

-- RLS Policies for firearms
create policy "Users can view own firearms"
  on public.firearms for select
  using (auth.uid() = user_id);

create policy "Users can insert own firearms"
  on public.firearms for insert
  with check (auth.uid() = user_id);

create policy "Users can update own firearms"
  on public.firearms for update
  using (auth.uid() = user_id);

create policy "Users can delete own firearms"
  on public.firearms for delete
  using (auth.uid() = user_id);

-- RLS Policies for maintenance_logs
create policy "Users can view own maintenance logs"
  on public.maintenance_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own maintenance logs"
  on public.maintenance_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own maintenance logs"
  on public.maintenance_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own maintenance logs"
  on public.maintenance_logs for delete
  using (auth.uid() = user_id);

-- RLS Policies for load_recipes
create policy "Users can view own load recipes"
  on public.load_recipes for select
  using (auth.uid() = user_id);

create policy "Users can insert own load recipes"
  on public.load_recipes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own load recipes"
  on public.load_recipes for update
  using (auth.uid() = user_id);

create policy "Users can delete own load recipes"
  on public.load_recipes for delete
  using (auth.uid() = user_id);

-- RLS Policies for shooting_sessions
create policy "Users can view own shooting sessions"
  on public.shooting_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own shooting sessions"
  on public.shooting_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own shooting sessions"
  on public.shooting_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own shooting sessions"
  on public.shooting_sessions for delete
  using (auth.uid() = user_id);

-- RLS Policies for shot_data (access through session ownership)
create policy "Users can view shot data from own sessions"
  on public.shot_data for select
  using (
    exists (
      select 1 from public.shooting_sessions
      where shooting_sessions.id = shot_data.session_id
      and shooting_sessions.user_id = auth.uid()
    )
  );

create policy "Users can insert shot data to own sessions"
  on public.shot_data for insert
  with check (
    exists (
      select 1 from public.shooting_sessions
      where shooting_sessions.id = shot_data.session_id
      and shooting_sessions.user_id = auth.uid()
    )
  );

create policy "Users can update shot data from own sessions"
  on public.shot_data for update
  using (
    exists (
      select 1 from public.shooting_sessions
      where shooting_sessions.id = shot_data.session_id
      and shooting_sessions.user_id = auth.uid()
    )
  );

create policy "Users can delete shot data from own sessions"
  on public.shot_data for delete
  using (
    exists (
      select 1 from public.shooting_sessions
      where shooting_sessions.id = shot_data.session_id
      and shooting_sessions.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
create index idx_components_user_id on public.components(user_id);
create index idx_components_type on public.components(type);
create index idx_firearms_user_id on public.firearms(user_id);
create index idx_maintenance_logs_firearm_id on public.maintenance_logs(firearm_id);
create index idx_load_recipes_user_id on public.load_recipes(user_id);
create index idx_shooting_sessions_user_id on public.shooting_sessions(user_id);
create index idx_shooting_sessions_firearm_id on public.shooting_sessions(firearm_id);
create index idx_shot_data_session_id on public.shot_data(session_id);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at triggers
create trigger set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.components
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.firearms
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.load_recipes
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.shooting_sessions
  for each row
  execute function public.handle_updated_at();
