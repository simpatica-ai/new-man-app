-- Fix the coach auth user linkage and clean up profiles

-- 1. Delete Bob Wenzlau profile (as requested)
DELETE FROM profiles 
WHERE id = 'a57a0d05-7928-4c23-b3aa-fd66ce7d8a60' 
AND full_name = 'Bob Wenzlau';

-- 2. Find the actual profile linked to coach.test@example.com
DO $$
DECLARE
    coach_auth_id uuid;
    coach_profile_record RECORD;
    sarah_profile_id uuid := '54ec0332-94cb-4743-b7e1-9f55b7ce1ec9';
BEGIN
    -- Get the coach auth user ID
    SELECT id INTO coach_auth_id FROM auth.users WHERE email = 'coach.test@example.com';
    
    RAISE NOTICE 'Coach auth user ID: %', coach_auth_id;
    
    -- Check what profile is currently linked to this auth user
    SELECT * INTO coach_profile_record FROM profiles WHERE id = coach_auth_id;
    
    IF coach_profile_record.id IS NOT NULL THEN
        RAISE NOTICE 'Found auto-created profile:';
        RAISE NOTICE '  ID: %', coach_profile_record.id;
        RAISE NOTICE '  Name: %', coach_profile_record.full_name;
        RAISE NOTICE '  Role: %', coach_profile_record.role;
        RAISE NOTICE '  Roles: %', coach_profile_record.roles;
        RAISE NOTICE '  Assessment: %', coach_profile_record.has_completed_first_assessment;
        
        -- Update this profile to be the coach
        UPDATE profiles SET
            full_name = 'Sarah Johnson (Test Coach)',
            role = 'coach',
            roles = ARRAY['coach'],
            has_completed_first_assessment = false,
            organization_id = '73fc48d6-448d-4eeb-96a9-2717c3013ab3'
        WHERE id = coach_auth_id;
        
        RAISE NOTICE '✅ Updated auto-created profile to be coach';
        
        -- Delete the old Sarah Johnson profile since we're using the auto-created one
        DELETE FROM profiles WHERE id = sarah_profile_id;
        RAISE NOTICE '✅ Deleted old Sarah Johnson profile';
        
    ELSE
        RAISE NOTICE 'No profile found for coach auth user - this is unexpected';
    END IF;
    
    -- Show final result
    SELECT * INTO coach_profile_record FROM profiles WHERE id = coach_auth_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL COACH PROFILE ===';
    RAISE NOTICE 'ID: %', coach_profile_record.id;
    RAISE NOTICE 'Name: %', coach_profile_record.full_name;
    RAISE NOTICE 'Role: %', coach_profile_record.role;
    RAISE NOTICE 'Roles: %', coach_profile_record.roles;
    RAISE NOTICE 'Assessment: %', coach_profile_record.has_completed_first_assessment;
    RAISE NOTICE 'Organization: %', coach_profile_record.organization_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Expected routing: /coach/dashboard';
    
END $$;