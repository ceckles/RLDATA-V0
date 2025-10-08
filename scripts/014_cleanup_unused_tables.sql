-- Clean up unused database objects from removed features
-- Safe to run multiple times

-- Drop logs table (from removed logging system)
drop table if exists logs cascade;

-- Drop feature_flags table (from removed admin system)
drop table if exists feature_flags cascade;

-- Drop webhook_logs table (from removed debug system)
drop table if exists webhook_logs cascade;

-- Remove role column from profiles (from removed admin system)
alter table profiles drop column if exists role;

-- Clean up any orphaned RLS policies
drop policy if exists "Anyone can view feature flags" on feature_flags;
drop policy if exists "Admins and moderators can view all profiles" on profiles;
drop policy if exists "Admins can update user roles" on profiles;
drop policy if exists "Users can view their own logs" on logs;
drop policy if exists "System can insert logs" on logs;

-- Verify cleanup
select 'Cleanup complete. Removed: logs, feature_flags, webhook_logs tables and role column from profiles.' as status;
