-- Complete debug of coach routing issue

-- 1. Show the coach auth user and linked profile
SELECT 
    'Coach Auth User and Profile' as check_type,
    au.id as auth_user_id,
    au.email,
    p.id as profile_id,
    p.full_name,
    p.role,
    p.roles,
    p.has_completed_first_assessment,
    p.organization_id,
    CASE 
        WHEN p.id IS NULL THEN 'NO PROFILE LINKED'
        WHEN au.id = p.id THEN 'PROFILE LINKED CORRECTLY'
        ELSE 'PROFILE ID MISMATCH'
    END as link_status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'coach.test@example.com';

-- 2. Show what the routing logic would decide
SELECT 
    'Routing Decision for Coach' as check_type,
    au.email,
    p.roles,
    p.has_completed_first_assessment,
    (p.roles @> ARRAY['coach']) as is_coach,
    (NOT p.has_completed_first_assessment) as not_practitioner,
    (p.roles @> ARRAY['coach'] AND NOT p.has_completed_first_assessment) as should_go_to_coach_dashboard,
    CASE 
        WHEN p.roles @> ARRAY['admin'] AND p.organization_id IS NOT NULL THEN '/orgadmin'
        WHEN p.roles @> ARRAY['coach'] AND NOT p.has_completed_first_assessment THEN '/coach/dashboard'
        WHEN p.roles @> ARRAY['therapist'] AND NOT p.has_completed_first_assessment THEN '/therapist'
        WHEN p.has_completed_first_assessment THEN '/ (practitioner dashboard)'
        ELSE '/welcome'
    END as expected_route
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'coach.test@example.com';

-- 3. Check if there's an auto-created profile for the coach auth user
SELECT 
    'Auto-created Profile Check' as check_type,
    id,
    full_name,
    role,
    roles,
    has_completed_first_assessment,
    created_at,
    updated_at
FROM profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'coach.test@example.com');

-- 4. Show all profiles with coach role for comparison
SELECT 
    'All Coach Profiles' as check_type,
    id,
    full_name,
    role,
    roles,
    has_completed_first_assessment,
    organization_id,
    CASE 
        WHEN id = (SELECT id FROM auth.users WHERE email = 'coach.test@example.com') THEN 'THIS IS THE LOGGED IN USER'
        ELSE 'Different profile'
    END as login_status
FROM profiles 
WHERE roles @> ARRAY['coach'] OR role = 'coach'
ORDER BY created_at;