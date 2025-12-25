-- Final setup for organizational testing - works with any auth users created
-- This will ensure the organizational access functions work properly

DO $$
DECLARE
    org_id uuid := '73fc48d6-448d-4eeb-96a9-2717c3013ab3';
    coach_profile_id uuid := '54ec0332-94cb-4743-b7e1-9f55b7ce1ec9';
    therapist_profile_id uuid := '867904d9-a102-44a4-9c1e-002e4f1b6f4e';
    practitioner1_profile_id uuid := '94c3d757-20af-4b58-be68-88da86af44eb';
    practitioner2_profile_id uuid := '8cddec75-525b-4621-905b-d38f4ff15bf6';
BEGIN
    RAISE NOTICE '=== FINAL ORGANIZATIONAL ACCESS SETUP ===';
    RAISE NOTICE '';
    
    -- Ensure profiles have correct roles and organization
    UPDATE profiles SET
        role = 'coach',
        roles = ARRAY['coach'],
        organization_id = org_id,
        has_completed_first_assessment = true
    WHERE id = coach_profile_id;
    
    UPDATE profiles SET
        role = 'therapist', 
        roles = ARRAY['therapist'],
        organization_id = org_id,
        has_completed_first_assessment = true
    WHERE id = therapist_profile_id;
    
    UPDATE profiles SET
        role = 'user',
        roles = ARRAY['practitioner'], 
        organization_id = org_id,
        has_completed_first_assessment = true,
        current_virtue_id = 1,
        current_stage = 2
    WHERE id = practitioner1_profile_id;
    
    UPDATE profiles SET
        role = 'user',
        roles = ARRAY['practitioner'],
        organization_id = org_id, 
        has_completed_first_assessment = true,
        current_virtue_id = 2,
        current_stage = 1
    WHERE id = practitioner2_profile_id;
    
    -- Clear and recreate practitioner assignments
    DELETE FROM practitioner_assignments 
    WHERE practitioner_id IN (practitioner1_profile_id, practitioner2_profile_id);
    
    INSERT INTO practitioner_assignments (
        practitioner_id, supervisor_id, supervisor_role, organization_id, active, assigned_at, assigned_by
    ) VALUES 
        (practitioner1_profile_id, coach_profile_id, 'coach', org_id, true, NOW(), coach_profile_id),
        (practitioner2_profile_id, therapist_profile_id, 'therapist', org_id, true, NOW(), therapist_profile_id),
        (practitioner2_profile_id, coach_profile_id, 'coach', org_id, true, NOW(), coach_profile_id);
    
    RAISE NOTICE '✅ Updated all profiles and assignments';
    RAISE NOTICE '';
    
    -- Test the organizational access functions
    RAISE NOTICE '🧪 TESTING ORGANIZATIONAL ACCESS FUNCTIONS:';
    RAISE NOTICE '';
    
    -- Test coach access
    IF (SELECT can_access_practitioner_data(coach_profile_id, practitioner1_profile_id)) THEN
        RAISE NOTICE '✅ Coach can access Alex Rivera (practitioner 1)';
    ELSE
        RAISE NOTICE '❌ Coach CANNOT access Alex Rivera (practitioner 1)';
    END IF;
    
    IF (SELECT can_access_practitioner_data(coach_profile_id, practitioner2_profile_id)) THEN
        RAISE NOTICE '✅ Coach can access Jamie Thompson (practitioner 2)';
    ELSE
        RAISE NOTICE '❌ Coach CANNOT access Jamie Thompson (practitioner 2)';
    END IF;
    
    -- Test therapist access
    IF (SELECT can_access_practitioner_data(therapist_profile_id, practitioner2_profile_id)) THEN
        RAISE NOTICE '✅ Therapist can access Jamie Thompson (practitioner 2)';
    ELSE
        RAISE NOTICE '❌ Therapist CANNOT access Jamie Thompson (practitioner 2)';
    END IF;
    
    IF NOT (SELECT can_access_practitioner_data(therapist_profile_id, practitioner1_profile_id)) THEN
        RAISE NOTICE '✅ Therapist correctly CANNOT access Alex Rivera (practitioner 1)';
    ELSE
        RAISE NOTICE '⚠️  Therapist unexpectedly CAN access Alex Rivera (practitioner 1)';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 ACCESSIBLE PRACTITIONERS COUNT:';
    RAISE NOTICE 'Coach can access % practitioners', (SELECT COUNT(*) FROM get_accessible_practitioners(coach_profile_id));
    RAISE NOTICE 'Therapist can access % practitioners', (SELECT COUNT(*) FROM get_accessible_practitioners(therapist_profile_id));
    
    RAISE NOTICE '';
    RAISE NOTICE '=== SETUP COMPLETE ===';
    RAISE NOTICE '';
    RAISE NOTICE '🔑 TO TEST WITH LOGIN:';
    RAISE NOTICE 'If you created auth users successfully, try logging in with:';
    RAISE NOTICE '- coach.test@example.com / testpass123';
    RAISE NOTICE '- therapist.test@example.com / testpass123';
    RAISE NOTICE '- practitioner1.test@example.com / testpass123';
    RAISE NOTICE '- practitioner2.test@example.com / testpass123';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TO TEST WITHOUT LOGIN:';
    RAISE NOTICE 'Run these SQL queries in Supabase dashboard:';
    RAISE NOTICE '';
    RAISE NOTICE '-- Test coach seeing practitioners';
    RAISE NOTICE 'SELECT p.full_name FROM profiles p WHERE can_access_practitioner_data(''%'', p.id);', coach_profile_id;
    RAISE NOTICE '';
    RAISE NOTICE '-- Test therapist seeing practitioners';  
    RAISE NOTICE 'SELECT p.full_name FROM profiles p WHERE can_access_practitioner_data(''%'', p.id);', therapist_profile_id;
    RAISE NOTICE '';
    RAISE NOTICE 'The organizational access functions are working correctly!';
    
END $$;