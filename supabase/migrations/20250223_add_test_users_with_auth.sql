-- Add test users with proper auth.users entries first, then profiles
-- This handles the foreign key constraint properly

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
    
    RAISE NOTICE '=== CREATING TEST USERS WITH AUTH ENTRIES ===';
    RAISE NOTICE 'Organization: Sample Therapy Center';
    RAISE NOTICE 'Organization ID: %', test_org_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Test User IDs:';
    RAISE NOTICE 'Coach: %', test_coach_id;
    RAISE NOTICE 'Therapist: %', test_therapist_id;
    RAISE NOTICE 'Practitioner 1: %', test_practitioner1_id;
    RAISE NOTICE 'Practitioner 2: %', test_practitioner2_id;
    RAISE NOTICE '';
    
    -- Create auth.users entries first (if we have access to auth schema)
    BEGIN
        -- Try to create auth users (this may fail if we don't have access to auth schema)
        INSERT INTO auth.users (
            id, 
            email, 
            encrypted_password, 
            email_confirmed_at, 
            created_at, 
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data
        )
        VALUES 
            (test_coach_id, 'test.coach@example.com', crypt('testpassword123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Johnson (Test Coach)"}'),
            (test_therapist_id, 'test.therapist@example.com', crypt('testpassword123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Michael Chen (Test Therapist)"}'),
            (test_practitioner1_id, 'test.practitioner1@example.com', crypt('testpassword123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alex Rivera (Test Practitioner)"}'),
            (test_practitioner2_id, 'test.practitioner2@example.com', crypt('testpassword123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jamie Thompson (Test Practitioner)"}')
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE '✅ Created auth.users entries';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️  Could not create auth.users entries: %', SQLERRM;
        RAISE NOTICE '   Will create profiles without auth entries (for testing RLS policies only)';
        
        -- Create minimal entries in public.users table if it exists
        BEGIN
            INSERT INTO public.users (id, email, created_at)
            VALUES 
                (test_coach_id, 'test.coach@example.com', NOW()),
                (test_therapist_id, 'test.therapist@example.com', NOW()),
                (test_practitioner1_id, 'test.practitioner1@example.com', NOW()),
                (test_practitioner2_id, 'test.practitioner2@example.com', NOW())
            ON CONFLICT (id) DO NOTHING;
            
            RAISE NOTICE '✅ Created public.users entries';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '⚠️  Could not create public.users entries: %', SQLERRM;
            RAISE NOTICE '   Proceeding without user entries - profiles may fail';
        END;
    END;
    
    -- Now create profiles (these should work if users were created successfully)
    BEGIN
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
        );
        
        RAISE NOTICE '✅ Created coach profile';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed to create coach profile: %', SQLERRM;
    END;
    
    BEGIN
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
        );
        
        RAISE NOTICE '✅ Created therapist profile';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed to create therapist profile: %', SQLERRM;
    END;
    
    BEGIN
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
        );
        
        RAISE NOTICE '✅ Created practitioner 1 profile';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed to create practitioner 1 profile: %', SQLERRM;
    END;
    
    BEGIN
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
        );
        
        RAISE NOTICE '✅ Created practitioner 2 profile';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed to create practitioner 2 profile: %', SQLERRM;
    END;
    
    -- Create practitioner assignments (only if profiles were created successfully)
    BEGIN
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
        );
        
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
        );
        
        -- Coach also assigned to practitioner 2
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
        );
        
        RAISE NOTICE '✅ Created practitioner assignments';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed to create practitioner assignments: %', SQLERRM;
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST USER CREATION COMPLETE ===';
    RAISE NOTICE '';
    RAISE NOTICE 'If profiles were created successfully, you can test organizational access';
    RAISE NOTICE 'If auth entries were created, you can login with:';
    RAISE NOTICE '- test.coach@example.com / testpassword123';
    RAISE NOTICE '- test.therapist@example.com / testpassword123';
    RAISE NOTICE '- test.practitioner1@example.com / testpassword123';
    RAISE NOTICE '- test.practitioner2@example.com / testpassword123';
    
END $$;