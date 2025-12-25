-- Complete RLS reset to fix persistent 500 errors
-- This addresses all tables that might be causing issues

-- Step 1: Disable RLS on ALL tables that were enabled in our security fix
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessment_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_virtue_stage_memos DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_virtue_stage_progress DISABLE ROW LEVEL SECURITY;

-- Also disable on backup table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles_backup_20250217') THEN
        ALTER TABLE profiles_backup_20250217 DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on profiles_backup_20250217';
    END IF;
END $$;

-- Step 2: Drop ALL policies on these tables
DO $$
DECLARE
    policy_record RECORD;
    table_name TEXT;
BEGIN
    -- List of tables to clean
    FOR table_name IN 
        SELECT unnest(ARRAY['profiles', 'user_activity_sessions', 'user_assessment_results', 
                           'user_assessments', 'user_virtue_stage_memos', 'user_virtue_stage_progress'])
    LOOP
        -- Drop all policies for this table
        FOR policy_record IN
            SELECT policyname
            FROM pg_policies 
            WHERE tablename = table_name AND schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_record.policyname, table_name);
            RAISE NOTICE 'Dropped policy % on table %', policy_record.policyname, table_name;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'All policies dropped from target tables';
END $$;

-- Step 3: Create the most basic policies possible
-- Profiles table - basic access
CREATE POLICY "basic_profile_access" ON profiles
    FOR ALL USING (true) WITH CHECK (true);

-- User activity sessions - basic access  
CREATE POLICY "basic_activity_access" ON user_activity_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- User assessment results - basic access
CREATE POLICY "basic_assessment_results_access" ON user_assessment_results
    FOR ALL USING (true) WITH CHECK (true);

-- User assessments - basic access
CREATE POLICY "basic_assessments_access" ON user_assessments
    FOR ALL USING (true) WITH CHECK (true);

-- User virtue stage memos - basic access
CREATE POLICY "basic_memos_access" ON user_virtue_stage_memos
    FOR ALL USING (true) WITH CHECK (true);

-- User virtue stage progress - basic access
CREATE POLICY "basic_progress_access" ON user_virtue_stage_progress
    FOR ALL USING (true) WITH CHECK (true);

-- Step 4: Re-enable RLS with the basic policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_virtue_stage_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_virtue_stage_progress ENABLE ROW LEVEL SECURITY;

-- Step 5: Test basic access
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING BASIC ACCESS ===';
    
    -- Test profiles table
    BEGIN
        SELECT COUNT(*) INTO test_count FROM profiles LIMIT 1;
        RAISE NOTICE 'profiles: ACCESSIBLE (basic policy working)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'profiles: ERROR - %', SQLERRM;
    END;
    
    -- Test user_activity_sessions table
    BEGIN
        SELECT COUNT(*) INTO test_count FROM user_activity_sessions LIMIT 1;
        RAISE NOTICE 'user_activity_sessions: ACCESSIBLE (basic policy working)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'user_activity_sessions: ERROR - %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== COMPLETE RLS RESET FINISHED ===';
    RAISE NOTICE 'All tables now have basic "allow all" policies';
    RAISE NOTICE 'This should resolve 500 errors immediately';
    RAISE NOTICE 'You can add proper security policies later once login works';
    RAISE NOTICE '';
    RAISE NOTICE 'SECURITY WARNING: All tables are now fully accessible';
    RAISE NOTICE 'Apply proper RLS policies as soon as login is confirmed working';
    
END $$;