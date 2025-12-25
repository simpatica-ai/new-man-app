-- Add organizational access policies for coaches, therapists, and org_admins
-- Based on practitioner_assignments table structure

-- Add organizational access to profiles table
CREATE POLICY "supervisors_can_view_assigned_practitioner_profiles" ON profiles
    FOR SELECT USING (
        -- Only apply organizational logic if auth.uid() is available
        CASE 
            WHEN auth.uid() IS NOT NULL THEN
                EXISTS (
                    SELECT 1 FROM practitioner_assignments pa
                    WHERE pa.supervisor_id = auth.uid()
                    AND pa.practitioner_id = profiles.id
                    AND pa.active = true
                    AND pa.supervisor_role IN ('coach', 'therapist', 'org_admin')
                )
            ELSE false
        END
    );

-- Add organizational access to user_activity_sessions
CREATE POLICY "supervisors_can_view_assigned_practitioner_activity" ON user_activity_sessions
    FOR SELECT USING (
        -- Only apply organizational logic if auth.uid() is available
        CASE 
            WHEN auth.uid() IS NOT NULL THEN
                EXISTS (
                    SELECT 1 FROM practitioner_assignments pa
                    WHERE pa.supervisor_id = auth.uid()
                    AND pa.practitioner_id = user_activity_sessions.user_id
                    AND pa.active = true
                    AND pa.supervisor_role IN ('coach', 'therapist', 'org_admin')
                )
            ELSE false
        END
    );

-- Add organizational access to user_virtue_stage_memos (safe version)
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
        CREATE POLICY "supervisors_can_view_assigned_practitioner_memos" ON user_virtue_stage_memos
            FOR SELECT USING (
                -- Only apply organizational logic if auth.uid() is available
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN
                        EXISTS (
                            SELECT 1 FROM practitioner_assignments pa
                            WHERE pa.supervisor_id = auth.uid()
                            AND pa.practitioner_id = user_virtue_stage_memos.user_id
                            AND pa.active = true
                            AND pa.supervisor_role IN ('coach', 'therapist', 'org_admin')
                        )
                    ELSE false
                END
            );
        RAISE NOTICE 'Added organizational access to user_virtue_stage_memos';
    END IF;
END $$;

-- Add organizational access to user_virtue_stage_progress (safe version)
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
        CREATE POLICY "supervisors_can_view_assigned_practitioner_progress" ON user_virtue_stage_progress
            FOR SELECT USING (
                -- Only apply organizational logic if auth.uid() is available
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN
                        EXISTS (
                            SELECT 1 FROM practitioner_assignments pa
                            WHERE pa.supervisor_id = auth.uid()
                            AND pa.practitioner_id = user_virtue_stage_progress.user_id
                            AND pa.active = true
                            AND pa.supervisor_role IN ('coach', 'therapist', 'org_admin')
                        )
                    ELSE false
                END
            );
        RAISE NOTICE 'Added organizational access to user_virtue_stage_progress';
    END IF;
END $$;

-- Add organizational access to user_assessments (safe version)
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
        CREATE POLICY "supervisors_can_view_assigned_practitioner_assessments" ON user_assessments
            FOR SELECT USING (
                -- Only apply organizational logic if auth.uid() is available
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN
                        EXISTS (
                            SELECT 1 FROM practitioner_assignments pa
                            WHERE pa.supervisor_id = auth.uid()
                            AND pa.practitioner_id = user_assessments.user_id
                            AND pa.active = true
                            AND pa.supervisor_role IN ('coach', 'therapist', 'org_admin')
                        )
                    ELSE false
                END
            );
        RAISE NOTICE 'Added organizational access to user_assessments';
    END IF;
END $$;

-- Add organizational access to user_assessment_results (safe version)
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
        CREATE POLICY "supervisors_can_view_assigned_practitioner_assessment_results" ON user_assessment_results
            FOR SELECT USING (
                -- Only apply organizational logic if auth.uid() is available
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN
                        EXISTS (
                            SELECT 1 FROM practitioner_assignments pa
                            WHERE pa.supervisor_id = auth.uid()
                            AND pa.practitioner_id = user_assessment_results.user_id
                            AND pa.active = true
                            AND pa.supervisor_role IN ('coach', 'therapist', 'org_admin')
                        )
                    ELSE false
                END
            );
        RAISE NOTICE 'Added organizational access to user_assessment_results';
    END IF;
END $$;

-- Add organizational access for org_admins to see ALL practitioners in their organization
-- This gives org_admins broader access than individual coaches/therapists
CREATE POLICY "org_admins_can_view_all_org_practitioner_profiles" ON profiles
    FOR SELECT USING (
        -- Only apply organizational logic if auth.uid() is available
        CASE 
            WHEN auth.uid() IS NOT NULL THEN
                EXISTS (
                    SELECT 1 FROM practitioner_assignments pa1
                    JOIN practitioner_assignments pa2 ON pa1.organization_id = pa2.organization_id
                    WHERE pa1.supervisor_id = auth.uid()
                    AND pa1.supervisor_role = 'org_admin'
                    AND pa1.active = true
                    AND pa2.practitioner_id = profiles.id
                    AND pa2.active = true
                )
            ELSE false
        END
    );

-- Verification
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== ORGANIZATIONAL ACCESS POLICIES ADDED ===';
    RAISE NOTICE 'Supervisors can now view their assigned practitioners data in:';
    RAISE NOTICE '✅ profiles (basic profile information)';
    RAISE NOTICE '✅ user_activity_sessions (activity tracking)';
    RAISE NOTICE '✅ user_virtue_stage_memos (journal entries) - if RLS enabled';
    RAISE NOTICE '✅ user_virtue_stage_progress (virtue progress) - if RLS enabled';
    RAISE NOTICE '✅ user_assessments (assessment data) - if RLS enabled';
    RAISE NOTICE '✅ user_assessment_results (assessment results) - if RLS enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'Access granted through practitioner_assignments table:';
    RAISE NOTICE '- supervisor_id (coach/therapist/org_admin) -> practitioner_id';
    RAISE NOTICE '- Requires active = true and valid supervisor_role';
    RAISE NOTICE '- Org_admins get additional organization-wide access';
    RAISE NOTICE '';
    RAISE NOTICE 'Supported supervisor roles: coach, therapist, org_admin';
    RAISE NOTICE 'All policies are safe (handle missing auth context)';
END $$;