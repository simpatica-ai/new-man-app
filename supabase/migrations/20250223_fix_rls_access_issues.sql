-- Fix RLS access issues causing 500 errors on login
-- The RLS policies may be too restrictive, preventing legitimate user access

-- Check current RLS policies on profiles table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE 'Current RLS policies on profiles table:';
    FOR policy_record IN
        SELECT policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
        ORDER BY policyname
    LOOP
        RAISE NOTICE 'Policy: % | Command: % | Permissive: %', 
            policy_record.policyname, 
            policy_record.cmd, 
            policy_record.permissive;
    END LOOP;
END $$;

-- Fix profiles table access - ensure users can read their own profiles
-- Drop existing policies and recreate them properly
DROP POLICY IF EXISTS "profiles_access_policy" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users basic profile access" ON profiles;

-- Create a more permissive policy for profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (
        auth.uid() = id
    );

CREATE POLICY "Users can update own profile" ON profiles  
    FOR UPDATE USING (
        auth.uid() = id
    ) WITH CHECK (
        auth.uid() = id
    );

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id
    );

-- Admin access policy
CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR 'admin' = ANY(p.roles))
        )
    );

-- Fix user_activity_sessions table access
-- Drop existing policies and recreate them properly
DROP POLICY IF EXISTS "activity_sessions_access_policy" ON user_activity_sessions;
DROP POLICY IF EXISTS "Users can manage own activity sessions" ON user_activity_sessions;
DROP POLICY IF EXISTS "Admins can view all activity sessions" ON user_activity_sessions;
DROP POLICY IF EXISTS "Service role can manage activity sessions" ON user_activity_sessions;

-- Create proper policies for user_activity_sessions
CREATE POLICY "Users can manage own activity sessions" ON user_activity_sessions
    FOR ALL USING (
        auth.uid() = user_id
    ) WITH CHECK (
        auth.uid() = user_id
    );

-- Admin access to activity sessions
CREATE POLICY "Admins can view all activity sessions" ON user_activity_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR 'admin' = ANY(p.roles))
        )
    );

-- Service role access (for server-side operations)
CREATE POLICY "Service role can manage activity sessions" ON user_activity_sessions
    FOR ALL USING (
        current_setting('role') = 'service_role'
    );

-- Ensure RLS is enabled but not overly restrictive
-- Remove the overly broad authenticated user policy that might cause conflicts
-- CREATE POLICY "Authenticated users basic profile access" ON profiles
--     FOR SELECT USING (
--         auth.role() = 'authenticated'
--         AND (
--             -- Users can see their own profile
--             auth.uid() = id
--             -- Or profiles that are public/visible (add conditions as needed)
--             OR true  -- This might be too permissive - adjust based on your needs
--         )
--     );

-- Verification and debugging
DO $$
BEGIN
    RAISE NOTICE 'RLS Access Fix Applied';
    RAISE NOTICE '========================';
    RAISE NOTICE 'Fixed policies for:';
    RAISE NOTICE '- profiles table: Users can access own profiles, admins can access all';
    RAISE NOTICE '- user_activity_sessions: Users can manage own sessions, admins can view all';
    RAISE NOTICE '';
    RAISE NOTICE 'If 500 errors persist, check:';
    RAISE NOTICE '1. User exists in profiles table';
    RAISE NOTICE '2. auth.uid() is returning correct value';
    RAISE NOTICE '3. RLS policies are not conflicting';
END $$;