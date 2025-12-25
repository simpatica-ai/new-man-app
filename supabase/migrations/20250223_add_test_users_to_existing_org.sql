-- Add test coach, therapist, and practitioners to existing organization
-- Using "Sample Therapy Center" for realistic testing

DO $$
DECLARE
    test_org_id uuid := '73fc48d6-448d-4eeb-96a9-2717c3013ab3'; -- Sample Therapy Center
    test_coach_id uuid;
    test_therapist_id uuid;
    test_practitioner1_id uuid;
    test_practitioner2_id uuid;
BEGIN
    -- Generate UUIDs for test users
    test_coach_id := gen_random_uuid();
    test_therapist_id := gen_random_uuid();
    test_practitioner1_id := gen_random_uuid();
    test_practitioner2_id := gen_random_uuid();
    
    RAISE NOTICE '=== ADDING TEST USERS TO EXISTING ORGANIZATION ===';
    RAISE NOTICE 'Organization: Sample Therapy Center';
    RAISE NOTICE 'Organization ID: %', test_org_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Test User IDs:';
    RAISE NOTICE 'Coach: %', test_coach_id;
    RAISE NOTICE 'Therapist: %', test_therapist_id;
    RAISE NOTICE 'Practitioner 1: %', test_practitioner1_id;
    RAISE NOTICE 'Practitioner 2: %', test_practitioner2_id;
    RAISE NOTICE '';
    
    -- Create test coach profile
    INSERT INTO profiles (
        id, 
        full_name, 
        role, 
        roles, 
        organization_id, 
        is_active,
        created_at,
        has_completed_first_assessment
    )
    VALUES (
        test_coach_id,
        'Sarah Johnson (Test Coach)',
        'coach',
        ARRAY['coach'],
        test_org_id,
        true,
        NOW(),
        true
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create test therapist profile
    INSERT INTO profiles (
        id, 
        full_name, 
        role, 
        roles, 
        organization_id, 
        is_active,
        created_at,
        has_completed_first_assessment
    )
    VALUES (
        test_therapist_id,
        'Dr. Michael Chen (Test Therapist)',
        'therapist',
        ARRAY['therapist'],
        test_org_id,
        true,
        NOW(),
        true
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create test practitioner 1
    INSERT INTO profiles (
        id, 
        full_name, 
        role, 
        roles, 
        organization_id, 
        is_active,
        created_at,
        has_completed_first_assessment,
        current_virtue_id,
        current_stage
    )
    VALUES (
        test_practitioner1_id,
        'Alex Rivera (Test Practitioner)',
        'user',
        ARRAY['practitioner'],
        test_org_id,
        true,
        NOW(),
        true,
        1,
        2
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create test practitioner 2
    INSERT INTO profiles (
        id, 
        full_name, 
        role, 
        roles, 
        organization_id, 
        is_active,
        created_at,
        has_completed_first_assessment,
        current_virtue_id,
        current_stage
    )
    VALUES (
        test_practitioner2_id,
        'Jamie Thompson (Test Practitioner)',
        'user',
        ARRAY['practitioner'],
        test_org_id,
        true,
        NOW(),
        true,
        2,
        1
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create practitioner assignments
    -- Coach assigned to practitioner 1
    INSERT INTO practitioner_assignments (
        practitioner_id,
        supervisor_id,
        supervisor_role,
        organization_id,
        active,
        assigned_at,
        assigned_by
    )
    VALUES (
        test_practitioner1_id,
        test_coach_id,
        'coach',
        test_org_id,
        true,
        NOW(),
        test_coach_id
    )
    ON CONFLICT (practitioner_id, supervisor_id, supervisor_role, organization_id) DO NOTHING;
    
    -- Therapist assigned to practitioner 2
    INSERT INTO practitioner_assignments (
        practitioner_id,
        supervisor_id,
        supervisor_role,
        organization_id,
        active,
        assigned_at,
        assigned_by
    )
    VALUES (
        test_practitioner2_id,
        test_therapist_id,
        'therapist',
        test_org_id,
        true,
        NOW(),
        test_therapist_id
    )
    ON CONFLICT (practitioner_id, supervisor_id, supervisor_role, organization_id) DO NOTHING;
    
    -- Coach also assigned to practitioner 2 (multiple supervisors)
    INSERT INTO practitioner_assignments (
        practitioner_id,
        supervisor_id,
        supervisor_role,
        organization_id,
        active,
        assigned_at,
        assigned_by
    )
    VALUES (
        test_practitioner2_id,
        test_coach_id,
        'coach',
        test_org_id,
        true,
        NOW(),
        test_coach_id
    )
    ON CONFLICT (practitioner_id, supervisor_id, supervisor_role, organization_id) DO NOTHING;
    
    -- Create some test activity sessions for practitioners
    INSERT INTO user_activity_sessions (user_id, session_start, last_activity)
    VALUES 
        (test_practitioner1_id, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes'),
        (test_practitioner2_id, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour')
    ON CONFLICT (user_id) DO UPDATE SET
        last_activity = EXCLUDED.last_activity;
    
    -- Create some test virtue stage memos (if the table exists and is accessible)
    BEGIN
        INSERT INTO user_virtue_stage_memos (user_id, virtue_id, stage_number, memo_text, created_at)
        VALUES 
            (test_practitioner1_id, 1, 2, 'Test memo from Alex - working on patience in daily interactions', NOW() - INTERVAL '1 day'),
            (test_practitioner2_id, 2, 1, 'Test memo from Jamie - beginning journey with compassion exercises', NOW() - INTERVAL '2 days')
        ON CONFLICT (user_id, virtue_id, stage_number) DO NOTHING;
        
        RAISE NOTICE '✅ Created test virtue stage memos';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Could not create virtue stage memos: %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST USERS CREATED SUCCESSFULLY ===';
    RAISE NOTICE '';
    RAISE NOTICE '🏢 Organization: Sample Therapy Center';
    RAISE NOTICE '👨‍🏫 Coach: Sarah Johnson (Test Coach)';
    RAISE NOTICE '   - Assigned to: Alex Rivera + Jamie Thompson';
    RAISE NOTICE '👩‍⚕️ Therapist: Dr. Michael Chen (Test Therapist)';
    RAISE NOTICE '   - Assigned to: Jamie Thompson only';
    RAISE NOTICE '👤 Practitioner: Alex Rivera (Test Practitioner)';
    RAISE NOTICE '   - Supervised by: Sarah Johnson (Coach)';
    RAISE NOTICE '👤 Practitioner: Jamie Thompson (Test Practitioner)';
    RAISE NOTICE '   - Supervised by: Sarah Johnson (Coach) + Dr. Michael Chen (Therapist)';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TESTING SCENARIOS:';
    RAISE NOTICE '1. Login as Sarah Johnson → Should see both Alex and Jamie';
    RAISE NOTICE '2. Login as Dr. Michael Chen → Should see only Jamie';
    RAISE NOTICE '3. Login as Alex Rivera → Should see only own data';
    RAISE NOTICE '4. Login as Jamie Thompson → Should see only own data';
    RAISE NOTICE '';
    RAISE NOTICE '📧 Note: These are test accounts - you may need to create auth users';
    RAISE NOTICE '    or use the user IDs above to test the RLS policies directly';
    
END $$;