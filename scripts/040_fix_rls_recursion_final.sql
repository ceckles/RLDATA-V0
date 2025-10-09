-- =====================================================
-- FINAL FIX FOR INFINITE RECURSION IN RLS POLICIES
-- This script completely resolves the recursion issue
-- by using a proper SECURITY DEFINER function
-- =====================================================

-- Step 1: Drop ALL conflicting policies
DROP POLICY IF EXISTS "Admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all role_audit_log" ON role_audit_log;

-- Step 2: Drop and recreate the is_admin function with proper RLS bypass
DROP FUNCTION IF EXISTS is_admin(UUID);

-- Create function that bypasses RLS by using direct table access
CREATE OR REPLACE FUNCTION is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  -- Directly query without RLS by using SECURITY DEFINER
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = check_user_id
      AND r.name = 'admin'
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) INTO is_admin_user;
  
  RETURN COALESCE(is_admin_user, FALSE);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin(UUID) TO authenticated;

-- Step 3: Create new policies using the function (these won't recurse)

-- Profiles: Admins can view and update all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- User_roles: Admins can manage all role assignments
CREATE POLICY "Admins can view all user_roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert user_roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update user_roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete user_roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Role_audit_log: Admins can view all audit logs
CREATE POLICY "Admins can view all role_audit_log"
  ON role_audit_log
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Step 4: Verification
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'user_roles', 'role_audit_log')
    AND policyname LIKE '%Admin%';
  
  RAISE NOTICE 'Created % admin policies', policy_count;
  
  -- List all policies
  RAISE NOTICE 'Current policies:';
  FOR policy_count IN 
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'user_roles', 'role_audit_log')
  LOOP
    RAISE NOTICE '  - %', (SELECT policyname FROM pg_policies WHERE schemaname = 'public' LIMIT 1);
  END LOOP;
END $$;
