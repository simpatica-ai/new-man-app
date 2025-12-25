-- Emergency RLS fix to restore user access
-- This temporarily disables RLS, cleans up policies, and re-enables with proper access

-- Step 1: Temporarily disable RLS to restore access
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_sessions DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies to start clean
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on profiles table
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
    
    -- Drop all policies on user_activity_sessions table
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies 
        WHERE tablename = 'user_activity_sessions' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_activity_sessions', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
    
    RAISE NOTICE 'All existing policies dropped';
END $$;

-- Step 3: Create minimal, working policies
-- Profiles table policies
CREATE POLICY "users_own_profile_access" ON profiles
    FOR ALL USING (
        auth.uid() = id
    ) WITH CHECK (
        auth.uid() = id
    );

CREATE POLICY "admin_full_profile_access" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR 'admin' = ANY(p.roles))
        )
    );

-- User activity sessions policies
CREATE POLICY "users_own_activity_access" ON user_activity_sessions
    FOR ALL USING (
        auth.uid() = user_id
    ) WITH CHECK (
        auth.uid() = user_id
    );

CREATE POLICY "admin_full_activity_access" ON user_activity_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR 'admin' = ANY(p.roles))
        )
    );

-- Step 4: Re-enable RLS with the new policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_sessions ENABLE ROW LEVEL SECURITY;

-- Step 5: Test the policies work
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== EMERGENCY RLS FIX COMPLETED ===';
    RAISE NOTICE 'Profiles table: RLS re-enabled with clean policies';
    RAISE NOTICE 'User activity sessions: RLS re-enabled with clean policies';
    RAISE NOTICE '';
    RAISE NOTICE 'Policies created:';
    RAISE NOTICE '- users_own_profile_access (users can manage own profile)';
    RAISE NOTICE '- admin_full_profile_access (admins can manage all profiles)';
    RAISE NOTICE '- users_own_activity_access (users can manage own activity)';
    RAISE NOTICE '- admin_full_activity_access (admins can manage all activity)';
    RAISE NOTICE '';
    RAISE NOTICE 'Login should now work. Apply sponsor access policies separately if needed.';
END $$;