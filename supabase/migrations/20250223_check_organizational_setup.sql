-- Check what organizational setup exists and what's missing

-- 1. Check if organizational functions exist
SELECT 
    'Functions Check' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'can_access_practitioner_data') 
        THEN 'can_access_practitioner_data EXISTS'
        ELSE 'can_access_practitioner_data MISSING'
    END as can_access_function,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_accessible_practitioners') 
        THEN 'get_accessible_practitioners EXISTS'
        ELSE 'get_accessible_practitioners MISSING'
    END as get_accessible_function;

-- 2. Check if test users exist
SELECT 
    'Test Users Check' as check_type,
    COUNT(*) as total_test_users,
    COUNT(CASE WHEN full_name LIKE '%Test Coach%' THEN 1 END) as coaches,
    COUNT(CASE WHEN full_name LIKE '%Test Therapist%' THEN 1 END) as therapists,
    COUNT(CASE WHEN full_name LIKE '%Test Practitioner%' THEN 1 END) as practitioners
FROM profiles 
WHERE full_name LIKE '%Test%';

-- 3. Check practitioner_assignments table
SELECT 
    'Assignments Check' as check_type,
    COUNT(*) as total_assignments,
    COUNT(CASE WHEN active = true THEN 1 END) as active_assignments
FROM practitioner_assignments;

-- 4. Check if Sample Therapy Center exists
SELECT 
    'Organization Check' as check_type,
    id as org_id,
    name as org_name,
    (SELECT COUNT(*) FROM profiles WHERE organization_id = organizations.id) as member_count
FROM organizations 
WHERE name LIKE '%Sample%Therapy%Center%' OR name LIKE '%Therapy%Center%'
LIMIT 1;

-- 5. Check RLS policies on key tables
SELECT 
    'RLS Policies Check' as check_type,
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'practitioner_assignments', 'user_activity_sessions')
GROUP BY schemaname, tablename
ORDER BY tablename;