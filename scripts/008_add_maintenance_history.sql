-- Create maintenance history table
create table if not exists public.maintenance_history (
  id uuid primary key default uuid_generate_v4(),
  firearm_id uuid not null references public.firearms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_id uuid references public.maintenance_schedules(id) on delete set null,
  name text not null,
  type text not null check (type in ('cleaning', 'repair', 'modification', 'inspection', 'lubrication', 'parts_replacement', 'other')),
  completed_at timestamptz not null default now(),
  round_count_at_completion integer,
  notes text,
  created_at timestamptz not null default now()
);

-- Enable RLS on maintenance_history
alter table public.maintenance_history enable row level security;

-- RLS Policies for maintenance_history
create policy "Users can view own maintenance history"
  on public.maintenance_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own maintenance history"
  on public.maintenance_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update own maintenance history"
  on public.maintenance_history for update
  using (auth.uid() = user_id);

create policy "Users can delete own maintenance history"
  on public.maintenance_history for delete
  using (auth.uid() = user_id);

-- Create indexes for better query performance
create index idx_maintenance_history_firearm_id on public.maintenance_history(firearm_id);
create index idx_maintenance_history_user_id on public.maintenance_history(user_id);
create index idx_maintenance_history_completed_at on public.maintenance_history(completed_at desc);
