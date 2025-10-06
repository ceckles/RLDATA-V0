-- Fixed column name from quantity to quantity_remaining
-- Create a function to safely decrement ammunition quantity
CREATE OR REPLACE FUNCTION decrement_ammunition_quantity(
  batch_id uuid,
  amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ammunition_batches
  SET quantity_remaining = GREATEST(0, quantity_remaining - amount)
  WHERE id = batch_id
  AND user_id = auth.uid();
END;
$$;
