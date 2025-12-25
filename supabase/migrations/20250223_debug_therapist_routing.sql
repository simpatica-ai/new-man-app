-- Debug therapist routing issue

-- Check therapist profile data
SELECT 
    'Therapist Profile Check' as check_type,
    p.id,
    p.full_name,
    p.role,
    p.roles,
    p.has_completed_first_assessment,
    p.organization_id,
    au.email
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.full_name LIKE '%Therapist%' OR 'therapist' = ANY(p.roles);

-- Check if therapist.test@example.com exists and is linked
SELECT 
    'Therapist Auth Check' as check_type,
    au.email,
    au.id as auth_id,
    p.full_name,
    p.roles,
    p.has_completed_first_assessment
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'therapist.test@example.com';