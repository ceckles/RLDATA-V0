-- Add round_count to firearms table
alter table public.firearms
add column if not exists round_count integer not null default 0;

-- Create maintenance schedules table
create table if not exists public.maintenance_schedules (
  id uuid primary key default uuid_generate_v4(),
  firearm_id uuid not null references public.firearms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('cleaning', 'repair', 'modification', 'inspection', 'lubrication', 'parts_replacement', 'other')),
  interval_type text not null check (interval_type in ('rounds', 'days', 'months')),
  interval_value integer not null,
  last_completed_at timestamptz,
  last_completed_round_count integer,
  notes text,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on maintenance_schedules
alter table public.maintenance_schedules enable row level security;

-- RLS Policies for maintenance_schedules
create policy "Users can view own maintenance schedules"
  on public.maintenance_schedules for select
  using (auth.uid() = user_id);

create policy "Users can insert own maintenance schedules"
  on public.maintenance_schedules for insert
  with check (auth.uid() = user_id);

create policy "Users can update own maintenance schedules"
  on public.maintenance_schedules for update
  using (auth.uid() = user_id);

create policy "Users can delete own maintenance schedules"
  on public.maintenance_schedules for delete
  using (auth.uid() = user_id);

-- Create index for better query performance
create index idx_maintenance_schedules_firearm_id on public.maintenance_schedules(firearm_id);
create index idx_maintenance_schedules_user_id on public.maintenance_schedules(user_id);

-- Add updated_at trigger
create trigger set_updated_at
  before update on public.maintenance_schedules
  for each row
  execute function public.handle_updated_at();
