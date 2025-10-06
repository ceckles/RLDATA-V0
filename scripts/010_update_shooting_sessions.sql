-- Update shooting_sessions table to link to ammunition_batches instead of individual components
-- Add ammunition_batch_id column
ALTER TABLE public.shooting_sessions
ADD COLUMN IF NOT EXISTS ammunition_batch_id uuid REFERENCES public.ammunition_batches(id) ON DELETE SET NULL;

-- Remove old component reference columns (keep for backward compatibility but they'll be deprecated)
-- We'll keep them for now in case there's existing data

-- Update shot_data table to include pressure signs and detailed tracking
ALTER TABLE public.shot_data
ADD COLUMN IF NOT EXISTS primer_appearance text CHECK (primer_appearance IN ('normal', 'flat', 'cratered', 'pierced')),
ADD COLUMN IF NOT EXISTS case_condition text CHECK (case_condition IN ('normal', 'sticky_extraction', 'hard_bolt_lift')),
ADD COLUMN IF NOT EXISTS ejector_mark boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pressure_assessment text CHECK (pressure_assessment IN ('normal', 'mild', 'high', 'excessive'));

-- Add index for ammunition_batch_id
CREATE INDEX IF NOT EXISTS idx_shooting_sessions_ammunition_batch_id ON public.shooting_sessions(ammunition_batch_id);
