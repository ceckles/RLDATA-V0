-- ============================================================================
-- TASK 4.3: REMOVE REDUNDANT PRICING FIELD FROM COMPONENTS
-- ============================================================================
-- Consolidate price_paid into cost_per_unit
-- ============================================================================

-- Migrate price_paid data to cost_per_unit where cost_per_unit is NULL
UPDATE public.components
SET cost_per_unit = price_paid
WHERE cost_per_unit IS NULL 
  AND price_paid IS NOT NULL;

-- Drop the redundant column
ALTER TABLE public.components 
  DROP COLUMN IF EXISTS price_paid;

RAISE NOTICE 'Removed redundant price_paid column from components';
