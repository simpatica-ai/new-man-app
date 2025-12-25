-- Test the organizational access functions and verify the setup (FIXED VERSION v2)
-- This will show if coaches and therapists can access their assigned practitioners

DO $$
DECLARE
    coach_record RECORD;
    therapist_record RECORD;
    practitioner_record RECORD;
    assignment_record RECORD;
    accessible_record RECORD;
    access_result boolean;
    practitioner_name text;
    coach_id uuid;
    therapist_id uuid;
    practitioner1_id uuid;
    practitioner2_id uuid;
BEGIN
    RAISE NOTICE '=== TESTING ORGANIZATIONAL ACCESS SETUP ===';
    RAISE NOTICE '';
    
    -- 1. Show the test users that were created
    RAISE NOTICE '1. TEST USERS CREATED:';
    RAISE NOTICE '====================';
    
    FOR coach_record IN
        SELECT id, full_name, role, organization_id
        FROM profiles 
        WHERE full_name LIKE '%Test Coach%'
        ORDER BY full_name
    LOOP
        RAISE NOTICE 'Coach: % (ID: %)', coach_record.full_name, coach_record.id;
        coach_id := coach_record.id;
    END LOOP;
    
    FOR therapist_record IN
        SELECT id, full_name, role, organization_id
        FROM profiles 
        WHERE full_name LIKE '%Test Therapist%'
        ORDER BY full_name
    LOOP
        RAISE NOTICE 'Therapist: % (ID: %)', therapist_record.full_name, therapist_record.id;
        therapist_id := therapist_record.id;
    END LOOP;
    
    FOR practitioner_record IN
        SELECT id, full_name, role, organization_id
        FROM profiles 
        WHERE full_name LIKE '%Test Practitioner%'
        ORDER BY full_name
    LOOP
        RAISE NOTICE 'Practitioner: % (ID: %)', practitioner_record.full_name, practitioner_record.id;
        
        -- Store specific practitioner IDs for later testing
        IF practitioner_record.full_name LIKE '%Alex Rivera%' THEN
            practitioner1_id := practitioner_record.id;
        ELSIF practitioner_record.full_name LIKE '%Jamie Thompson%' THEN
            practitioner2_id := practitioner_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    
    -- 2. Show the practitioner assignments
    RAISE NOTICE '2. PRACTITIONER ASSIGNMENTS:';
    RAISE NOTICE '============================';
    
    FOR assignment_record IN
        SELECT 
            pa.supervisor_id,
            ps.full_name as supervisor_name,
            pa.supervisor_role,
            pa.practitioner_id,
            pp.full_name as practitioner_name,
            pa.active
        FROM practitioner_assignments pa
        JOIN profiles ps ON ps.id = pa.supervisor_id
        JOIN profiles pp ON pp.id = pa.practitioner_id
        WHERE ps.full_name LIKE '%Test%' OR pp.full_name LIKE '%Test%'
        ORDER BY ps.full_name, pp.full_name
    LOOP
        RAISE NOTICE '% (%) → % (Active: %)', 
            assignment_record.supervisor_name,
            assignment_record.supervisor_role,
            assignment_record.practitioner_name,
            assignment_record.active;
    END LOOP;
    
    RAISE NOTICE '';
    
    -- 3. Test the organizational access functions
    RAISE NOTICE '3. TESTING ACCESS FUNCTIONS:';
    RAISE NOTICE '=============================';
    
    -- Test coach access to practitioners
    IF coach_id IS NOT NULL THEN
        RAISE NOTICE 'Testing access for coach (ID: %)', coach_id;
        
        -- Get accessible practitioners for this coach
        FOR accessible_record IN
            SELECT practitioner_id, supervisor_role, organization_id
            FROM get_accessible_practitioners(coach_id)
        LOOP
            -- Get practitioner name separately
            SELECT full_name INTO practitioner_name 
            FROM profiles WHERE id = accessible_record.practitioner_id;
            
            RAISE NOTICE '  ✅ Can access: % (as %)', 
                practitioner_name, 
                accessible_record.supervisor_role;
        END LOOP;
    END IF;
    
    -- Test therapist access to practitioners
    IF therapist_id IS NOT NULL THEN
        RAISE NOTICE 'Testing access for therapist (ID: %)', therapist_id;
        
        -- Get accessible practitioners for this therapist
        FOR accessible_record IN
            SELECT practitioner_id, supervisor_role, organization_id
            FROM get_accessible_practitioners(therapist_id)
        LOOP
            -- Get practitioner name separately
            SELECT full_name INTO practitioner_name 
            FROM profiles WHERE id = accessible_record.practitioner_id;
            
            RAISE NOTICE '  ✅ Can access: % (as %)', 
                practitioner_name, 
                accessible_record.supervisor_role;
        END LOOP;
    END IF;
    
    RAISE NOTICE '';
    
    -- 4. Test specific access function calls
    RAISE NOTICE '4. TESTING SPECIFIC ACCESS CHECKS:';
    RAISE NOTICE '==================================';
    
    -- Test coach → practitioner 1 access
    IF coach_id IS NOT NULL AND practitioner1_id IS NOT NULL THEN
        SELECT can_access_practitioner_data(coach_id, practitioner1_id) INTO access_result;
        RAISE NOTICE 'Coach → Alex Rivera: %', CASE WHEN access_result THEN '✅ CAN ACCESS' ELSE '❌ NO ACCESS' END;
    END IF;
    
    -- Test therapist → practitioner 2 access
    IF therapist_id IS NOT NULL AND practitioner2_id IS NOT NULL THEN
        SELECT can_access_practitioner_data(therapist_id, practitioner2_id) INTO access_result;
        RAISE NOTICE 'Therapist → Jamie Thompson: %', CASE WHEN access_result THEN '✅ CAN ACCESS' ELSE '❌ NO ACCESS' END;
    END IF;
    
    -- Test therapist → practitioner 1 access (should be NO ACCESS)
    IF therapist_id IS NOT NULL AND practitioner1_id IS NOT NULL THEN
        SELECT can_access_practitioner_data(therapist_id, practitioner1_id) INTO access_result;
        RAISE NOTICE 'Therapist → Alex Rivera: %', CASE WHEN access_result THEN '⚠️  UNEXPECTED ACCESS' ELSE '✅ CORRECTLY NO ACCESS' END;
    END IF;
    
    -- Test coach → practitioner 2 access
    IF coach_id IS NOT NULL AND practitioner2_id IS NOT NULL THEN
        SELECT can_access_practitioner_data(coach_id, practitioner2_id) INTO access_result;
        RAISE NOTICE 'Coach → Jamie Thompson: %', CASE WHEN access_result THEN '✅ CAN ACCESS' ELSE '❌ NO ACCESS' END;
    END IF;
    
    RAISE NOTICE '';
    
    -- 5. Test basic profile access (simulating RLS policy)
    RAISE NOTICE '5. TESTING PROFILE ACCESS SIMULATION:';
    RAISE NOTICE '=====================================';
    
    -- Simulate what the RLS policy would do
    IF coach_id IS NOT NULL THEN
        FOR practitioner_record IN
            SELECT p.id, p.full_name
            FROM profiles p
            WHERE p.full_name LIKE '%Test Practitioner%'
            AND public.can_access_practitioner_data(coach_id, p.id) = true
        LOOP
            RAISE NOTICE 'Coach can access profile: %', practitioner_record.full_name;
        END LOOP;
    END IF;
    
    IF therapist_id IS NOT NULL THEN
        FOR practitioner_record IN
            SELECT p.id, p.full_name
            FROM profiles p
            WHERE p.full_name LIKE '%Test Practitioner%'
            AND public.can_access_practitioner_data(therapist_id, p.id) = true
        LOOP
            RAISE NOTICE 'Therapist can access profile: %', practitioner_record.full_name;
        END LOOP;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== ORGANIZATIONAL ACCESS TEST COMPLETE ===';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 NEXT STEPS FOR TESTING:';
    RAISE NOTICE '1. Try logging in with test credentials:';
    RAISE NOTICE '   - test.coach@example.com / testpassword123';
    RAISE NOTICE '   - test.therapist@example.com / testpassword123';
    RAISE NOTICE '2. Verify RLS policies work in the application';
    RAISE NOTICE '3. Check that coaches/therapists can see assigned practitioners';
    RAISE NOTICE '4. Verify practitioners can only see their own data';
    
END $$;