-- Function to increment firearm round count
create or replace function increment_firearm_round_count(
  firearm_uuid uuid,
  amount integer
)
returns void
language plpgsql
security definer
as $$
begin
  update firearms
  set round_count = round_count + amount
  where id = firearm_uuid;
end;
$$;

-- Function to decrement firearm round count
create or replace function decrement_firearm_round_count(
  firearm_uuid uuid,
  amount integer
)
returns void
language plpgsql
security definer
as $$
begin
  update firearms
  set round_count = greatest(0, round_count - amount)
  where id = firearm_uuid;
end;
$$;
