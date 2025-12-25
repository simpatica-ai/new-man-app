-- Test what data the routing logic would see for coach auth users

-- Simulate the routing query for any coach-related auth users
SELECT 
    'Routing Query Simulation' as check_type,
    au.email,
    au.id as session_user_id,
    p.has_completed_first_assessment,
    p.roles,
    p.organization_id,
    p.full_name,
    -- Simulate the routing logic
    CASE 
        WHEN p.roles IS NULL THEN 'No roles - would go to /welcome'
        WHEN p.roles @> ARRAY['admin'] AND p.organization_id IS NOT NULL THEN 'Would go to /orgadmin'
        WHEN p.roles @> ARRAY['coach'] AND NOT p.has_completed_first_assessment THEN 'Would go to /coach/dashboard'
        WHEN p.roles @> ARRAY['therapist'] AND NOT p.has_completed_first_assessment THEN 'Would go to /therapist'
        WHEN p.has_completed_first_assessment THEN 'Would go to practitioner dashboard'
        ELSE 'Would go to /welcome'
    END as routing_decision
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email LIKE '%coach%' OR au.email LIKE '%test%'
ORDER BY au.email;

-- Also check if there are multiple profiles that could be linked
SELECT 
    'All Profiles Check' as check_type,
    id,
    full_name,
    roles,
    has_completed_first_assessment,
    created_at,
    CASE 
        WHEN id IN (SELECT id FROM auth.users WHERE email LIKE '%coach%') THEN 'HAS AUTH USER'
        ELSE 'NO AUTH USER'
    END as auth_status
FROM profiles 
WHERE full_name LIKE '%Coach%' OR roles @> ARRAY['coach']
ORDER BY created_at;