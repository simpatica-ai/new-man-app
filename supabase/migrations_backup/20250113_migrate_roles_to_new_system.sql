-- Migration: Migrate Existing Roles to New Clear Role System
-- Date: 2025-01-13
-- Description: Converts existing simple role values to new clear role system with arrays

-- ============================================================================
-- 1. ANALYZE CURRENT ROLE DISTRIBUTION
-- ============================================================================

-- Show current role distribution before migration
SELECT 
  'BEFORE MIGRATION' as status,
  role,
  COUNT(*) as user_count,
  ARRAY_AGG(DISTINCT COALESCE(organization_id::text, 'no_org')) as org_status
FROM public.profiles 
WHERE role IS NOT NULL
GROUP BY role
ORDER BY user_count DESC;

-- ============================================================================
-- 2. MIGRATE ROLES BASED ON ORGANIZATION CONTEXT
-- ============================================================================

-- Update roles based on current role and organization context
-- This handles the production scenario where roles are simple strings

-- 2a. Migrate 'admin' users
UPDATE public.profiles 
SET roles = CASE 
  -- If admin has no organization, they're likely the system admin
  WHEN organization_id IS NULL THEN ARRAY['sys-admin']
  -- If admin has organization, they're organization admin
  ELSE ARRAY['org-admin']
END
WHERE role = 'admin';

-- 2b. Migrate 'sponsor' users  
UPDATE public.profiles 
SET roles = CASE 
  -- Sponsors become individual sponsors (legacy model)
  WHEN organization_id IS NULL THEN ARRAY['ind-sponsor']
  -- Sponsors in organizations become coaches
  ELSE ARRAY['org-coach']
END
WHERE role = 'sponsor';

-- 2c. Migrate 'user' and 'practitioner' users
UPDATE public.profiles 
SET roles = CASE 
  -- Users without organization remain individual practitioners
  WHEN organization_id IS NULL THEN ARRAY['ind-practitioner']
  -- Users with organization become org practitioners
  ELSE ARRAY['org-practitioner']
END
WHERE role IN ('user', 'practitioner');

-- 2d. Handle any 'coach' or 'therapist' roles (if they exist in dev)
UPDATE public.profiles 
SET roles = CASE 
  WHEN role = 'coach' AND organization_id IS NULL THEN ARRAY['ind-sponsor']
  WHEN role = 'coach' AND organization_id IS NOT NULL THEN ARRAY['org-coach']
  WHEN role = 'therapist' AND organization_id IS NULL THEN ARRAY['ind-sponsor'] 
  WHEN role = 'therapist' AND organization_id IS NOT NULL THEN ARRAY['org-therapist']
  ELSE roles -- Keep existing if already set
END
WHERE role IN ('coach', 'therapist') AND (roles IS NULL OR roles = ARRAY[]::TEXT[]);

-- 2e. Handle NULL or empty roles (set default based on organization)
UPDATE public.profiles 
SET roles = CASE 
  WHEN organization_id IS NULL THEN ARRAY['ind-practitioner']
  ELSE ARRAY['org-practitioner']
END
WHERE (role IS NULL OR role = '') AND (roles IS NULL OR roles = ARRAY[]::TEXT[]);

-- ============================================================================
-- 3. SPECIAL CASE: ENSURE SYSTEM ADMIN IS SET CORRECTLY
-- ============================================================================

-- Ensure the system administrator (bwenzlau@simpatica.ai) has sys-admin role
UPDATE public.profiles 
SET roles = ARRAY['sys-admin']
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'bwenzlau@simpatica.ai'
);

-- ============================================================================
-- 4. HANDLE MULTI-ROLE USERS (for development database)
-- ============================================================================

-- For users who might have multiple roles in development, preserve them with new naming
UPDATE public.profiles 
SET roles = ARRAY(
  SELECT DISTINCT CASE 
    WHEN unnest_role = 'admin' AND organization_id IS NULL THEN 'sys-admin'
    WHEN unnest_role = 'admin' AND organization_id IS NOT NULL THEN 'org-admin'
    WHEN unnest_role = 'coach' THEN 'org-coach'
    WHEN unnest_role = 'therapist' THEN 'org-therapist'
    WHEN unnest_role = 'practitioner' AND organization_id IS NOT NULL THEN 'org-practitioner'
    WHEN unnest_role = 'practitioner' AND organization_id IS NULL THEN 'ind-practitioner'
    WHEN unnest_role = 'sponsor' THEN 'ind-sponsor'
    WHEN unnest_role = 'user' AND organization_id IS NOT NULL THEN 'org-practitioner'
    WHEN unnest_role = 'user' AND organization_id IS NULL THEN 'ind-practitioner'
    ELSE unnest_role -- Keep any other roles as-is
  END
  FROM unnest(roles) AS unnest_role
  WHERE unnest_role IS NOT NULL
)
WHERE roles IS NOT NULL 
  AND array_length(roles, 1) > 0 
  AND EXISTS (
    SELECT 1 FROM unnest(roles) AS r 
    WHERE r IN ('admin', 'coach', 'therapist', 'practitioner', 'sponsor', 'user')
  );

-- ============================================================================
-- 5. VERIFY MIGRATION RESULTS
-- ============================================================================

-- Show role distribution after migration
SELECT 
  'AFTER MIGRATION' as status,
  unnest(roles) as new_role,
  COUNT(*) as user_count,
  COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as with_org,
  COUNT(CASE WHEN organization_id IS NULL THEN 1 END) as without_org
FROM public.profiles 
WHERE roles IS NOT NULL AND array_length(roles, 1) > 0
GROUP BY unnest(roles)
ORDER BY user_count DESC;

-- Show users with multiple roles
SELECT 
  'MULTI-ROLE USERS' as status,
  full_name,
  roles,
  organization_id IS NOT NULL as has_organization
FROM public.profiles 
WHERE array_length(roles, 1) > 1
ORDER BY full_name;

-- Show system administrators
SELECT 
  'SYSTEM ADMINISTRATORS' as status,
  p.full_name,
  au.email,
  p.roles
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
WHERE 'sys-admin' = ANY(p.roles);

-- ============================================================================
-- 6. VALIDATION CHECKS
-- ============================================================================

-- Check for any users without roles
SELECT 
  'USERS WITHOUT ROLES' as issue,
  COUNT(*) as count
FROM public.profiles 
WHERE roles IS NULL OR roles = ARRAY[]::TEXT[] OR array_length(roles, 1) = 0;

-- Check for any old role values still in the roles array
SELECT 
  'OLD ROLES STILL PRESENT' as issue,
  unnest(roles) as old_role,
  COUNT(*) as count
FROM public.profiles 
WHERE roles && ARRAY['admin', 'sponsor', 'user']::TEXT[]
GROUP BY unnest(roles);

-- ============================================================================
-- 7. COMMENTS AND DOCUMENTATION
-- ============================================================================

/*
ROLE MIGRATION SUMMARY:

Production Migration (simple role strings):
- admin (no org) → sys-admin
- admin (with org) → org-admin  
- sponsor → ind-sponsor (or org-coach if in org)
- user/practitioner (no org) → ind-practitioner
- user/practitioner (with org) → org-practitioner

Development Migration (role arrays):
- Preserves multi-role users
- Updates role names to new system
- Maintains organizational context

New Role System Benefits:
1. Clear distinction: sys-admin vs org-admin vs ind-sponsor
2. Organizational context: org- prefix for organization members
3. Individual context: ind- prefix for legacy individual users
4. Future-proof: supports multiple roles per user
5. Backward compatible: old roles still work during transition
*/

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================