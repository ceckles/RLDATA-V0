-- Remove the problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Verify remaining policies (should only be the basic user policies)
-- Users can view own profile (SELECT)
-- Users can update own profile (UPDATE)
-- Users can insert own profile (INSERT)
