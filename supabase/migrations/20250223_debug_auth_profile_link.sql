-- Debug which profile the coach auth user is actually linked to

-- Check all auth users with coach-related emails
SELECT 
    'Auth Users' as check_type,
    au.id as auth_user_id,
    au.email,
    au.created_at as auth_created,
    p.id as profile_id,
    p.full_name,
    p.role,
    p.roles,
    p.has_completed_first_assessment,
    CASE 
        WHEN au.id = p.id THEN 'LINKED'
        ELSE 'NOT LINKED'
    END as link_status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email LIKE '%coach%' OR au.email LIKE '%test%'
ORDER BY au.email;

-- Check if there are any profiles that might be auto-created for the auth user
SELECT 
    'Profiles by Auth ID' as check_type,
    id,
    full_name,
    role,
    roles,
    has_completed_first_assessment,
    created_at
FROM profiles 
WHERE id IN (
    SELECT id FROM auth.users WHERE email LIKE '%coach%'
)
ORDER BY created_at;

-- Show the specific coach profile we updated
SELECT 
    'Updated Coach Profile' as check_type,
    id,
    full_name,
    role,
    roles,
    has_completed_first_assessment,
    organization_id
FROM profiles 
WHERE id = '54ec0332-94cb-4743-b7e1-9f55b7ce1ec9';