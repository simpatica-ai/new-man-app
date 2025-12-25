-- Find the new auth users and link them to existing profiles

-- First, show all recent auth users to identify the ones you created
SELECT 
    'Recent Auth Users (last 24 hours)' as check_type,
    id as user_id,
    email,
    created_at,
    email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Show all auth users with test-related emails
SELECT 
    'Test-related Auth Users' as check_type,
    id as user_id,
    email,
    created_at
FROM auth.users 
WHERE email ILIKE '%test%' OR email ILIKE '%coach%' OR email ILIKE '%therapist%' OR email ILIKE '%practitioner%'
ORDER BY email;

-- Show existing profiles that need linking
SELECT 
    'Profiles Needing Auth Link' as check_type,
    id as profile_id,
    full_name,
    role,
    organization_id,
    CASE 
        WHEN full_name LIKE '%Coach%' THEN 'Needs: coach.test@example.com'
        WHEN full_name LIKE '%Therapist%' THEN 'Needs: therapist.test@example.com'
        WHEN full_name LIKE '%Alex Rivera%' THEN 'Needs: practitioner1.test@example.com'
        WHEN full_name LIKE '%Jamie Thompson%' THEN 'Needs: practitioner2.test@example.com'
        ELSE 'No match needed'
    END as needs_auth_user
FROM profiles 
WHERE full_name IN (
    'Sarah Johnson (Test Coach)',
    'Dr. Michael Chen (Test Therapist)', 
    'Alex Rivera (Test Practitioner)',
    'Jamie Thompson (Test Practitioner)'
)
ORDER BY full_name;