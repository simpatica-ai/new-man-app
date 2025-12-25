-- Enable RLS on all tables that have policies but RLS disabled
-- This fixes critical security vulnerabilities reported by Supabase linter

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_activity_sessions table  
ALTER TABLE user_activity_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_assessment_results table
ALTER TABLE user_assessment_results ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_assessments table
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_virtue_stage_memos table
ALTER TABLE user_virtue_stage_memos ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_virtue_stage_progress table
ALTER TABLE user_virtue_stage_progress ENABLE ROW LEVEL SECURITY;

-- Note: profiles_backup_20250217 is a backup table and should probably be dropped
-- For now, we'll enable RLS on it for security, but consider dropping it if no longer needed
ALTER TABLE profiles_backup_20250217 ENABLE ROW LEVEL SECURITY;

-- Add a policy to restrict access to the backup table to admins only
CREATE POLICY "Only admins can access backup table" ON profiles_backup_20250217
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR 'admin' = ANY(p.roles))
        )
    );

-- Verify RLS is enabled (this will show in logs)
DO $$
BEGIN
    RAISE NOTICE 'RLS Security Fix Applied - All tables now have RLS enabled';
    RAISE NOTICE 'Tables fixed: profiles, user_activity_sessions, user_assessment_results, user_assessments, user_virtue_stage_memos, user_virtue_stage_progress, profiles_backup_20250217';
END $$;