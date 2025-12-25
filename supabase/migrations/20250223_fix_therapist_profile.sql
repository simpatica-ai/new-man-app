-- Fix therapist profile to have correct role and data

-- Update the therapist profile to have correct role and name
UPDATE profiles 
SET 
    roles = ARRAY['therapist'],
    full_name = 'Dr. Michael Chen (Test Therapist)',
    role = 'therapist'
WHERE id = '2ee384ec-1b87-4a96-8a1d-719abdcb0a21';

-- Verify the update
SELECT 
    'Updated Therapist Profile' as check_type,
    id,
    full_name,
    role,
    roles,
    has_completed_first_assessment,
    organization_id
FROM profiles 
WHERE id = '2ee384ec-1b87-4a96-8a1d-719abdcb0a21';