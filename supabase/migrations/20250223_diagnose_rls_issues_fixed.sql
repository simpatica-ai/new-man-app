-- Diagnose RLS issues with correct PostgreSQL system catalog queries
-- This fixes the column reference errors in the previous diagnostic

DO $$
DECLARE
    table_record RECORD;
    policy_record RECORD;
    user_test_record RECORD;
BEGIN
    RAISE NOTICE '=== RLS DIAGNOSTIC REPORT ===';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE '';
    
    -- 1. Check RLS status on key tables (using correct system catalogs)
    RAISE NOTICE '1. RLS STATUS ON KEY TABLES:';
    RAISE NOTICE '================================';
    
    FOR table_record IN
        SELECT 
            n.nspname as schema_name,
            c.relname as table_name,
            c.relrowsecurity as rls_enabled,
            c.relforcerowsecurity as rls_forced
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND c.relname IN ('profiles', 'user_activity_sessions', 'user_virtue_stage_memos', 
                         'user_virtue_stage_progress', 'user_assessments', 'user_assessment_results')
        AND c.relkind = 'r'  -- Only regular tables
        ORDER BY c.relname
    LOOP
        RAISE NOTICE 'Table: %.% | RLS Enabled: % | RLS Forced: %', 
            table_record.schema_name, 
            table_record.table_name, 
            table_record.rls_enabled,
            table_record.rls_forced;
    END LOOP;
    
    RAISE NOTICE '';
    
    -- 2. Check policies on each table
    RAISE NOTICE '2. RLS POLICIES:';
    RAISE NOTICE '================';
    
    FOR policy_record IN
        SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual IS NOT NULL as has_using_clause,
            with_check IS NOT NULL as has_with_check_clause
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'user_activity_sessions', 'user_virtue_stage_memos', 
                         'user_virtue_stage_progress', 'user_assessments', 'user_assessment_results')
        ORDER BY tablename, policyname
    LOOP
        RAISE NOTICE 'Table: % | Policy: % | Command: % | Permissive: % | Roles: %', 
            policy_record.tablename,
            policy_record.policyname,
            policy_record.cmd,
            policy_record.permissive,
            array_to_string(policy_record.roles, ', ');
    END LOOP;
    
    RAISE NOTICE '';
    
    -- 3. Check current user context
    RAISE NOTICE '3. CURRENT USER CONTEXT:';
    RAISE NOTICE '=========================';
    RAISE NOTICE 'Current role: %', current_role;
    RAISE NOTICE 'Session user: %', session_user;
    RAISE NOTICE 'Current user: %', current_user;
    
    -- Try to get auth.uid() if available
    BEGIN
        RAISE NOTICE 'auth.uid(): %', auth.uid();
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'auth.uid(): ERROR - %', SQLERRM;
    END;
    
    -- Try to get auth.role() if available
    BEGIN
        RAISE NOTICE 'auth.role(): %', auth.role();
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'auth.role(): ERROR - %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    
    -- 4. Test basic table access
    RAISE NOTICE '4. TABLE ACCESS TEST:';
    RAISE NOTICE '=====================';
    
    -- Test profiles table
    BEGIN
        SELECT COUNT(*) INTO user_test_record FROM profiles LIMIT 1;
        RAISE NOTICE 'profiles table: ACCESSIBLE (can query)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'profiles table: ERROR - %', SQLERRM;
    END;
    
    -- Test user_activity_sessions table
    BEGIN
        SELECT COUNT(*) INTO user_test_record FROM user_activity_sessions LIMIT 1;
        RAISE NOTICE 'user_activity_sessions table: ACCESSIBLE (can query)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'user_activity_sessions table: ERROR - %', SQLERRM;
    END;
    
    -- Test user_virtue_stage_memos table
    BEGIN
        SELECT COUNT(*) INTO user_test_record FROM user_virtue_stage_memos LIMIT 1;
        RAISE NOTICE 'user_virtue_stage_memos table: ACCESSIBLE (can query)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'user_virtue_stage_memos table: ERROR - %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    
    -- 5. Check for conflicting policies
    RAISE NOTICE '5. POTENTIAL POLICY CONFLICTS:';
    RAISE NOTICE '===============================';
    
    FOR policy_record IN
        SELECT 
            tablename,
            COUNT(*) as policy_count,
            array_agg(policyname) as policy_names
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'user_activity_sessions')
        GROUP BY tablename
        HAVING COUNT(*) > 3  -- More than 3 policies might indicate conflicts
        ORDER BY tablename
    LOOP
        RAISE NOTICE 'Table % has % policies: %', 
            policy_record.tablename,
            policy_record.policy_count,
            array_to_string(policy_record.policy_names, ', ');
    END LOOP;
    
    RAISE NOTICE '';
    
    -- 6. Recommendations
    RAISE NOTICE '6. RECOMMENDATIONS:';
    RAISE NOTICE '===================';
    RAISE NOTICE 'If tables show as inaccessible:';
    RAISE NOTICE '1. Check that auth.uid() returns a valid UUID';
    RAISE NOTICE '2. Verify user exists in profiles table';
    RAISE NOTICE '3. Ensure RLS policies allow user access to their own data';
    RAISE NOTICE '4. Check for policy conflicts (multiple policies with different logic)';
    RAISE NOTICE '5. Consider temporarily disabling RLS for testing: ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== END DIAGNOSTIC REPORT ===';
    
END $$;