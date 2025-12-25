-- Fix coach assessment status so they route to coach dashboard
-- Coaches should not have completed practitioner assessment

UPDATE profiles 
SET has_completed_first_assessment = false
WHERE id = '54ec0332-94cb-4743-b7e1-9f55b7ce1ec9'  -- Sarah Johnson (Test Coach)
AND full_name LIKE '%Test Coach%';

-- Also fix therapist assessment status
UPDATE profiles 
SET has_completed_first_assessment = false  
WHERE id = '867904d9-a102-44a4-9c1e-002e4f1b6f4e'  -- Dr. Michael Chen (Test Therapist)
AND full_name LIKE '%Test Therapist%';

-- Verify the changes
SELECT 
    'Updated Profiles' as check_type,
    id,
    full_name,
    role,
    roles,
    has_completed_first_assessment,
    CASE 
        WHEN role = 'coach' AND NOT has_completed_first_assessment THEN 'Will route to /coach/dashboard'
        WHEN role = 'therapist' AND NOT has_completed_first_assessment THEN 'Will route to /therapist'
        WHEN has_completed_first_assessment THEN 'Will route to practitioner dashboard'
        ELSE 'Will route to /welcome'
    END as expected_routing
FROM profiles 
WHERE full_name LIKE '%Test Coach%' OR full_name LIKE '%Test Therapist%'
ORDER BY full_name;