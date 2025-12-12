-- Fix RLS Policy Conflicts
-- This migration resolves the conflicting RLS policies that cause 500 errors
-- Issue: Multiple overlapping policies on profiles table cause recursion and conflicts

-- Step 1: Clean up conflicting policies on profiles table
DROP POLICY IF EXISTS "Profiles can be read by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Profiles can be inserted by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Profiles can be updated by owner" ON profiles;
DROP POLICY IF EXISTS "Profiles can be deleted by owner" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view connected profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view accessible profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own, connected, or all (if admin) profiles" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Supervisors can view practitioner memos" ON user_virtue_stage_memos;
DROP POLICY IF EXISTS "Supervisors can view practitioner progress" ON user_virtue_stage_progress;
DROP POLICY IF EXISTS "Supervisors can view practitioner assessments" ON user_assessments;
DROP POLICY IF EXISTS "Supervisors can view practitioner assessment results" ON user_assessment_results;

-- Step 2: Create clean, non-conflicting policies

-- Profiles: Simple policy for own access + supervisor relationships
CREATE POLICY "profiles_access_policy" ON profiles
FOR ALL USING (
    -- Own profile
    auth.uid() = id 
    OR 
    -- Legacy sponsor system
    id IN (
        SELECT practitioner_user_id FROM sponsor_connections 
        WHERE sponsor_user_id = auth.uid() AND status = 'active'
    )
    OR
    id IN (
        SELECT sponsor_user_id FROM sponsor_connections 
        WHERE practitioner_user_id = auth.uid() AND status = 'active'
    )
    OR
    -- Organizational model: practitioner assignments
    id IN (
        SELECT practitioner_id FROM practitioner_assignments 
        WHERE supervisor_id = auth.uid() AND active = true
    )
    OR
    id IN (
        SELECT supervisor_id FROM practitioner_assignments 
        WHERE practitioner_id = auth.uid() AND active = true
    )
);

-- User virtue stage memos: Own access + supervisor access
CREATE POLICY "memo_access_policy" ON user_virtue_stage_memos
FOR ALL USING (
    -- Own memos
    auth.uid() = user_id
    OR
    -- Legacy sponsor access
    user_id IN (
        SELECT practitioner_user_id FROM sponsor_connections 
        WHERE sponsor_user_id = auth.uid() AND status = 'active'
    )
    OR
    -- Organizational model supervisor access
    user_id IN (
        SELECT practitioner_id FROM practitioner_assignments 
        WHERE supervisor_id = auth.uid() AND active = true
    )
);

-- User virtue stage progress: Own access + supervisor access
CREATE POLICY "progress_access_policy" ON user_virtue_stage_progress
FOR ALL USING (
    -- Own progress
    auth.uid() = user_id
    OR
    -- Legacy sponsor access
    user_id IN (
        SELECT practitioner_user_id FROM sponsor_connections 
        WHERE sponsor_user_id = auth.uid() AND status = 'active'
    )
    OR
    -- Organizational model supervisor access
    user_id IN (
        SELECT practitioner_id FROM practitioner_assignments 
        WHERE supervisor_id = auth.uid() AND active = true
    )
);

-- User assessments: Own access + supervisor access
CREATE POLICY "assessment_access_policy" ON user_assessments
FOR ALL USING (
    -- Own assessments
    auth.uid() = user_id
    OR
    -- Legacy sponsor access
    user_id IN (
        SELECT practitioner_user_id FROM sponsor_connections 
        WHERE sponsor_user_id = auth.uid() AND status = 'active'
    )
    OR
    -- Organizational model supervisor access
    user_id IN (
        SELECT practitioner_id FROM practitioner_assignments 
        WHERE supervisor_id = auth.uid() AND active = true
    )
);

-- User assessment results: Own access + supervisor access
CREATE POLICY "assessment_results_access_policy" ON user_assessment_results
FOR ALL USING (
    -- Own results
    auth.uid() = user_id
    OR
    -- Legacy sponsor access
    user_id IN (
        SELECT practitioner_user_id FROM sponsor_connections 
        WHERE sponsor_user_id = auth.uid() AND status = 'active'
    )
    OR
    -- Organizational model supervisor access
    user_id IN (
        SELECT practitioner_id FROM practitioner_assignments 
        WHERE supervisor_id = auth.uid() AND active = true
    )
);

-- User activity sessions: Simple own access policy
CREATE POLICY "activity_sessions_access_policy" ON user_activity_sessions
FOR ALL USING (auth.uid() = user_id);

-- Step 3: Ensure get_user_organization_id function is properly defined
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;