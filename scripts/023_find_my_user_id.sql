-- Run this first to find your user ID
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;
