-- Check the actual profile for the coach user ID from the console logs

SELECT 
    'Actual Coach Profile' as check_type,
    id,
    full_name,
    role,
    roles,
    has_completed_first_assessment,
    organization_id,
    created_at,
    updated_at
FROM profiles 
WHERE id = 'eb24dcef-89fd-4022-bde5-52e7627b534b';

-- Also check if this matches any auth user
SELECT 
    'Auth User Check' as check_type,
    au.email,
    au.id as auth_id,
    p.full_name,
    p.roles,
    p.has_completed_first_assessment
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.id = 'eb24dcef-89fd-4022-bde5-52e7627b534b';