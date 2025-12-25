-- Rollback sponsor access policies that are causing 500 errors
-- This removes the problematic sponsor policies and restores basic access

-- Remove sponsor access policies that are causing issues
DROP POLICY IF EXISTS "sponsors_can_view_practitioner_profiles" ON profiles;
DROP POLICY IF EXISTS "sponsors_can_view_practitioner_activity" ON user_activity_sessions;
DROP POLICY IF EXISTS "sponsors_can_view_practitioner_memos" ON user_virtue_stage_memos;
DROP POLICY IF EXISTS "sponsors_can_view_practitioner_progress" ON user_virtue_stage_progress;
DROP POLICY IF EXISTS "sponsors_can_view_practitioner_assessments" ON user_assessments;
DROP POLICY IF EXISTS "sponsors_can_view_practitioner_assessment_results" ON user_assessment_results;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Sponsor access policies removed';
    RAISE NOTICE 'Basic "allow all" policies remain active';
    RAISE NOTICE 'Login should work again';
    RAISE NOTICE '';
    RAISE NOTICE 'The sponsor access queries were likely failing because:';
    RAISE NOTICE '1. sponsor_connections or sponsor_relationships tables may not exist';
    RAISE NOTICE '2. The table structure may be different than expected';
    RAISE NOTICE '3. The auth.uid() context may not be working in policy evaluation';
    RAISE NOTICE '';
    RAISE NOTICE 'Need to investigate sponsor table structure before re-adding policies';
END $$;