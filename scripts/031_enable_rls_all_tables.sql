-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- This script enables Row Level Security on all tables
-- that don't currently have it enabled
-- =====================================================

-- Enable RLS on tables added in later migrations
alter table if exists public.maintenance_schedules enable row level security;
alter table if exists public.maintenance_history enable row level security;
alter table if exists public.reloading_sessions enable row level security;
alter table if exists public.ammunition_batches enable row level security;
alter table if exists public.user_tracking_preferences enable row level security;
alter table if exists public.roles enable row level security;
alter table if exists public.user_roles enable row level security;
alter table if exists public.role_audit_log enable row level security;

-- Drop backup tables (these were temporary and should not be in production)
drop table if exists public.components_backup cascade;
drop table if exists public.shooting_sessions_backup cascade;
drop table if exists public.shot_data_backup cascade;

-- Verify RLS is enabled on all tables
do $$
declare
  tbl record;
begin
  raise notice 'Tables with RLS status:';
  for tbl in 
    select schemaname, tablename, rowsecurity 
    from pg_tables 
    where schemaname = 'public'
    order by tablename
  loop
    raise notice '  % - RLS: %', tbl.tablename, 
      case when tbl.rowsecurity then 'ENABLED' else 'DISABLED' end;
  end loop;
end $$;
