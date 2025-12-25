-- Fix therapist organization assignment

-- Update the therapist to be part of the Sample Therapy Center organization
UPDATE profiles 
SET organization_id = '73fc48d6-448d-4eeb-96a9-2717c3013ab3'
WHERE id = '2ee384ec-1b87-4a96-8a1d-719abdcb0a21';

-- Verify the therapist is now properly set up
SELECT 
    'Fixed Therapist Profile' as check_type,
    p.id,
    p.full_name,
    p.role,
    p.roles,
    p.has_completed_first_assessment,
    p.organization_id,
    o.name as organization_name
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
WHERE p.id = '2ee384ec-1b87-4a96-8a1d-719abdcb0a21';