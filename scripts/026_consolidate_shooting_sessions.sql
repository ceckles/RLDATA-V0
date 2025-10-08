-- ============================================================================
-- TASK 4.2: CONSOLIDATE SHOOTING SESSIONS AMMUNITION REFERENCES
-- ============================================================================
-- Remove redundant load_recipe_id and reloading_session_id columns
-- Keep only ammunition_batch_id as single source of truth
-- ============================================================================

-- Step 1: Migrate data from load_recipe_id to ammunition_batch_id
-- Create ammunition batches for sessions that only have load_recipe_id
INSERT INTO public.ammunition_batches (
  user_id,
  batch_number,
  date_produced,
  caliber,
  quantity,
  quantity_remaining,
  ammunition_type,
  load_recipe_id,
  primer_id,
  powder_id,
  bullet_id,
  brass_id,
  charge_weight_grains,
  coal,
  notes
)
SELECT DISTINCT
  ss.user_id,
  CONCAT('MIGRATED-', lr.id::text) as batch_number,
  ss.date as date_produced,
  lr.caliber,
  ss.rounds_fired as quantity,
  0 as quantity_remaining, -- Already used
  'handload' as ammunition_type,
  lr.id as load_recipe_id,
  lr.primer_id,
  lr.powder_id,
  lr.bullet_id,
  lr.brass_id,
  lr.powder_weight as charge_weight_grains,
  lr.coal,
  CONCAT('Auto-migrated from load recipe: ', lr.name) as notes
FROM public.shooting_sessions ss
JOIN public.load_recipes lr ON lr.id = ss.load_recipe_id
WHERE ss.ammunition_batch_id IS NULL
  AND ss.load_recipe_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Update shooting_sessions to reference the new ammunition batches
UPDATE public.shooting_sessions ss
SET ammunition_batch_id = ab.id
FROM public.ammunition_batches ab
WHERE ss.load_recipe_id IS NOT NULL
  AND ss.ammunition_batch_id IS NULL
  AND ab.batch_number = CONCAT('MIGRATED-', ss.load_recipe_id::text)
  AND ab.user_id = ss.user_id;

-- Step 2: Drop redundant columns
ALTER TABLE public.shooting_sessions 
  DROP COLUMN IF EXISTS load_recipe_id,
  DROP COLUMN IF EXISTS reloading_session_id;

-- Drop the old index
DROP INDEX IF EXISTS public.idx_shooting_sessions_reloading_session_id;

RAISE NOTICE 'Shooting sessions consolidated to use only ammunition_batch_id';
