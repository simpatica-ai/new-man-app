-- Create database functions for organizational access instead of complex RLS policies
-- This avoids the performance issues with complex JOIN operations in RLS

-- Function to check if a user can access a practitioner's data
CREATE OR REPLACE FUNCTION public.can_access_practitioner_data(
    supervisor_user_id uuid,
    practitioner_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Check if supervisor has access to practitioner through assignments
    RETURN EXISTS (
        SELECT 1 FROM practitioner_assignments pa
        WHERE pa.supervisor_id = supervisor_user_id
        AND pa.practitioner_id = practitioner_user_id
        AND pa.active = true
        AND pa.supervisor_role IN ('coach', 'therapist', 'org_admin')
    );
END $$;

-- Function to get all practitioners a supervisor can access
CREATE OR REPLACE FUNCTION public.get_accessible_practitioners(
    supervisor_user_id uuid
)
RETURNS TABLE(practitioner_id uuid, supervisor_role text, organization_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pa.practitioner_id,
        pa.supervisor_role,
        pa.organization_id
    FROM practitioner_assignments pa
    WHERE pa.supervisor_id = supervisor_user_id
    AND pa.active = true
    AND pa.supervisor_role IN ('coach', 'therapist', 'org_admin');
END $$;

-- Simple organizational access policy using the function
CREATE POLICY "supervisors_can_access_assigned_practitioners_simple" ON profiles
    FOR SELECT USING (
        CASE 
            WHEN auth.uid() IS NOT NULL THEN
                public.can_access_practitioner_data(auth.uid(), profiles.id)
            ELSE false
        END
    );

-- Simple organizational access for user_activity_sessions
CREATE POLICY "supervisors_can_access_assigned_practitioner_activity_simple" ON user_activity_sessions
    FOR SELECT USING (
        CASE 
            WHEN auth.uid() IS NOT NULL THEN
                public.can_access_practitioner_data(auth.uid(), user_activity_sessions.user_id)
            ELSE false
        END
    );

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.can_access_practitioner_data(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_accessible_practitioners(uuid) TO authenticated;

-- Verification
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== ORGANIZATIONAL ACCESS FUNCTIONS CREATED ===';
    RAISE NOTICE 'Created functions:';
    RAISE NOTICE '✅ can_access_practitioner_data(supervisor_id, practitioner_id)';
    RAISE NOTICE '✅ get_accessible_practitioners(supervisor_id)';
    RAISE NOTICE '';
    RAISE NOTICE 'Added simple policies using functions:';
    RAISE NOTICE '✅ supervisors_can_access_assigned_practitioners_simple';
    RAISE NOTICE '✅ supervisors_can_access_assigned_practitioner_activity_simple';
    RAISE NOTICE '';
    RAISE NOTICE 'This approach should be much more performant than complex RLS policies';
    RAISE NOTICE 'Functions handle the complex logic, policies just call the functions';
END $$;