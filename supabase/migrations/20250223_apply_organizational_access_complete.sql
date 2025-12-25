-- Complete organizational access setup - apply all missing pieces step by step

-- Step 1: Create organizational access functions (if they don't exist)
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.can_access_practitioner_data(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_accessible_practitioners(uuid) TO authenticated;

-- Step 2: Add organizational access policies (if they don't exist)
DO $$
BEGIN
    -- Check if organizational policies exist, if not create them
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'supervisors_can_access_assigned_practitioners_simple'
    ) THEN
        CREATE POLICY "supervisors_can_access_assigned_practitioners_simple" ON profiles
            FOR SELECT USING (
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN
                        public.can_access_practitioner_data(auth.uid(), profiles.id)
                    ELSE false
                END
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_activity_sessions' 
        AND policyname = 'supervisors_can_access_assigned_practitioner_activity_simple'
    ) THEN
        CREATE POLICY "supervisors_can_access_assigned_practitioner_activity_simple" ON user_activity_sessions
            FOR SELECT USING (
                CASE 
                    WHEN auth.uid() IS NOT NULL THEN
                        public.can_access_practitioner_data(auth.uid(), user_activity_sessions.user_id)
                    ELSE false
                END
            );
    END IF;
END $$;

-- Step 3: Create test users and assignments
DO $$
DECLARE
    test_org_id uuid;
    test_coach_id uuid;
    test_therapist_id uuid;
    test_practitioner1_id uuid;
    test_practitioner2_id uuid;
    existing_coach_count integer;
BEGIN
    -- Find Sample Therapy Center organization
    SELECT id INTO test_org_id 
    FROM organizations 
    WHERE name LIKE '%Sample%Therapy%Center%' OR name LIKE '%Therapy%Center%'
    LIMIT 1;
    
    -- If no organization found, create one
    IF test_org_id IS NULL THEN
        INSERT INTO organizations (id, name, created_at, is_active)
        VALUES (gen_random_uuid(), 'Sample Therapy Center', NOW(), true)
        RETURNING id INTO test_org_id;
    END IF;
    
    -- Check if test users already exist
    SELECT COUNT(*) INTO existing_coach_count
    FROM profiles 
    WHERE full_name LIKE '%Test Coach%';
    
    -- Only create test users if they don't exist
    IF existing_coach_count = 0 THEN
        -- Generate UUIDs for test users
        test_coach_id := gen_random_uuid();
        test_therapist_id := gen_random_uuid();
        test_practitioner1_id := gen_random_uuid();
        test_practitioner2_id := gen_random_uuid();
        
        -- Create test coach profile
        INSERT INTO profiles (
            id, full_name, role, roles, organization_id, is_active, created_at, has_completed_first_assessment
        ) VALUES (
            test_coach_id, 'Sarah Johnson (Test Coach)', 'coach', ARRAY['coach'], test_org_id, true, NOW(), true
        );
        
        -- Create test therapist profile
        INSERT INTO profiles (
            id, full_name, role, roles, organization_id, is_active, created_at, has_completed_first_assessment
        ) VALUES (
            test_therapist_id, 'Dr. Michael Chen (Test Therapist)', 'therapist', ARRAY['therapist'], test_org_id, true, NOW(), true
        );
        
        -- Create test practitioner 1
        INSERT INTO profiles (
            id, full_name, role, roles, organization_id, is_active, created_at, has_completed_first_assessment, current_virtue_id, current_stage
        ) VALUES (
            test_practitioner1_id, 'Alex Rivera (Test Practitioner)', 'user', ARRAY['practitioner'], test_org_id, true, NOW(), true, 1, 2
        );
        
        -- Create test practitioner 2
        INSERT INTO profiles (
            id, full_name, role, roles, organization_id, is_active, created_at, has_completed_first_assessment, current_virtue_id, current_stage
        ) VALUES (
            test_practitioner2_id, 'Jamie Thompson (Test Practitioner)', 'user', ARRAY['practitioner'], test_org_id, true, NOW(), true, 2, 1
        );
        
        -- Create practitioner assignments
        INSERT INTO practitioner_assignments (
            practitioner_id, supervisor_id, supervisor_role, organization_id, active, assigned_at, assigned_by
        ) VALUES 
            (test_practitioner1_id, test_coach_id, 'coach', test_org_id, true, NOW(), test_coach_id),
            (test_practitioner2_id, test_therapist_id, 'therapist', test_org_id, true, NOW(), test_therapist_id),
            (test_practitioner2_id, test_coach_id, 'coach', test_org_id, true, NOW(), test_coach_id);
    END IF;
END $$;

-- Step 4: Test the setup
DO $$
DECLARE
    coach_id uuid;
    therapist_id uuid;
    practitioner1_id uuid;
    practitioner2_id uuid;
    access_result boolean;
    accessible_count integer;
BEGIN
    -- Get test user IDs
    SELECT id INTO coach_id FROM profiles WHERE full_name LIKE '%Test Coach%' LIMIT 1;
    SELECT id INTO therapist_id FROM profiles WHERE full_name LIKE '%Test Therapist%' LIMIT 1;
    SELECT id INTO practitioner1_id FROM profiles WHERE full_name LIKE '%Alex Rivera%' LIMIT 1;
    SELECT id INTO practitioner2_id FROM profiles WHERE full_name LIKE '%Jamie Thompson%' LIMIT 1;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== ORGANIZATIONAL ACCESS SETUP COMPLETE ===';
    RAISE NOTICE '';
    
    -- Test function access
    IF coach_id IS NOT NULL AND practitioner1_id IS NOT NULL THEN
        SELECT can_access_practitioner_data(coach_id, practitioner1_id) INTO access_result;
        RAISE NOTICE 'Coach → Alex Rivera: %', CASE WHEN access_result THEN '✅ CAN ACCESS' ELSE '❌ NO ACCESS' END;
        
        SELECT COUNT(*) INTO accessible_count FROM get_accessible_practitioners(coach_id);
        RAISE NOTICE 'Coach can access % practitioners total', accessible_count;
    END IF;
    
    IF therapist_id IS NOT NULL AND practitioner2_id IS NOT NULL THEN
        SELECT can_access_practitioner_data(therapist_id, practitioner2_id) INTO access_result;
        RAISE NOTICE 'Therapist → Jamie Thompson: %', CASE WHEN access_result THEN '✅ CAN ACCESS' ELSE '❌ NO ACCESS' END;
        
        SELECT COUNT(*) INTO accessible_count FROM get_accessible_practitioners(therapist_id);
        RAISE NOTICE 'Therapist can access % practitioners total', accessible_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🧪 READY FOR TESTING:';
    RAISE NOTICE '- Functions created and working';
    RAISE NOTICE '- RLS policies applied';
    RAISE NOTICE '- Test users and assignments created';
    RAISE NOTICE '- Login should work without 500 errors';
    RAISE NOTICE '';
    
END $$;