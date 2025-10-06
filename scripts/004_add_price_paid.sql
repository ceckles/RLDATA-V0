-- Add price_paid column to components table
alter table public.components
add column if not exists price_paid numeric;

-- Update existing records to set price_paid based on cost_per_unit and quantity
update public.components
set price_paid = cost_per_unit * quantity
where cost_per_unit is not null and quantity > 0;
