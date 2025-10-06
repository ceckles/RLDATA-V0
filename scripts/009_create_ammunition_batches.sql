-- Create ammunition_batches table for tracking both hand-loaded and factory ammo
create table if not exists public.ammunition_batches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- Basic info
  batch_number text not null,
  date_produced date not null default current_date,
  caliber text not null,
  quantity integer not null default 0,
  quantity_remaining integer not null default 0,
  
  -- Type: handload or factory
  ammunition_type text not null check (ammunition_type in ('handload', 'factory')),
  
  -- Factory ammo fields
  factory_manufacturer text,
  factory_model text,
  factory_lot_number text,
  
  -- Handload - Component references
  primer_id uuid references public.components(id) on delete set null,
  powder_id uuid references public.components(id) on delete set null,
  bullet_id uuid references public.components(id) on delete set null,
  brass_id uuid references public.components(id) on delete set null,
  load_recipe_id uuid references public.load_recipes(id) on delete set null,
  
  -- Detailed measurements (all optional based on user preference)
  charge_weight_grains numeric,
  coal numeric, -- Cartridge Overall Length
  seating_depth_ogive numeric, -- Seating depth relative to ogive
  cartridge_weight_grains numeric,
  neck_tension numeric,
  bushing_size numeric,
  case_trim_length numeric,
  primer_seating_depth numeric,
  crimp_type text check (crimp_type in ('roll', 'taper', 'none', 'factory')),
  crimp_measurement numeric,
  number_of_firings integer default 0,
  
  -- Cost tracking
  cost_per_round numeric,
  total_cost numeric,
  
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create user_tracking_preferences table for customizable fields
create table if not exists public.user_tracking_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  
  -- Which fields to track for ammunition batches
  track_charge_weight boolean default true,
  track_coal boolean default true,
  track_seating_depth_ogive boolean default false,
  track_cartridge_weight boolean default false,
  track_neck_tension boolean default false,
  track_bushing_size boolean default false,
  track_case_trim_length boolean default false,
  track_primer_seating_depth boolean default false,
  track_crimp_type boolean default true,
  track_crimp_measurement boolean default false,
  track_number_of_firings boolean default true,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.ammunition_batches enable row level security;
alter table public.user_tracking_preferences enable row level security;

-- RLS Policies for ammunition_batches
create policy "Users can view own ammunition batches"
  on public.ammunition_batches for select
  using (auth.uid() = user_id);

create policy "Users can insert own ammunition batches"
  on public.ammunition_batches for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ammunition batches"
  on public.ammunition_batches for update
  using (auth.uid() = user_id);

create policy "Users can delete own ammunition batches"
  on public.ammunition_batches for delete
  using (auth.uid() = user_id);

-- RLS Policies for user_tracking_preferences
create policy "Users can view own tracking preferences"
  on public.user_tracking_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own tracking preferences"
  on public.user_tracking_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tracking preferences"
  on public.user_tracking_preferences for update
  using (auth.uid() = user_id);

-- Create indexes
create index idx_ammunition_batches_user_id on public.ammunition_batches(user_id);
create index idx_ammunition_batches_caliber on public.ammunition_batches(caliber);
create index idx_ammunition_batches_type on public.ammunition_batches(ammunition_type);

-- Add updated_at trigger
create trigger set_updated_at
  before update on public.ammunition_batches
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.user_tracking_preferences
  for each row
  execute function public.handle_updated_at();

-- Update shooting_sessions to reference ammunition_batches instead of load_recipe
alter table public.shooting_sessions 
  add column if not exists ammunition_batch_id uuid references public.ammunition_batches(id) on delete set null;

create index idx_shooting_sessions_ammunition_batch_id on public.shooting_sessions(ammunition_batch_id);
