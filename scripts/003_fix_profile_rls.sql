-- Add RLS policy to allow users to insert their own profile
-- This is needed as a fallback when the trigger doesn't create the profile
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);
