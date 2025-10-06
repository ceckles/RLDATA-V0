-- Add low_stock_threshold column to components table
ALTER TABLE components
ADD COLUMN low_stock_threshold DECIMAL(10, 2);

-- Set default thresholds based on component type
UPDATE components
SET low_stock_threshold = CASE
  WHEN type = 'primer' THEN 100
  WHEN type = 'powder' THEN 1
  WHEN type = 'bullet' THEN 100
  WHEN type = 'brass' THEN 50
  ELSE 0
END
WHERE low_stock_threshold IS NULL;
