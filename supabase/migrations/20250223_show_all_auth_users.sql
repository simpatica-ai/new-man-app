-- Show all auth users and their linked profiles to find the coach

SELECT 
    'All Auth Users and Profiles' as check_type,
    au.id as auth_id,
    au.email,
    au.created_at as auth_created,
    p.id as profile_id,
    p.full_name,
    p.roles,
    p.has_completed_first_assessment,
    CASE 
        WHEN p.roles @> ARRAY['coach'] AND NOT p.has_completed_first_assessment THEN '→ /coach/dashboard'
        WHEN p.roles @> ARRAY['therapist'] AND NOT p.has_completed_first_assessment THEN '→ /therapist'
        WHEN p.has_completed_first_assessment THEN '→ practitioner dashboard'
        WHEN p.roles IS NULL OR array_length(p.roles, 1) IS NULL THEN '→ /welcome'
        ELSE '→ /welcome'
    END as expected_route
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.created_at > NOW() - INTERVAL '7 days'  -- Recent users only
ORDER BY au.created_at DESC;

-- Also check if coach.test@example.com exists at all
SELECT 
    'Coach Test Email Check' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'coach.test@example.com does NOT exist in auth.users'
        ELSE 'coach.test@example.com EXISTS in auth.users'
    END as status
FROM auth.users 
WHERE email = 'coach.test@example.com';