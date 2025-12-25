-- Test the organizational access functions and verify the setup
-- This will show if coaches and therapists can access their assigned practitioners

DO $$
DECLARE
    coach_record RECORD;
    therapist_record RECORD;
    practitioner_record RECORD;
    assignment_record RECORD;
    access_result boolean;
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
    END LOOP;
    
    FOR therapist_record IN
        SELECT id, full_name, role, organization_id
        FROM profiles 
        WHERE full_name LIKE '%Test Therapist%'
        ORDER BY full_name
    LOOP
        RAISE NOTICE 'Therapist: % (ID: %)', therapist_record.full_name, therapist_record.id;
    END LOOP;
    
    FOR practitioner_record IN
        SELECT id, full_name, role, organization_id
        FROM profiles 
        WHERE full_name LIKE '%Test Practitioner%'
        ORDER BY full_name
    LOOP
        RAISE NOTICE 'Practitioner: % (ID: %)', practitioner_record.full_name, practitioner_record.id;
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
    FOR coach_record IN
        SELECT id, full_name FROM profiles WHERE full_name LIKE '%Test Coach%'
    LOOP
        RAISE NOTICE 'Testing access for coach: %', coach_record.full_name;
        
        -- Get accessible practitioners for this coach
        FOR practitioner_record IN
            SELECT practitioner_id, supervisor_role, organization_id
            FROM get_accessible_practitioners(coach_record.id)
        LOOP
            SELECT full_name INTO practitioner_record.full_name 
            FROM profiles WHERE id = practitioner_record.practitioner_id;
            
            RAISE NOTICE '  ✅ Can access: % (as %)', 
                practitioner_record.full_name, 
                practitioner_record.supervisor_role;
        END LOOP;
    END LOOP;
    
    -- Test therapist access to practitioners
    FOR therapist_record IN
        SELECT id, full_name FROM profiles WHERE full_name LIKE '%Test Therapist%'
    LOOP
        RAISE NOTICE 'Testing access for therapist: %', therapist_record.full_name;
        
        -- Get accessible practitioners for this therapist
        FOR practitioner_record IN
            SELECT practitioner_id, supervisor_role, organization_id
            FROM get_accessible_practitioners(therapist_record.id)
        LOOP
            SELECT full_name INTO practitioner_record.full_name 
            FROM profiles WHERE id = practitioner_record.practitioner_id;
            
            RAISE NOTICE '  ✅ Can access: % (as %)', 
                practitioner_record.full_name, 
                practitioner_record.supervisor_role;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '';
    
    -- 4. Test specific access function calls
    RAISE NOTICE '4. TESTING SPECIFIC ACCESS CHECKS:';
    RAISE NOTICE '==================================';
    
    -- Test coach → practitioner 1 access
    SELECT id INTO coach_record.id FROM profiles WHERE full_name LIKE '%Test Coach%' LIMIT 1;
    SELECT id INTO practitioner_record.id FROM profiles WHERE full_name LIKE '%Alex Rivera%' LIMIT 1;
    
    IF coach_record.id IS NOT NULL AND practitioner_record.id IS NOT NULL THEN
        SELECT can_access_practitioner_data(coach_record.id, practitioner_record.id) INTO access_result;
        RAISE NOTICE 'Coach → Alex Rivera: %', CASE WHEN access_result THEN '✅ CAN ACCESS' ELSE '❌ NO ACCESS' END;
    END IF;
    
    -- Test therapist → practitioner 2 access
    SELECT id INTO therapist_record.id FROM profiles WHERE full_name LIKE '%Test Therapist%' LIMIT 1;
    SELECT id INTO practitioner_record.id FROM profiles WHERE full_name LIKE '%Jamie Thompson%' LIMIT 1;
    
    IF therapist_record.id IS NOT NULL AND practitioner_record.id IS NOT NULL THEN
        SELECT can_access_practitioner_data(therapist_record.id, practitioner_record.id) INTO access_result;
        RAISE NOTICE 'Therapist → Jamie Thompson: %', CASE WHEN access_result THEN '✅ CAN ACCESS' ELSE '❌ NO ACCESS' END;
    END IF;
    
    -- Test therapist → practitioner 1 access (should be NO ACCESS)
    SELECT id INTO practitioner_record.id FROM profiles WHERE full_name LIKE '%Alex Rivera%' LIMIT 1;
    
    IF therapist_record.id IS NOT NULL AND practitioner_record.id IS NOT NULL THEN
        SELECT can_access_practitioner_data(therapist_record.id, practitioner_record.id) INTO access_result;
        RAISE NOTICE 'Therapist → Alex Rivera: %', CASE WHEN access_result THEN '⚠️  UNEXPECTED ACCESS' ELSE '✅ CORRECTLY NO ACCESS' END;
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