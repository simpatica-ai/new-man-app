-- Enable RLS on error_logs table
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all error logs
CREATE POLICY "Admins can view all error logs" ON error_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Policy for system to insert error logs (no user context needed)
CREATE POLICY "System can insert error logs" ON error_logs
    FOR INSERT WITH CHECK (true);
