-- Create test organizational data to verify coach/therapist access
-- This creates a test organization with coach, therapist, and practitioners

DO $$
DECLARE
    test_org_id uuid;
    test_coach_id uuid;
    test_therapist_id uuid;
    test_practitioner1_id uuid;
    test_practitioner2_id uuid;
BEGIN
    -- Generate UUIDs for test users
    test_org_id := gen_random_uuid();
    test_coach_id := gen_random_uuid();
    test_therapist_id := gen_random_uuid();
    test_practitioner1_id := gen_random_uuid();
    test_practitioner2_id := gen_random_uuid();
    
    RAISE NOTICE '=== CREATING TEST ORGANIZATIONAL DATA ===';
    RAISE NOTICE 'Test Organization ID: %', test_org_id;
    RAISE NOTICE 'Test Coach ID: %', test_coach_id;
    RAISE NOTICE 'Test Therapist ID: %', test_therapist_id;
    RAISE NOTICE 'Test Practitioner 1 ID: %', test_practitioner1_id;
    RAISE NOTICE 'Test Practitioner 2 ID: %', test_practitioner2_id;
    RAISE NOTICE '';
    
    -- Create test organization
    INSERT INTO organizations (id, name, website_url, logo_url, created_at)
    VALUES (
        test_org_id,
        'Test Organization for RLS',
        'https://test-org.example.com',
        null,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create test coach profile
    INSERT INTO profiles (
        id, 
        full_name, 
        role, 
        roles, 
        organization_id, 
        is_active,
        created_at
    )
    VALUES (
        test_coach_id,
        'Test Coach User',
        'coach',
        ARRAY['coach'],
        test_org_id,
        true,
        NOW()
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
        created_at
    )
    VALUES (
        test_therapist_id,
        'Test Therapist User',
        'therapist',
        ARRAY['therapist'],
        test_org_id,
        true,
        NOW()
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
        created_at
    )
    VALUES (
        test_practitioner1_id,
        'Test Practitioner One',
        'user',
        ARRAY['practitioner'],
        test_org_id,
        true,
        NOW()
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
        created_at
    )
    VALUES (
        test_practitioner2_id,
        'Test Practitioner Two',
        'user',
        ARRAY['practitioner'],
        test_org_id,
        true,
        NOW()
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
        assigned_at
    )
    VALUES (
        test_practitioner1_id,
        test_coach_id,
        'coach',
        test_org_id,
        true,
        NOW()
    )
    ON CONFLICT (practitioner_id, supervisor_id, supervisor_role, organization_id) DO NOTHING;
    
    -- Therapist assigned to practitioner 2
    INSERT INTO practitioner_assignments (
        practitioner_id,
        supervisor_id,
        supervisor_role,
        organization_id,
        active,
        assigned_at
    )
    VALUES (
        test_practitioner2_id,
        test_therapist_id,
        'therapist',
        test_org_id,
        true,
        NOW()
    )
    ON CONFLICT (practitioner_id, supervisor_id, supervisor_role, organization_id) DO NOTHING;
    
    -- Coach also assigned to practitioner 2 (multiple supervisors)
    INSERT INTO practitioner_assignments (
        practitioner_id,
        supervisor_id,
        supervisor_role,
        organization_id,
        active,
        assigned_at
    )
    VALUES (
        test_practitioner2_id,
        test_coach_id,
        'coach',
        test_org_id,
        true,
        NOW()
    )
    ON CONFLICT (practitioner_id, supervisor_id, supervisor_role, organization_id) DO NOTHING;
    
    -- Create some test activity sessions for practitioners
    INSERT INTO user_activity_sessions (user_id, session_start, last_activity)
    VALUES 
        (test_practitioner1_id, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes'),
        (test_practitioner2_id, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour')
    ON CONFLICT (user_id) DO UPDATE SET
        last_activity = EXCLUDED.last_activity;
    
    RAISE NOTICE '=== TEST DATA CREATED SUCCESSFULLY ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Test Structure:';
    RAISE NOTICE '📋 Organization: Test Organization for RLS';
    RAISE NOTICE '👨‍🏫 Coach: Test Coach User (assigned to both practitioners)';
    RAISE NOTICE '👩‍⚕️ Therapist: Test Therapist User (assigned to practitioner 2)';
    RAISE NOTICE '👤 Practitioner 1: Test Practitioner One (assigned to coach)';
    RAISE NOTICE '👤 Practitioner 2: Test Practitioner Two (assigned to coach + therapist)';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected Access:';
    RAISE NOTICE '- Coach should see both practitioners';
    RAISE NOTICE '- Therapist should see only practitioner 2';
    RAISE NOTICE '- Practitioners should see only their own data';
    RAISE NOTICE '';
    RAISE NOTICE 'Test the organizational access by logging in as these test users';
    
END $$;