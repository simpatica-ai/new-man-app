-- Fix sponsor access to practitioner data
-- Ensure sponsors can view all relevant data for their connected practitioners

-- First, let's check what sponsor connection tables exist and their structure
DO $$
DECLARE
    table_exists boolean;
BEGIN
    -- Check if sponsor_connections table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sponsor_connections'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'sponsor_connections table exists - using for sponsor access';
    ELSE
        RAISE NOTICE 'sponsor_connections table does not exist - checking sponsor_relationships';
    END IF;
    
    -- Check if sponsor_relationships table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sponsor_relationships'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'sponsor_relationships table exists - using for sponsor access';
    ELSE
        RAISE NOTICE 'sponsor_relationships table does not exist';
    END IF;
END $$;

-- Add/Update sponsor access policies for key practitioner data tables

-- 1. Profiles table - sponsors should see their practitioners' profiles
DROP POLICY IF EXISTS "Sponsors can view practitioner profiles" ON profiles;
CREATE POLICY "Sponsors can view practitioner profiles" ON profiles
FOR SELECT USING (
    -- Sponsor can view practitioners via sponsor_connections
    EXISTS (
        SELECT 1 FROM sponsor_connections sc
        WHERE sc.sponsor_user_id = auth.uid()
        AND sc.practitioner_user_id = profiles.id
        AND sc.status = 'active'
    )
    OR
    -- Sponsor can view practitioners via sponsor_relationships (if exists)
    EXISTS (
        SELECT 1 FROM sponsor_relationships sr
        WHERE sr.sponsor_id = auth.uid()
        AND sr.practitioner_id = profiles.id
        AND sr.status = 'active'
    )
);

-- 2. User virtue stage memos - sponsors should see their practitioners' memos
-- Check if the policy already includes sponsor access, if not add it
DO $$
BEGIN
    -- Drop existing policy if it doesn't include sponsor access
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_virtue_stage_memos' 
        AND policyname = 'memo_access_policy'
    ) THEN
        DROP POLICY "memo_access_policy" ON user_virtue_stage_memos;
    END IF;
    
    -- Create comprehensive memo access policy
    CREATE POLICY "memo_access_policy" ON user_virtue_stage_memos
    FOR ALL USING (
        -- Own memos
        user_id = auth.uid()
        OR
        -- Sponsor access via sponsor_connections
        EXISTS (
            SELECT 1 FROM sponsor_connections sc
            WHERE sc.sponsor_user_id = auth.uid()
            AND sc.practitioner_user_id = user_virtue_stage_memos.user_id
            AND sc.status = 'active'
        )
        OR
        -- Sponsor access via sponsor_relationships
        EXISTS (
            SELECT 1 FROM sponsor_relationships sr
            WHERE sr.sponsor_id = auth.uid()
            AND sr.practitioner_id = user_virtue_stage_memos.user_id
            AND sr.status = 'active'
        )
        OR
        -- Admin access
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR 'admin' = ANY(p.roles))
        )
    );
    
    RAISE NOTICE 'Updated memo_access_policy with sponsor access';
END $$;

-- 3. User virtue stage progress - sponsors should see their practitioners' progress
DO $$
BEGIN
    -- Drop existing policy if it doesn't include sponsor access
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_virtue_stage_progress' 
        AND policyname = 'progress_access_policy'
    ) THEN
        DROP POLICY "progress_access_policy" ON user_virtue_stage_progress;
    END IF;
    
    -- Create comprehensive progress access policy
    CREATE POLICY "progress_access_policy" ON user_virtue_stage_progress
    FOR ALL USING (
        -- Own progress
        user_id = auth.uid()
        OR
        -- Sponsor access via sponsor_connections
        EXISTS (
            SELECT 1 FROM sponsor_connections sc
            WHERE sc.sponsor_user_id = auth.uid()
            AND sc.practitioner_user_id = user_virtue_stage_progress.user_id
            AND sc.status = 'active'
        )
        OR
        -- Sponsor access via sponsor_relationships
        EXISTS (
            SELECT 1 FROM sponsor_relationships sr
            WHERE sr.sponsor_id = auth.uid()
            AND sr.practitioner_id = user_virtue_stage_progress.user_id
            AND sr.status = 'active'
        )
        OR
        -- Admin access
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR 'admin' = ANY(p.roles))
        )
    );
    
    RAISE NOTICE 'Updated progress_access_policy with sponsor access';
END $$;

-- 4. User assessments - sponsors should see their practitioners' assessments
DO $$
BEGIN
    -- Drop existing policy if it doesn't include sponsor access
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_assessments' 
        AND policyname = 'assessment_access_policy'
    ) THEN
        DROP POLICY "assessment_access_policy" ON user_assessments;
    END IF;
    
    -- Create comprehensive assessment access policy
    CREATE POLICY "assessment_access_policy" ON user_assessments
    FOR ALL USING (
        -- Own assessments
        user_id = auth.uid()
        OR
        -- Sponsor access via sponsor_connections
        EXISTS (
            SELECT 1 FROM sponsor_connections sc
            WHERE sc.sponsor_user_id = auth.uid()
            AND sc.practitioner_user_id = user_assessments.user_id
            AND sc.status = 'active'
        )
        OR
        -- Sponsor access via sponsor_relationships
        EXISTS (
            SELECT 1 FROM sponsor_relationships sr
            WHERE sr.sponsor_id = auth.uid()
            AND sr.practitioner_id = user_assessments.user_id
            AND sr.status = 'active'
        )
        OR
        -- Admin access
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR 'admin' = ANY(p.roles))
        )
    );
    
    RAISE NOTICE 'Updated assessment_access_policy with sponsor access';
END $$;

-- 5. User assessment results - sponsors should see their practitioners' results
DO $$
BEGIN
    -- Drop existing policy if it doesn't include sponsor access
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_assessment_results' 
        AND policyname = 'assessment_results_access_policy'
    ) THEN
        DROP POLICY "assessment_results_access_policy" ON user_assessment_results;
    END IF;
    
    -- Create comprehensive assessment results access policy
    CREATE POLICY "assessment_results_access_policy" ON user_assessment_results
    FOR ALL USING (
        -- Own results
        user_id = auth.uid()
        OR
        -- Sponsor access via sponsor_connections
        EXISTS (
            SELECT 1 FROM sponsor_connections sc
            WHERE sc.sponsor_user_id = auth.uid()
            AND sc.practitioner_user_id = user_assessment_results.user_id
            AND sc.status = 'active'
        )
        OR
        -- Sponsor access via sponsor_relationships
        EXISTS (
            SELECT 1 FROM sponsor_relationships sr
            WHERE sr.sponsor_id = auth.uid()
            AND sr.practitioner_id = user_assessment_results.user_id
            AND sr.status = 'active'
        )
        OR
        -- Admin access
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR 'admin' = ANY(p.roles))
        )
    );
    
    RAISE NOTICE 'Updated assessment_results_access_policy with sponsor access';
END $$;

-- 6. User activity sessions - sponsors should see their practitioners' activity
DO $$
BEGIN
    -- Check if policy exists and create/update it
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_activity_sessions' 
        AND policyname = 'activity_sessions_access_policy'
    ) THEN
        DROP POLICY "activity_sessions_access_policy" ON user_activity_sessions;
    END IF;
    
    -- Create comprehensive activity sessions access policy
    CREATE POLICY "activity_sessions_access_policy" ON user_activity_sessions
    FOR ALL USING (
        -- Own activity
        user_id = auth.uid()
        OR
        -- Sponsor access via sponsor_connections
        EXISTS (
            SELECT 1 FROM sponsor_connections sc
            WHERE sc.sponsor_user_id = auth.uid()
            AND sc.practitioner_user_id = user_activity_sessions.user_id
            AND sc.status = 'active'
        )
        OR
        -- Sponsor access via sponsor_relationships
        EXISTS (
            SELECT 1 FROM sponsor_relationships sr
            WHERE sr.sponsor_id = auth.uid()
            AND sr.practitioner_id = user_activity_sessions.user_id
            AND sr.status = 'active'
        )
        OR
        -- Admin access
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR 'admin' = ANY(p.roles))
        )
    );
    
    RAISE NOTICE 'Updated activity_sessions_access_policy with sponsor access';
END $$;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Sponsor access policies updated successfully';
    RAISE NOTICE '=============================================';
    RAISE NOTICE 'Sponsors can now access their practitioners data in:';
    RAISE NOTICE '- profiles (basic profile information)';
    RAISE NOTICE '- user_virtue_stage_memos (journal entries)';
    RAISE NOTICE '- user_virtue_stage_progress (virtue progress)';
    RAISE NOTICE '- user_assessments (assessment data)';
    RAISE NOTICE '- user_assessment_results (assessment results)';
    RAISE NOTICE '- user_activity_sessions (activity tracking)';
    RAISE NOTICE '';
    RAISE NOTICE 'Access is granted through both:';
    RAISE NOTICE '- sponsor_connections (sponsor_user_id -> practitioner_user_id)';
    RAISE NOTICE '- sponsor_relationships (sponsor_id -> practitioner_id)';
    RAISE NOTICE '';
    RAISE NOTICE 'All policies maintain existing user and admin access';
END $$;