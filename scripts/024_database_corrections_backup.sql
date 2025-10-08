-- ============================================================================
-- TASK 3: BACKUP EXISTING DATA
-- ============================================================================
-- This script creates backup tables for all data that will be affected
-- by the database corrections. Run this BEFORE making any changes.
-- ============================================================================

-- Backup shooting_sessions (will be modified to remove redundant columns)
CREATE TABLE IF NOT EXISTS public.shooting_sessions_backup AS 
SELECT * FROM public.shooting_sessions;

-- Backup components (will be modified to remove price_paid)
CREATE TABLE IF NOT EXISTS public.components_backup AS 
SELECT * FROM public.components;

-- Backup maintenance_logs (will add updated_at column)
CREATE TABLE IF NOT EXISTS public.maintenance_logs_backup AS 
SELECT * FROM public.maintenance_logs;

-- Backup shot_data (will add updated_at column)
CREATE TABLE IF NOT EXISTS public.shot_data_backup AS 
SELECT * FROM public.shot_data;

-- Verify backups
DO $$
DECLARE
  shooting_sessions_count INTEGER;
  components_count INTEGER;
  maintenance_logs_count INTEGER;
  shot_data_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO shooting_sessions_count FROM public.shooting_sessions_backup;
  SELECT COUNT(*) INTO components_count FROM public.components_backup;
  SELECT COUNT(*) INTO maintenance_logs_count FROM public.maintenance_logs_backup;
  SELECT COUNT(*) INTO shot_data_count FROM public.shot_data_backup;
  
  RAISE NOTICE 'Backup complete:';
  RAISE NOTICE '  - shooting_sessions: % rows', shooting_sessions_count;
  RAISE NOTICE '  - components: % rows', components_count;
  RAISE NOTICE '  - maintenance_logs: % rows', maintenance_logs_count;
  RAISE NOTICE '  - shot_data: % rows', shot_data_count;
END $$;
