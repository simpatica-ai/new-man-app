-- OPTIONAL: RLS Policy Optimization
-- This migration optimizes RLS policies by wrapping auth.uid() calls in subqueries
-- This can improve performance by reducing the number of auth.uid() calls
-- Apply this migration only if you want to optimize RLS policy performance

-- Note: This is an OPTIONAL performance optimization
-- The current policies work correctly, this just makes them more efficient

-- Example optimization pattern:
-- BEFORE: auth.uid() = user_id
-- AFTER: (SELECT auth.uid()) = user_id

-- Uncomment and modify the policies below if you want to apply these optimizations

/*
-- Example: Optimize profiles table policies
DROP POLICY IF EXISTS "profiles_access_policy" ON profiles;
CREATE POLICY "profiles_access_policy" ON profiles
    FOR ALL USING (
        id = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = (SELECT auth.uid())
            AND (p.role = 'admin' OR 'admin' = ANY(p.roles))
        )
    );

-- Example: Optimize user_assessments policies  
DROP POLICY IF EXISTS "users_view_own_assessments" ON user_assessments;
CREATE POLICY "users_view_own_assessments" ON user_assessments
    FOR SELECT USING (user_id = (SELECT auth.uid()));

-- Add similar optimizations for other policies as needed
*/

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'RLS Policy Optimization Template Created';
    RAISE NOTICE 'This migration contains commented examples for optimizing RLS policies';
    RAISE NOTICE 'Uncomment and modify the policies above to apply optimizations';
    RAISE NOTICE 'Current policies work correctly - this is purely for performance improvement';
END $$;