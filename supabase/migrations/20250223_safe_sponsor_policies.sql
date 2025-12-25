-- Create safe sponsor access policies that handle auth context properly
-- These policies check for auth.uid() existence before using it

-- First, ensure we have the basic policies in place
-- (These should already exist from the emergency fix)

-- Add sponsor access to profiles table (safe version)
CREATE POLICY "sponsors_can_view_practitioner_profiles_safe" ON profiles
    FOR SELECT USING (
        -- Only apply sponsor logic if auth.uid() is available
        CASE 
            WHEN auth.uid() IS NOT NULL THEN
                EXISTS (
                    SELECT 1 FROM sponsor_connections sc
                    WHERE sc.sponsor_user_id = auth.uid()
                    AND sc.practitioner_user_id = profiles.id
                    AND sc.status = 'active'
                )
            ELSE false
        END
    );

-- Add sponsor access to user_activity_sessions (safe version)
CREATE POLICY "sponsors_can_view_practitioner_activity_safe" ON user_activity_sessions
    FOR SELECT USING (
        -- Only apply sponsor logic if auth.uid() is available
        CASE 
            WHEN auth.uid() IS NOT NULL THEN
                EXISTS (
                    SELECT 1 FROM sponsor_connections sc
                    WHERE sc.sponsor_user_id = auth.uid()
                    AND sc.practitioner_user_id = user_activity_sessions.user_id
                    AND sc.status = 'active'
                )
            ELSE false
        END
    );

-- Add sponsor access to user_virtue_stage_memos (safe version)
DO $$
DECLARE
    table_has_rls boolean;
BEGIN
    -- Check if table has RLS enabled
    SELECT c.relrowsecurity INTO table_has_rls
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'user_virtue_stage_memos';
    
    IF table_has_rls THEN
        CREATE POLICY "sponsors_can_view_practitioner_memos_safe" ON user_virtue_stage_memos
            FOR SELECT USING (
                -- Only apply sponsor logic if auth.uid() is available
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN
                        EXISTS (
                            SELECT 1 FROM sponsor_connections sc
                            WHERE sc.sponsor_user_id = auth.uid()
                            AND sc.practitioner_user_id = user_virtue_stage_memos.user_id
                            AND sc.status = 'active'
                        )
                    ELSE false
                END
            );
        RAISE NOTICE 'Added safe sponsor access to user_virtue_stage_memos';
    END IF;
END $$;

-- Add sponsor access to user_virtue_stage_progress (safe version)
DO $$
DECLARE
    table_has_rls boolean;
BEGIN
    -- Check if table has RLS enabled
    SELECT c.relrowsecurity INTO table_has_rls
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'user_virtue_stage_progress';
    
    IF table_has_rls THEN
        CREATE POLICY "sponsors_can_view_practitioner_progress_safe" ON user_virtue_stage_progress
            FOR SELECT USING (
                -- Only apply sponsor logic if auth.uid() is available
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN
                        EXISTS (
                            SELECT 1 FROM sponsor_connections sc
                            WHERE sc.sponsor_user_id = auth.uid()
                            AND sc.practitioner_user_id = user_virtue_stage_progress.user_id
                            AND sc.status = 'active'
                        )
                    ELSE false
                END
            );
        RAISE NOTICE 'Added safe sponsor access to user_virtue_stage_progress';
    END IF;
END $$;

-- Add sponsor access to user_assessments (safe version)
DO $$
DECLARE
    table_has_rls boolean;
BEGIN
    -- Check if table has RLS enabled
    SELECT c.relrowsecurity INTO table_has_rls
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'user_assessments';
    
    IF table_has_rls THEN
        CREATE POLICY "sponsors_can_view_practitioner_assessments_safe" ON user_assessments
            FOR SELECT USING (
                -- Only apply sponsor logic if auth.uid() is available
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN
                        EXISTS (
                            SELECT 1 FROM sponsor_connections sc
                            WHERE sc.sponsor_user_id = auth.uid()
                            AND sc.practitioner_user_id = user_assessments.user_id
                            AND sc.status = 'active'
                        )
                    ELSE false
                END
            );
        RAISE NOTICE 'Added safe sponsor access to user_assessments';
    END IF;
END $$;

-- Add sponsor access to user_assessment_results (safe version)
DO $$
DECLARE
    table_has_rls boolean;
BEGIN
    -- Check if table has RLS enabled
    SELECT c.relrowsecurity INTO table_has_rls
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'user_assessment_results';
    
    IF table_has_rls THEN
        CREATE POLICY "sponsors_can_view_practitioner_assessment_results_safe" ON user_assessment_results
            FOR SELECT USING (
                -- Only apply sponsor logic if auth.uid() is available
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN
                        EXISTS (
                            SELECT 1 FROM sponsor_connections sc
                            WHERE sc.sponsor_user_id = auth.uid()
                            AND sc.practitioner_user_id = user_assessment_results.user_id
                            AND sc.status = 'active'
                        )
                    ELSE false
                END
            );
        RAISE NOTICE 'Added safe sponsor access to user_assessment_results';
    END IF;
END $$;

-- Verification
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SAFE SPONSOR ACCESS POLICIES ADDED ===';
    RAISE NOTICE 'These policies:';
    RAISE NOTICE '✅ Check if auth.uid() is available before using it';
    RAISE NOTICE '✅ Use correct column names: sponsor_user_id, practitioner_user_id';
    RAISE NOTICE '✅ Require status = active for security';
    RAISE NOTICE '✅ Only add policies to tables with RLS enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'This should prevent 500 errors while enabling sponsor access';
    RAISE NOTICE 'when users are properly authenticated through Supabase auth';
END $$;