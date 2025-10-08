-- Create logs table for application logging
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  category TEXT NOT NULL, -- e.g., 'auth', 'api', 'database', 'payment', 'user_action'
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  stack_trace TEXT,
  user_agent TEXT,
  ip_address TEXT,
  path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_category ON logs(category);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_level ON logs(user_id, level);

-- Enable RLS
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own logs
CREATE POLICY "Users can view own logs"
  ON logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert logs (for server-side logging)
CREATE POLICY "Service role can insert logs"
  ON logs
  FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can read all logs (for admin purposes)
CREATE POLICY "Service role can read all logs"
  ON logs
  FOR SELECT
  USING (true);

-- Add comment
COMMENT ON TABLE logs IS 'Application logs for tracking issues, trends, and debugging';
