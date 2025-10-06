-- Add powder-specific fields to components table
ALTER TABLE components
ADD COLUMN powder_category TEXT CHECK (powder_category IN ('Pistol', 'Rifle', 'Shotgun')),
ADD COLUMN powder_type TEXT CHECK (powder_type IN (
  'Black powder (granulated)',
  'Black powder substitute (e.g., Pyrodex)',
  'Smokeless — Single-base',
  'Smokeless — Double-base',
  'Smokeless — Triple-base',
  'Ball (spherical)',
  'Flake (flattened)',
  'Extruded / Stick / Tubular (cylindrical)',
  'Coated (surface-coated powders)',
  'Reduced / Progressive (temperature-sensitive burn rate powders)',
  'Pelletized (muzzleloader pellets)',
  'Composite / Nitrocellulose blends'
)),
ADD COLUMN weight_unit TEXT CHECK (weight_unit IN ('lb', 'g'));

-- Add comment explaining the fields
COMMENT ON COLUMN components.powder_category IS 'Category of powder: Pistol, Rifle, or Shotgun';
COMMENT ON COLUMN components.powder_type IS 'Type of powder composition and form';
COMMENT ON COLUMN components.weight_unit IS 'Unit for powder weight: lb (pounds) or g (grams)';
