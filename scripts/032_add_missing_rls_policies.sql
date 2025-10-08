-- =====================================================
-- ADD RLS POLICIES FOR TABLES MISSING THEM
-- This script adds comprehensive RLS policies for all
-- tables that were created in later migrations
-- =====================================================

-- ============================================
-- MAINTENANCE SCHEDULES POLICIES
-- ============================================
drop policy if exists "Users can view own maintenance schedules" on public.maintenance_schedules;
drop policy if exists "Users can insert own maintenance schedules" on public.maintenance_schedules;
drop policy if exists "Users can update own maintenance schedules" on public.maintenance_schedules;
drop policy if exists "Users can delete own maintenance schedules" on public.maintenance_schedules;

create policy "Users can view own maintenance schedules"
  on public.maintenance_schedules for select
  using (
    exists (
      select 1 from public.firearms
      where firearms.id = maintenance_schedules.firearm_id
      and firearms.user_id = auth.uid()
    )
  );

create policy "Users can insert own maintenance schedules"
  on public.maintenance_schedules for insert
  with check (
    exists (
      select 1 from public.firearms
      where firearms.id = maintenance_schedules.firearm_id
      and firearms.user_id = auth.uid()
    )
  );

create policy "Users can update own maintenance schedules"
  on public.maintenance_schedules for update
  using (
    exists (
      select 1 from public.firearms
      where firearms.id = maintenance_schedules.firearm_id
      and firearms.user_id = auth.uid()
    )
  );

create policy "Users can delete own maintenance schedules"
  on public.maintenance_schedules for delete
  using (
    exists (
      select 1 from public.firearms
      where firearms.id = maintenance_schedules.firearm_id
      and firearms.user_id = auth.uid()
    )
  );

-- ============================================
-- MAINTENANCE HISTORY POLICIES
-- ============================================
drop policy if exists "Users can view own maintenance history" on public.maintenance_history;
drop policy if exists "Users can insert own maintenance history" on public.maintenance_history;
drop policy if exists "Users can update own maintenance history" on public.maintenance_history;
drop policy if exists "Users can delete own maintenance history" on public.maintenance_history;

create policy "Users can view own maintenance history"
  on public.maintenance_history for select
  using (
    exists (
      select 1 from public.firearms
      where firearms.id = maintenance_history.firearm_id
      and firearms.user_id = auth.uid()
    )
  );

create policy "Users can insert own maintenance history"
  on public.maintenance_history for insert
  with check (
    exists (
      select 1 from public.firearms
      where firearms.id = maintenance_history.firearm_id
      and firearms.user_id = auth.uid()
    )
  );

create policy "Users can update own maintenance history"
  on public.maintenance_history for update
  using (
    exists (
      select 1 from public.firearms
      where firearms.id = maintenance_history.firearm_id
      and firearms.user_id = auth.uid()
    )
  );

create policy "Users can delete own maintenance history"
  on public.maintenance_history for delete
  using (
    exists (
      select 1 from public.firearms
      where firearms.id = maintenance_history.firearm_id
      and firearms.user_id = auth.uid()
    )
  );

-- ============================================
-- RELOADING SESSIONS POLICIES
-- ============================================
drop policy if exists "Users can view own reloading sessions" on public.reloading_sessions;
drop policy if exists "Users can insert own reloading sessions" on public.reloading_sessions;
drop policy if exists "Users can update own reloading sessions" on public.reloading_sessions;
drop policy if exists "Users can delete own reloading sessions" on public.reloading_sessions;

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

-- ============================================
-- AMMUNITION BATCHES POLICIES
-- ============================================
drop policy if exists "Users can view own ammunition batches" on public.ammunition_batches;
drop policy if exists "Users can insert own ammunition batches" on public.ammunition_batches;
drop policy if exists "Users can update own ammunition batches" on public.ammunition_batches;
drop policy if exists "Users can delete own ammunition batches" on public.ammunition_batches;

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

-- ============================================
-- USER TRACKING PREFERENCES POLICIES
-- ============================================
drop policy if exists "Users can view own tracking preferences" on public.user_tracking_preferences;
drop policy if exists "Users can insert own tracking preferences" on public.user_tracking_preferences;
drop policy if exists "Users can update own tracking preferences" on public.user_tracking_preferences;
drop policy if exists "Users can delete own tracking preferences" on public.user_tracking_preferences;

create policy "Users can view own tracking preferences"
  on public.user_tracking_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own tracking preferences"
  on public.user_tracking_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tracking preferences"
  on public.user_tracking_preferences for update
  using (auth.uid() = user_id);

create policy "Users can delete own tracking preferences"
  on public.user_tracking_preferences for delete
  using (auth.uid() = user_id);

-- ============================================
-- ROLES POLICIES (Read-only for all users)
-- ============================================
drop policy if exists "Anyone can view roles" on public.roles;

create policy "Anyone can view roles"
  on public.roles for select
  to authenticated
  using (true);

-- ============================================
-- USER ROLES POLICIES
-- ============================================
drop policy if exists "Users can view own roles" on public.user_roles;
drop policy if exists "Admins can view all user roles" on public.user_roles;
drop policy if exists "Admins can insert user roles" on public.user_roles;
drop policy if exists "Admins can update user roles" on public.user_roles;
drop policy if exists "Admins can delete user roles" on public.user_roles;

-- Users can view their own roles
create policy "Users can view own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- Admins can manage all user roles
create policy "Admins can view all user roles"
  on public.user_roles for select
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
      and (ur.expires_at is null or ur.expires_at > now())
    )
  );

create policy "Admins can insert user roles"
  on public.user_roles for insert
  with check (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
      and (ur.expires_at is null or ur.expires_at > now())
    )
  );

create policy "Admins can update user roles"
  on public.user_roles for update
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
      and (ur.expires_at is null or ur.expires_at > now())
    )
  );

create policy "Admins can delete user roles"
  on public.user_roles for delete
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
      and (ur.expires_at is null or ur.expires_at > now())
    )
  );

-- ============================================
-- ROLE AUDIT LOG POLICIES
-- ============================================
drop policy if exists "Users can view own role audit log" on public.role_audit_log;
drop policy if exists "Admins can view all role audit logs" on public.role_audit_log;

-- Users can view their own role changes
create policy "Users can view own role audit log"
  on public.role_audit_log for select
  using (auth.uid() = user_id);

-- Admins can view all role audit logs
create policy "Admins can view all role audit logs"
  on public.role_audit_log for select
  using (
    exists (
      select 1 from public.user_roles ur
      join public.roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()
      and r.name = 'admin'
      and (ur.expires_at is null or ur.expires_at > now())
    )
  );

-- Note: Only the system should insert into role_audit_log via triggers
-- No insert/update/delete policies needed for regular users

-- ============================================
-- VERIFICATION
-- ============================================
do $$
declare
  pol record;
begin
  raise notice 'RLS Policies Summary:';
  for pol in 
    select schemaname, tablename, count(*) as policy_count
    from pg_policies 
    where schemaname = 'public'
    group by schemaname, tablename
    order by tablename
  loop
    raise notice '  % - % policies', pol.tablename, pol.policy_count;
  end loop;
end $$;
