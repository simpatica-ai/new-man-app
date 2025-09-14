-- Create error_logs table for monitoring application errors
CREATE TABLE IF NOT EXISTS error_logs (
  id SERIAL PRIMARY KEY,
  error_message TEXT NOT NULL,
  error_code VARCHAR(50),
  context VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_agent TEXT,
  url TEXT,
  stack_trace TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_context ON error_logs(context);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);

-- Create RPC function for error summary
CREATE OR REPLACE FUNCTION get_error_summary(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  context VARCHAR(100),
  error_code VARCHAR(50),
  error_message TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.context,
    el.error_code,
    el.error_message,
    COUNT(*) as count
  FROM error_logs el
  WHERE el.created_at >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY el.context, el.error_code, el.error_message
  ORDER BY count DESC, el.context;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin can view all error logs" ON error_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create policy for system to insert error logs
CREATE POLICY "System can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);
