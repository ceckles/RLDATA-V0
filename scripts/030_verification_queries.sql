-- ============================================================================
-- TASK 5: VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify all corrections were applied successfully
-- ============================================================================

-- Verify maintenance_history table exists and has data
SELECT 
  'maintenance_history' as table_name,
  COUNT(*) as row_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM public.maintenance_history;

-- Verify shooting_sessions no longer has redundant columns
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'shooting_sessions'
  AND column_name IN ('load_recipe_id', 'reloading_session_id', 'ammunition_batch_id')
ORDER BY column_name;

-- Verify components no longer has price_paid
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'components'
  AND column_name IN ('price_paid', 'cost_per_unit')
ORDER BY column_name;

-- Verify updated_at columns exist
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND column_name = 'updated_at'
  AND table_name IN ('maintenance_logs', 'shot_data', 'maintenance_history')
ORDER BY table_name;

-- Verify new indexes exist
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_components_user_type',
    'idx_ammunition_batches_user_caliber',
    'idx_shooting_sessions_user_date',
    'idx_maintenance_schedules_firearm_active',
    'idx_user_roles_active',
    'idx_maintenance_history_firearm_id',
    'idx_maintenance_history_completed_at'
  )
ORDER BY tablename, indexname;

-- Verify all foreign keys are intact
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- Count records in all main tables
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
UNION ALL
SELECT 'components', COUNT(*) FROM public.components
UNION ALL
SELECT 'firearms', COUNT(*) FROM public.firearms
UNION ALL
SELECT 'maintenance_logs', COUNT(*) FROM public.maintenance_logs
UNION ALL
SELECT 'maintenance_schedules', COUNT(*) FROM public.maintenance_schedules
UNION ALL
SELECT 'maintenance_history', COUNT(*) FROM public.maintenance_history
UNION ALL
SELECT 'load_recipes', COUNT(*) FROM public.load_recipes
UNION ALL
SELECT 'shooting_sessions', COUNT(*) FROM public.shooting_sessions
UNION ALL
SELECT 'shot_data', COUNT(*) FROM public.shot_data
UNION ALL
SELECT 'ammunition_batches', COUNT(*) FROM public.ammunition_batches
UNION ALL
SELECT 'reloading_sessions', COUNT(*) FROM public.reloading_sessions
UNION ALL
SELECT 'user_tracking_preferences', COUNT(*) FROM public.user_tracking_preferences
UNION ALL
SELECT 'roles', COUNT(*) FROM public.roles
UNION ALL
SELECT 'user_roles', COUNT(*) FROM public.user_roles
UNION ALL
SELECT 'role_audit_log', COUNT(*) FROM public.role_audit_log
ORDER BY table_name;
