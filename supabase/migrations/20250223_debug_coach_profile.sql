-- Debug the coach profile to see why routing isn't working

-- Check the coach profile data
SELECT 
    'Coach Profile Data' as check_type,
    id,
    full_name,
    role,
    roles,
    organization_id,
    has_completed_first_assessment,
    is_active
FROM profiles 
WHERE full_name LIKE '%Test Coach%' OR full_name LIKE '%Sarah Johnson%'
ORDER BY full_name;

-- Check if there are any auth users with coach email
SELECT 
    'Auth Users with Coach Email' as check_type,
    id,
    email,
    created_at,
    email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
WHERE email LIKE '%coach%'
ORDER BY email;

-- Check all test-related profiles
SELECT 
    'All Test Profiles' as check_type,
    id,
    full_name,
    role,
    roles,
    organization_id,
    has_completed_first_assessment
FROM profiles 
WHERE full_name LIKE '%Test%' OR full_name LIKE '%Sarah%' OR full_name LIKE '%Alex%' OR full_name LIKE '%Jamie%' OR full_name LIKE '%Michael%'
ORDER BY full_name;