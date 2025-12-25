-- Simple approach: Create new test users and update existing profiles to match
-- This avoids the User ID conflict issue

DO $$
DECLARE
    org_id uuid;
    existing_coach_id uuid;
    existing_therapist_id uuid;
    existing_practitioner1_id uuid;
    existing_practitioner2_id uuid;
BEGIN
    RAISE NOTICE '=== SIMPLE TEST USER APPROACH ===';
    RAISE NOTICE '';
    
    -- Get organization ID
    SELECT id INTO org_id FROM organizations WHERE name LIKE '%Sample%Therapy%Center%' LIMIT 1;
    
    -- Get existing test user IDs
    SELECT id INTO existing_coach_id FROM profiles WHERE full_name LIKE '%Test Coach%' LIMIT 1;
    SELECT id INTO existing_therapist_id FROM profiles WHERE full_name LIKE '%Test Therapist%' LIMIT 1;
    SELECT id INTO existing_practitioner1_id FROM profiles WHERE full_name LIKE '%Alex Rivera%' LIMIT 1;
    SELECT id INTO existing_practitioner2_id FROM profiles WHERE full_name LIKE '%Jamie Thompson%' LIMIT 1;
    
    RAISE NOTICE '📋 SIMPLIFIED TESTING APPROACH:';
    RAISE NOTICE '';
    RAISE NOTICE '1. CREATE NEW AUTH USERS (without specifying User ID):';
    RAISE NOTICE '   Go to Supabase Dashboard → Authentication → Users → Add user';
    RAISE NOTICE '';
    RAISE NOTICE '   Create these users (let Supabase generate the IDs):';
    RAISE NOTICE '   - Email: coach.test@example.com';
    RAISE NOTICE '   - Password: testpass123';
    RAISE NOTICE '';
    RAISE NOTICE '   - Email: therapist.test@example.com';
    RAISE NOTICE '   - Password: testpass123';
    RAISE NOTICE '';
    RAISE NOTICE '   - Email: practitioner1.test@example.com';
    RAISE NOTICE '   - Password: testpass123';
    RAISE NOTICE '';
    RAISE NOTICE '   - Email: practitioner2.test@example.com';
    RAISE NOTICE '   - Password: testpass123';
    RAISE NOTICE '';
    RAISE NOTICE '2. AFTER CREATING, get the User IDs from the dashboard';
    RAISE NOTICE '3. Run the next migration to link profiles to those User IDs';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 ALTERNATIVE: Test with existing admin user';
    RAISE NOTICE 'You can test organizational access functions directly:';
    RAISE NOTICE '';
    RAISE NOTICE 'Test queries to run in SQL editor:';
    RAISE NOTICE '';
    RAISE NOTICE '-- Test coach access to practitioners';
    RAISE NOTICE 'SELECT can_access_practitioner_data(''%'', ''%'');', existing_coach_id, existing_practitioner1_id;
    RAISE NOTICE '';
    RAISE NOTICE '-- Get accessible practitioners for coach';
    RAISE NOTICE 'SELECT * FROM get_accessible_practitioners(''%'');', existing_coach_id;
    RAISE NOTICE '';
    RAISE NOTICE '-- Test therapist access';
    RAISE NOTICE 'SELECT can_access_practitioner_data(''%'', ''%'');', existing_therapist_id, existing_practitioner2_id;
    RAISE NOTICE '';
    RAISE NOTICE '-- Simulate RLS policy for profiles';
    RAISE NOTICE 'SELECT p.full_name FROM profiles p WHERE can_access_practitioner_data(''%'', p.id);', existing_coach_id;
    RAISE NOTICE '';
    RAISE NOTICE 'These queries will show if the organizational access functions work correctly.';
    RAISE NOTICE '';
    
END $$;