-- ============================================================================
-- TASK 4.5: ADD COMPOSITE INDEXES FOR PERFORMANCE
-- ============================================================================
-- Add indexes for common query patterns
-- ============================================================================

-- Components: filter by user and type
CREATE INDEX IF NOT EXISTS idx_components_user_type 
  ON public.components(user_id, type);

-- Ammunition batches: filter by user and caliber
CREATE INDEX IF NOT EXISTS idx_ammunition_batches_user_caliber 
  ON public.ammunition_batches(user_id, caliber);

-- Shooting sessions: date range queries
CREATE INDEX IF NOT EXISTS idx_shooting_sessions_user_date 
  ON public.shooting_sessions(user_id, date DESC);

-- Maintenance schedules: active schedules per firearm
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_firearm_active 
  ON public.maintenance_schedules(firearm_id, is_active) 
  WHERE is_active = true;

-- User roles: active roles (not expired)
CREATE INDEX IF NOT EXISTS idx_user_roles_active 
  ON public.user_roles(user_id, role_id) 
  WHERE expires_at IS NULL OR expires_at > NOW();

RAISE NOTICE 'Added composite indexes for improved query performance';
