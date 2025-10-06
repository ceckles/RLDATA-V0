-- Create function to increment ammunition quantity when returning rounds
CREATE OR REPLACE FUNCTION increment_ammunition_quantity(
  batch_id UUID,
  amount INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ammunition_batches
  SET quantity_remaining = quantity_remaining + amount
  WHERE id = batch_id;
END;
$$;
