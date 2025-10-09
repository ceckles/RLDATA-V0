-- Comprehensive fix for admin RLS policies
-- This script ensures admins can view all data they need

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all role_audit_log" ON role_audit_log;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id_param
      AND r.name = 'admin'
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles table: Allow admins to view and update all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- User_roles table: Allow admins to view and manage all role assignments
CREATE POLICY "Admins can view all user_roles"
  ON user_roles
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert user_roles"
  ON user_roles
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete user_roles"
  ON user_roles
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Role_audit_log table: Allow admins to view all audit logs
CREATE POLICY "Admins can view all role_audit_log"
  ON role_audit_log
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Roles table: Allow admins to view all roles
DROP POLICY IF EXISTS "Admins can view all roles" ON roles;
CREATE POLICY "Admins can view all roles"
  ON roles
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Verification query
SELECT 
  'Admin RLS policies created successfully' as status,
  COUNT(*) as admin_policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%Admin%';
