-- ============================================================================
-- TASK 4.1: CREATE MISSING TABLE - maintenance_history
-- ============================================================================
-- This table tracks when scheduled maintenance was actually performed
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.maintenance_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  firearm_id uuid NOT NULL REFERENCES public.firearms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id uuid REFERENCES public.maintenance_schedules(id) ON DELETE SET NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cleaning', 'repair', 'modification', 'inspection', 'lubrication', 'parts_replacement', 'other')),
  completed_at timestamptz NOT NULL DEFAULT NOW(),
  round_count_at_completion integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.maintenance_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own maintenance history"
  ON public.maintenance_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own maintenance history"
  ON public.maintenance_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own maintenance history"
  ON public.maintenance_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own maintenance history"
  ON public.maintenance_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_maintenance_history_firearm_id ON public.maintenance_history(firearm_id);
CREATE INDEX idx_maintenance_history_user_id ON public.maintenance_history(user_id);
CREATE INDEX idx_maintenance_history_schedule_id ON public.maintenance_history(schedule_id);
CREATE INDEX idx_maintenance_history_completed_at ON public.maintenance_history(completed_at DESC);

-- Add updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.maintenance_history
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Migrate existing maintenance_logs to maintenance_history
INSERT INTO public.maintenance_history (
  firearm_id,
  user_id,
  schedule_id,
  name,
  type,
  completed_at,
  round_count_at_completion,
  notes,
  created_at
)
SELECT 
  firearm_id,
  user_id,
  NULL as schedule_id, -- maintenance_logs don't reference schedules
  CONCAT(type, ' - ', LEFT(description, 50)) as name,
  type,
  date::timestamptz as completed_at,
  NULL as round_count_at_completion,
  description as notes,
  created_at
FROM public.maintenance_logs
ON CONFLICT DO NOTHING;

RAISE NOTICE 'maintenance_history table created and populated from maintenance_logs';
