-- Create user_activity_sessions table for real-time user monitoring
CREATE TABLE IF NOT EXISTS user_activity_sessions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_page TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_activity_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can update their own activity" ON user_activity_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity" ON user_activity_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_last_seen ON user_activity_sessions(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_sessions(user_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_user_activity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_user_activity_sessions_updated_at ON user_activity_sessions;
CREATE TRIGGER update_user_activity_sessions_updated_at
    BEFORE UPDATE ON user_activity_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_activity_updated_at();
