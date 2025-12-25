-- Get the User IDs of the newly created auth users
-- This will show the IDs we need to link to existing profiles

SELECT 
    'New Auth Users' as check_type,
    id as user_id,
    email,
    created_at,
    email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
WHERE email IN (
    'coach.test@example.com',
    'therapist.test@example.com', 
    'practitioner1.test@example.com',
    'practitioner2.test@example.com'
)
ORDER BY email;

-- Also show existing test profiles that need to be updated
SELECT 
    'Existing Test Profiles' as check_type,
    id as profile_id,
    full_name,
    role,
    organization_id
FROM profiles 
WHERE full_name LIKE '%Test%' 
   OR full_name LIKE '%Alex Rivera%'
   OR full_name LIKE '%Jamie Thompson%'
ORDER BY full_name;