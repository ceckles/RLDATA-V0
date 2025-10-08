-- ============================================================================
-- TASK 4.4: ADD MISSING updated_at COLUMNS
-- ============================================================================
-- Add updated_at to tables that are missing it
-- ============================================================================

-- Add updated_at to maintenance_logs
ALTER TABLE public.maintenance_logs 
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT NOW();

-- Add updated_at to shot_data
ALTER TABLE public.shot_data 
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT NOW();

-- Add triggers
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.maintenance_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.shot_data
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

RAISE NOTICE 'Added updated_at columns and triggers to maintenance_logs and shot_data';
