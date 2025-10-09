-- Fix infinite recursion in user_roles RLS policies
-- The issue: duplicate policies from script 038 conflict with script 032

-- Drop the problematic policies from script 038
DROP POLICY IF EXISTS "Admins can view all user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can delete user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all role_audit_log" ON role_audit_log;
DROP POLICY IF EXISTS "Admins can view all roles" ON roles;

-- Drop the is_admin function that causes recursion
DROP FUNCTION IF EXISTS is_admin(UUID);

-- Verify the correct policies from script 032 still exist
-- These policies work because they directly query user_roles in the policy
-- without using a function, avoiding recursion

-- List all current policies on user_roles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Verify we have these policies (from script 032):
-- 1. "Users can view own roles" - FOR SELECT
-- 2. "Admins can view all user roles" - FOR SELECT  
-- 3. "Admins can insert user roles" - FOR INSERT
-- 4. "Admins can update user roles" - FOR UPDATE
-- 5. "Admins can delete user roles" - FOR DELETE
