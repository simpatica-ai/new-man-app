-- Add sponsor access policies to the clean RLS setup
-- This builds on the emergency fix to add sponsor functionality back

-- First, check what sponsor relationship tables exist
DO $$
DECLARE
    has_sponsor_connections boolean := false;
    has_sponsor_relationships boolean := false;
BEGIN
    -- Check for sponsor_connections table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sponsor_connections'
    ) INTO has_sponsor_connections;
    
    -- Check for sponsor_relationships table  
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sponsor_relationships'
    ) INTO has_sponsor_relationships;
    
    RAISE NOTICE 'Sponsor table availability:';
    RAISE NOTICE '- sponsor_connections: %', has_sponsor_connections;
    RAISE NOTICE '- sponsor_relationships: %', has_sponsor_relationships;
END $$;

-- Add sponsor access to profiles table
CREATE POLICY "sponsors_can_view_practitioner_profiles" ON profiles
    FOR SELECT USING (
        -- Sponsor access via sponsor_connections
        EXISTS (
            SELECT 1 FROM sponsor_connections sc
            WHERE sc.sponsor_user_id = auth.uid()
            AND sc.practitioner_user_id = profiles.id
            AND sc.status = 'active'
        )
        OR
        -- Sponsor access via sponsor_relationships (fallback)
        EXISTS (
            SELECT 1 FROM sponsor_relationships sr
            WHERE sr.sponsor_id = auth.uid()
            AND sr.practitioner_id = profiles.id
            AND sr.status = 'active'
        )
    );

-- Add sponsor access to user_activity_sessions
CREATE POLICY "sponsors_can_view_practitioner_activity" ON user_activity_sessions
    FOR SELECT USING (
        -- Sponsor access via sponsor_connections
        EXISTS (
            SELECT 1 FROM sponsor_connections sc
            WHERE sc.sponsor_user_id = auth.uid()
            AND sc.practitioner_user_id = user_activity_sessions.user_id
            AND sc.status = 'active'
        )
        OR
        -- Sponsor access via sponsor_relationships (fallback)
        EXISTS (
            SELECT 1 FROM sponsor_relationships sr
            WHERE sr.sponsor_id = auth.uid()
            AND sr.practitioner_id = user_activity_sessions.user_id
            AND sr.status = 'active'
        )
    );

-- Add sponsor access to other key tables if they have RLS enabled
DO $$
DECLARE
    table_has_rls boolean;
BEGIN
    -- Check and add sponsor access to user_virtue_stage_memos
    SELECT c.relrowsecurity INTO table_has_rls
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'user_virtue_stage_memos';
    
    IF table_has_rls THEN
        -- Add sponsor access policy for memos
        CREATE POLICY "sponsors_can_view_practitioner_memos" ON user_virtue_stage_memos
            FOR SELECT USING (
                -- Sponsor access via sponsor_connections
                EXISTS (
                    SELECT 1 FROM sponsor_connections sc
                    WHERE sc.sponsor_user_id = auth.uid()
                    AND sc.practitioner_user_id = user_virtue_stage_memos.user_id
                    AND sc.status = 'active'
                )
                OR
                -- Sponsor access via sponsor_relationships (fallback)
                EXISTS (
                    SELECT 1 FROM sponsor_relationships sr
                    WHERE sr.sponsor_id = auth.uid()
                    AND sr.practitioner_id = user_virtue_stage_memos.user_id
                    AND sr.status = 'active'
                )
            );
        RAISE NOTICE 'Added sponsor access to user_virtue_stage_memos';
    END IF;
    
    -- Check and add sponsor access to user_virtue_stage_progress
    SELECT c.relrowsecurity INTO table_has_rls
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'user_virtue_stage_progress';
    
    IF table_has_rls THEN
        -- Add sponsor access policy for progress
        CREATE POLICY "sponsors_can_view_practitioner_progress" ON user_virtue_stage_progress
            FOR SELECT USING (
                -- Sponsor access via sponsor_connections
                EXISTS (
                    SELECT 1 FROM sponsor_connections sc
                    WHERE sc.sponsor_user_id = auth.uid()
                    AND sc.practitioner_user_id = user_virtue_stage_progress.user_id
                    AND sc.status = 'active'
                )
                OR
                -- Sponsor access via sponsor_relationships (fallback)
                EXISTS (
                    SELECT 1 FROM sponsor_relationships sr
                    WHERE sr.sponsor_id = auth.uid()
                    AND sr.practitioner_id = user_virtue_stage_progress.user_id
                    AND sr.status = 'active'
                )
            );
        RAISE NOTICE 'Added sponsor access to user_virtue_stage_progress';
    END IF;
    
    -- Check and add sponsor access to user_assessments
    SELECT c.relrowsecurity INTO table_has_rls
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'user_assessments';
    
    IF table_has_rls THEN
        -- Add sponsor access policy for assessments
        CREATE POLICY "sponsors_can_view_practitioner_assessments" ON user_assessments
            FOR SELECT USING (
                -- Sponsor access via sponsor_connections
                EXISTS (
                    SELECT 1 FROM sponsor_connections sc
                    WHERE sc.sponsor_user_id = auth.uid()
                    AND sc.practitioner_user_id = user_assessments.user_id
                    AND sc.status = 'active'
                )
                OR
                -- Sponsor access via sponsor_relationships (fallback)
                EXISTS (
                    SELECT 1 FROM sponsor_relationships sr
                    WHERE sr.sponsor_id = auth.uid()
                    AND sr.practitioner_id = user_assessments.user_id
                    AND sr.status = 'active'
                )
            );
        RAISE NOTICE 'Added sponsor access to user_assessments';
    END IF;
    
    -- Check and add sponsor access to user_assessment_results
    SELECT c.relrowsecurity INTO table_has_rls
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'user_assessment_results';
    
    IF table_has_rls THEN
        -- Add sponsor access policy for assessment results
        CREATE POLICY "sponsors_can_view_practitioner_assessment_results" ON user_assessment_results
            FOR SELECT USING (
                -- Sponsor access via sponsor_connections
                EXISTS (
                    SELECT 1 FROM sponsor_connections sc
                    WHERE sc.sponsor_user_id = auth.uid()
                    AND sc.practitioner_user_id = user_assessment_results.user_id
                    AND sc.status = 'active'
                )
                OR
                -- Sponsor access via sponsor_relationships (fallback)
                EXISTS (
                    SELECT 1 FROM sponsor_relationships sr
                    WHERE sr.sponsor_id = auth.uid()
                    AND sr.practitioner_id = user_assessment_results.user_id
                    AND sr.status = 'active'
                )
            );
        RAISE NOTICE 'Added sponsor access to user_assessment_results';
    END IF;
    
END $$;

-- Verification
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SPONSOR ACCESS POLICIES ADDED ===';
    RAISE NOTICE 'Sponsors can now view their practitioners data in:';
    RAISE NOTICE '✅ profiles (basic profile information)';
    RAISE NOTICE '✅ user_activity_sessions (activity tracking)';
    RAISE NOTICE '✅ user_virtue_stage_memos (journal entries) - if RLS enabled';
    RAISE NOTICE '✅ user_virtue_stage_progress (virtue progress) - if RLS enabled';
    RAISE NOTICE '✅ user_assessments (assessment data) - if RLS enabled';
    RAISE NOTICE '✅ user_assessment_results (assessment results) - if RLS enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'Access granted through:';
    RAISE NOTICE '- sponsor_connections (sponsor_user_id -> practitioner_user_id)';
    RAISE NOTICE '- sponsor_relationships (sponsor_id -> practitioner_id)';
    RAISE NOTICE '';
    RAISE NOTICE 'All policies require status = active for security';
    RAISE NOTICE 'Existing user and admin access preserved';
END $$;