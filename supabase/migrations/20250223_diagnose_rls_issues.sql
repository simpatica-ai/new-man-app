-- Diagnose RLS issues causing 500 errors
-- This will help identify which policies are blocking access

-- Check current RLS status and policies
DO $$
DECLARE
    policy_record RECORD;
    table_record RECORD;
BEGIN
    RAISE NOTICE '=== RLS DIAGNOSTIC REPORT ===';
    RAISE NOTICE '';
    
    -- Check RLS status on key tables
    RAISE NOTICE 'RLS STATUS ON KEY TABLES:';
    FOR table_record IN
        SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_enabled,
            forcerowsecurity as rls_forced
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'user_activity_sessions', 'user_virtue_stage_memos', 'user_virtue_stage_progress', 'user_assessments', 'user_assessment_results')
        ORDER BY tablename
    LOOP
        RAISE NOTICE 'Table: % | RLS Enabled: % | RLS Forced: %', 
            table_record.tablename, 
            table_record.rls_enabled, 
            table_record.rls_forced;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'CURRENT RLS POLICIES:';
    
    -- Check policies on profiles table
    RAISE NOTICE '';
    RAISE NOTICE '--- PROFILES TABLE POLICIES ---';
    FOR policy_record IN
        SELECT policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
        ORDER BY policyname
    LOOP
        RAISE NOTICE 'Policy: % | Command: % | Permissive: % | Roles: %', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.permissive,
            policy_record.roles;
    END LOOP;
    
    -- Check policies on user_activity_sessions table
    RAISE NOTICE '';
    RAISE NOTICE '--- USER_ACTIVITY_SESSIONS TABLE POLICIES ---';
    FOR policy_record IN
        SELECT policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'user_activity_sessions' AND schemaname = 'public'
        ORDER BY policyname
    LOOP
        RAISE NOTICE 'Policy: % | Command: % | Permissive: % | Roles: %', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.permissive,
            policy_record.roles;
    END LOOP;
    
    -- Check if there are any conflicting policies
    RAISE NOTICE '';
    RAISE NOTICE '--- POTENTIAL POLICY CONFLICTS ---';
    FOR policy_record IN
        SELECT tablename, COUNT(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('profiles', 'user_activity_sessions')
        GROUP BY tablename
        HAVING COUNT(*) > 5  -- More than 5 policies might indicate conflicts
    LOOP
        RAISE NOTICE 'Table % has % policies (potential conflict)', 
            policy_record.tablename, 
            policy_record.policy_count;
    END LOOP;
    
END $$;

-- Test basic access patterns
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== ACCESS PATTERN TESTS ===';
    
    -- Test if we can query basic table info
    BEGIN
        PERFORM 1 FROM information_schema.tables WHERE table_name = 'profiles';
        RAISE NOTICE 'SUCCESS: Can access information_schema.tables';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Cannot access information_schema.tables: %', SQLERRM;
    END;
    
    -- Test if we can query pg_policies
    BEGIN
        PERFORM 1 FROM pg_policies WHERE tablename = 'profiles' LIMIT 1;
        RAISE NOTICE 'SUCCESS: Can access pg_policies';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Cannot access pg_policies: %', SQLERRM;
    END;
    
END $$;