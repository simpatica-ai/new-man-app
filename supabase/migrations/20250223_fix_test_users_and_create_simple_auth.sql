-- Fix test user profiles and create auth entries using Supabase admin functions
-- This approach should work even with limited auth schema access

DO $$
DECLARE
    org_id uuid;
    coach_id uuid := '54ec0332-94cb-4743-b7e1-9f55b7ce1ec9';
    therapist_id uuid := '867904d9-a102-44a4-9c1e-002e4f1b6f4e';
    practitioner1_id uuid := '94c3d757-20af-4b58-be68-88da86af44eb';
    practitioner2_id uuid := '8cddec75-525b-4621-905b-d38f4ff15bf6';
BEGIN
    RAISE NOTICE '=== FIXING TEST USER PROFILES ===';
    
    -- Get or create Sample Therapy Center organization
    SELECT id INTO org_id FROM organizations WHERE name LIKE '%Sample%Therapy%Center%' LIMIT 1;
    
    IF org_id IS NULL THEN
        INSERT INTO organizations (id, name, created_at, is_active)
        VALUES (gen_random_uuid(), 'Sample Therapy Center', NOW(), true)
        RETURNING id INTO org_id;
        RAISE NOTICE '✅ Created Sample Therapy Center organization: %', org_id;
    ELSE
        RAISE NOTICE '✅ Found existing organization: %', org_id;
    END IF;
    
    -- Fix coach profile
    UPDATE profiles SET
        role = 'coach',
        roles = ARRAY['coach'],
        organization_id = org_id,
        has_completed_first_assessment = true
    WHERE id = coach_id;
    RAISE NOTICE '✅ Fixed coach profile';
    
    -- Fix therapist profile  
    UPDATE profiles SET
        role = 'therapist',
        roles = ARRAY['therapist'],
        organization_id = org_id,
        has_completed_first_assessment = true
    WHERE id = therapist_id;
    RAISE NOTICE '✅ Fixed therapist profile';
    
    -- Fix practitioner 1 profile
    UPDATE profiles SET
        role = 'user',
        roles = ARRAY['practitioner'],
        organization_id = org_id,
        has_completed_first_assessment = true,
        current_virtue_id = 1,
        current_stage = 2
    WHERE id = practitioner1_id;
    RAISE NOTICE '✅ Fixed practitioner 1 profile';
    
    -- Fix practitioner 2 profile
    UPDATE profiles SET
        role = 'user', 
        roles = ARRAY['practitioner'],
        organization_id = org_id,
        has_completed_first_assessment = true,
        current_virtue_id = 2,
        current_stage = 1
    WHERE id = practitioner2_id;
    RAISE NOTICE '✅ Fixed practitioner 2 profile';
    
    -- Create practitioner assignments (delete existing first to avoid duplicates)
    DELETE FROM practitioner_assignments 
    WHERE practitioner_id IN (practitioner1_id, practitioner2_id)
    AND supervisor_id IN (coach_id, therapist_id);
    
    INSERT INTO practitioner_assignments (
        practitioner_id, supervisor_id, supervisor_role, organization_id, active, assigned_at, assigned_by
    ) VALUES 
        (practitioner1_id, coach_id, 'coach', org_id, true, NOW(), coach_id),
        (practitioner2_id, therapist_id, 'therapist', org_id, true, NOW(), therapist_id),
        (practitioner2_id, coach_id, 'coach', org_id, true, NOW(), coach_id);
    
    RAISE NOTICE '✅ Created/updated practitioner assignments';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== PROFILES FIXED ===';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  AUTH ENTRIES ISSUE:';
    RAISE NOTICE 'Cannot create auth.users entries due to schema permissions.';
    RAISE NOTICE 'You will need to create test users through Supabase Dashboard:';
    RAISE NOTICE '';
    RAISE NOTICE '📋 MANUAL STEPS TO CREATE TEST USERS:';
    RAISE NOTICE '1. Go to Supabase Dashboard → Authentication → Users';
    RAISE NOTICE '2. Click "Add user" and create these users:';
    RAISE NOTICE '';
    RAISE NOTICE '   Coach User:';
    RAISE NOTICE '   - Email: test.coach@example.com';
    RAISE NOTICE '   - Password: testpassword123';
    RAISE NOTICE '   - User ID: %', coach_id;
    RAISE NOTICE '';
    RAISE NOTICE '   Therapist User:';
    RAISE NOTICE '   - Email: test.therapist@example.com';
    RAISE NOTICE '   - Password: testpassword123';
    RAISE NOTICE '   - User ID: %', therapist_id;
    RAISE NOTICE '';
    RAISE NOTICE '   Practitioner 1:';
    RAISE NOTICE '   - Email: test.practitioner1@example.com';
    RAISE NOTICE '   - Password: testpassword123';
    RAISE NOTICE '   - User ID: %', practitioner1_id;
    RAISE NOTICE '';
    RAISE NOTICE '   Practitioner 2:';
    RAISE NOTICE '   - Email: test.practitioner2@example.com';
    RAISE NOTICE '   - Password: testpassword123';
    RAISE NOTICE '   - User ID: %', practitioner2_id;
    RAISE NOTICE '';
    RAISE NOTICE '3. Make sure to use the EXACT User IDs shown above';
    RAISE NOTICE '4. After creating, the organizational access should work';
    RAISE NOTICE '';
    
END $$;