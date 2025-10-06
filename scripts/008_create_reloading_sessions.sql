-- Create reloading_sessions table to track when users create ammunition batches
create table if not exists public.reloading_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  load_recipe_id uuid not null references public.load_recipes(id) on delete cascade,
  date date not null default current_date,
  rounds_produced integer not null,
  primer_component_id uuid references public.components(id) on delete set null,
  powder_component_id uuid references public.components(id) on delete set null,
  powder_weight_per_round numeric not null,
  bullet_component_id uuid references public.components(id) on delete set null,
  brass_component_id uuid references public.components(id) on delete set null,
  batch_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add reloading_session_id to shooting_sessions to track which ammo batch was used
alter table public.shooting_sessions 
add column if not exists reloading_session_id uuid references public.reloading_sessions(id) on delete set null;

-- Enable RLS
alter table public.reloading_sessions enable row level security;

-- RLS Policies for reloading_sessions
create policy "Users can view own reloading sessions"
  on public.reloading_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own reloading sessions"
  on public.reloading_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reloading sessions"
  on public.reloading_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own reloading sessions"
  on public.reloading_sessions for delete
  using (auth.uid() = user_id);

-- Create indexes
create index idx_reloading_sessions_user_id on public.reloading_sessions(user_id);
create index idx_reloading_sessions_load_recipe_id on public.reloading_sessions(load_recipe_id);
create index idx_shooting_sessions_reloading_session_id on public.shooting_sessions(reloading_session_id);

-- Add updated_at trigger
create trigger set_updated_at
  before update on public.reloading_sessions
  for each row
  execute function public.handle_updated_at();
