-- Remove redundant lemon_squeezy_order_id from user_roles
-- This field should only exist in profiles table since it tracks the user's subscription order
-- Role assignments can happen independently of orders (manual admin assignments)

alter table public.user_roles 
  drop column if exists lemon_squeezy_order_id;

-- Verification query
select 
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles', 'user_roles')
  and column_name = 'lemon_squeezy_order_id'
order by table_name;

-- Expected result: Only profiles table should have lemon_squeezy_order_id
