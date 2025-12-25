-- Create auth.users entries for the existing test organizational users
-- This will allow actual login with the test credentials

DO $$
DECLARE
    coach_profile RECORD;
    therapist_profile RECORD;
    practitioner1_profile RECORD;
    practitioner2_profile RECORD;
BEGIN
    RAISE NOTICE '=== CREATING AUTH ENTRIES FOR TEST USERS ===';
    RAISE NOTICE '';
    
    -- Get the existing test user profiles
    SELECT * INTO coach_profile FROM profiles WHERE full_name LIKE '%Test Coach%' LIMIT 1;
    SELECT * INTO therapist_profile FROM profiles WHERE full_name LIKE '%Test Therapist%' LIMIT 1;
    SELECT * INTO practitioner1_profile FROM profiles WHERE full_name LIKE '%Alex Rivera%' LIMIT 1;
    SELECT * INTO practitioner2_profile FROM profiles WHERE full_name LIKE '%Jamie Thompson%' LIMIT 1;
    
    -- Create auth.users entries for each test user
    BEGIN
        -- Coach auth entry
        IF coach_profile.id IS NOT NULL THEN
            INSERT INTO auth.users (
                id, 
                email, 
                encrypted_password, 
                email_confirmed_at, 
                created_at, 
                updated_at,
                raw_app_meta_data,
                raw_user_meta_data,
                aud,
                role
            )
            VALUES (
                coach_profile.id,
                'test.coach@example.com',
                crypt('testpassword123', gen_salt('bf')),
                NOW(),
                NOW(),
                NOW(),
                '{"provider":"email","providers":["email"]}',
                '{"full_name":"Sarah Johnson (Test Coach)"}',
                'authenticated',
                'authenticated'
            )
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                encrypted_password = EXCLUDED.encrypted_password,
                email_confirmed_at = EXCLUDED.email_confirmed_at;
                
            RAISE NOTICE '✅ Created auth entry for coach: test.coach@example.com';
        END IF;
        
        -- Therapist auth entry
        IF therapist_profile.id IS NOT NULL THEN
            INSERT INTO auth.users (
                id, 
                email, 
                encrypted_password, 
                email_confirmed_at, 
                created_at, 
                updated_at,
                raw_app_meta_data,
                raw_user_meta_data,
                aud,
                role
            )
            VALUES (
                therapist_profile.id,
                'test.therapist@example.com',
                crypt('testpassword123', gen_salt('bf')),
                NOW(),
                NOW(),
                NOW(),
                '{"provider":"email","providers":["email"]}',
                '{"full_name":"Dr. Michael Chen (Test Therapist)"}',
                'authenticated',
                'authenticated'
            )
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                encrypted_password = EXCLUDED.encrypted_password,
                email_confirmed_at = EXCLUDED.email_confirmed_at;
                
            RAISE NOTICE '✅ Created auth entry for therapist: test.therapist@example.com';
        END IF;
        
        -- Practitioner 1 auth entry
        IF practitioner1_profile.id IS NOT NULL THEN
            INSERT INTO auth.users (
                id, 
                email, 
                encrypted_password, 
                email_confirmed_at, 
                created_at, 
                updated_at,
                raw_app_meta_data,
                raw_user_meta_data,
                aud,
                role
            )
            VALUES (
                practitioner1_profile.id,
                'test.practitioner1@example.com',
                crypt('testpassword123', gen_salt('bf')),
                NOW(),
                NOW(),
                NOW(),
                '{"provider":"email","providers":["email"]}',
                '{"full_name":"Alex Rivera (Test Practitioner)"}',
                'authenticated',
                'authenticated'
            )
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                encrypted_password = EXCLUDED.encrypted_password,
                email_confirmed_at = EXCLUDED.email_confirmed_at;
                
            RAISE NOTICE '✅ Created auth entry for practitioner 1: test.practitioner1@example.com';
        END IF;
        
        -- Practitioner 2 auth entry
        IF practitioner2_profile.id IS NOT NULL THEN
            INSERT INTO auth.users (
                id, 
                email, 
                encrypted_password, 
                email_confirmed_at, 
                created_at, 
                updated_at,
                raw_app_meta_data,
                raw_user_meta_data,
                aud,
                role
            )
            VALUES (
                practitioner2_profile.id,
                'test.practitioner2@example.com',
                crypt('testpassword123', gen_salt('bf')),
                NOW(),
                NOW(),
                NOW(),
                '{"provider":"email","providers":["email"]}',
                '{"full_name":"Jamie Thompson (Test Practitioner)"}',
                'authenticated',
                'authenticated'
            )
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                encrypted_password = EXCLUDED.encrypted_password,
                email_confirmed_at = EXCLUDED.email_confirmed_at;
                
            RAISE NOTICE '✅ Created auth entry for practitioner 2: test.practitioner2@example.com';
        END IF;
        
        RAISE NOTICE '';
        RAISE NOTICE '=== AUTH ENTRIES CREATED SUCCESSFULLY ===';
        RAISE NOTICE '';
        RAISE NOTICE '🔑 TEST LOGIN CREDENTIALS:';
        RAISE NOTICE '- Coach: test.coach@example.com / testpassword123';
        RAISE NOTICE '- Therapist: test.therapist@example.com / testpassword123';
        RAISE NOTICE '- Practitioner 1: test.practitioner1@example.com / testpassword123';
        RAISE NOTICE '- Practitioner 2: test.practitioner2@example.com / testpassword123';
        RAISE NOTICE '';
        RAISE NOTICE '🧪 TESTING SCENARIOS:';
        RAISE NOTICE '1. Login as coach → should see Alex Rivera and Jamie Thompson';
        RAISE NOTICE '2. Login as therapist → should see only Jamie Thompson';
        RAISE NOTICE '3. Login as practitioners → should see only their own data';
        RAISE NOTICE '';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed to create auth entries: %', SQLERRM;
        RAISE NOTICE '   This may be due to insufficient permissions on auth schema';
        RAISE NOTICE '   Test users exist but cannot login until auth entries are created';
    END;
    
END $$;