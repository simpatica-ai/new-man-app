-- Rollback organizational access policies that are causing 500 errors
-- This removes the problematic organizational policies and restores basic access

-- Remove organizational access policies that are causing issues
DROP POLICY IF EXISTS "supervisors_can_view_assigned_practitioner_profiles" ON profiles;
DROP POLICY IF EXISTS "supervisors_can_view_assigned_practitioner_activity" ON user_activity_sessions;
DROP POLICY IF EXISTS "supervisors_can_view_assigned_practitioner_memos" ON user_virtue_stage_memos;
DROP POLICY IF EXISTS "supervisors_can_view_assigned_practitioner_progress" ON user_virtue_stage_progress;
DROP POLICY IF EXISTS "supervisors_can_view_assigned_practitioner_assessments" ON user_assessments;
DROP POLICY IF EXISTS "supervisors_can_view_assigned_practitioner_assessment_results" ON user_assessment_results;
DROP POLICY IF EXISTS "org_admins_can_view_all_org_practitioner_profiles" ON profiles;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Organizational access policies removed';
    RAISE NOTICE 'Basic "allow all" policies remain active';
    RAISE NOTICE 'Sponsor access policies should still work';
    RAISE NOTICE 'Login should work again';
    RAISE NOTICE '';
    RAISE NOTICE 'The organizational access queries were likely failing because:';
    RAISE NOTICE '1. practitioner_assignments table may have RLS restrictions';
    RAISE NOTICE '2. Complex JOIN queries in policies may be causing timeouts';
    RAISE NOTICE '3. The auth.uid() context may not be working in complex policy evaluation';
    RAISE NOTICE '';
    RAISE NOTICE 'Need to investigate practitioner_assignments table access before re-adding policies';
END $$;