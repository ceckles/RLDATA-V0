-- Assign admin role to your user
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users

DO $$
DECLARE
  v_user_id uuid;
  v_admin_role_id uuid;
BEGIN
  -- Get your user ID (replace with your actual user ID)
  -- You can find this by running: SELECT id, email FROM auth.users;
  v_user_id := '5b8d66fb-167a-4933-b83f-d2d6643ad0af'::uuid;
  
  -- Get the admin role ID
  SELECT id INTO v_admin_role_id FROM roles WHERE name = 'admin';
  
  -- Check if user already has admin role
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = v_user_id AND role_id = v_admin_role_id
  ) THEN
    -- Assign admin role
    INSERT INTO user_roles (user_id, role_id, assigned_by, assigned_at)
    VALUES (v_user_id, v_admin_role_id, v_user_id, NOW());
    
    RAISE NOTICE 'Admin role assigned successfully!';
  ELSE
    RAISE NOTICE 'User already has admin role.';
  END IF;
END $$;
