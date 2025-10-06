-- Add primer_type column to components table
ALTER TABLE public.components
ADD COLUMN primer_type TEXT;

-- Add check constraint for primer_type values
ALTER TABLE public.components
ADD CONSTRAINT check_primer_type 
CHECK (
  type != 'primer' OR 
  primer_type IN (
    'Small Pistol (SP)',
    'Large Pistol (LP)',
    'Small Pistol Magnum (SPM)',
    'Large Pistol Magnum (LPM)',
    'Small Rifle (SR)',
    'Large Rifle (LR)',
    'Small Rifle Magnum (SRM)',
    'Large Rifle Magnum (LRM)',
    '209 Shotshell',
    'Boxer',
    'Berdan',
    'Match'
  )
);
