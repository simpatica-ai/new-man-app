-- Migration: Implement Clear Role System
-- Date: 2025-01-13
-- Description: Updates role system to be more explicit about organizational vs individual vs system roles

-- ============================================================================
-- 1. SET SYSTEM ADMINISTRATOR ROLE
-- ============================================================================

-- Update the system administrator to have sys-admin role
-- Email is in auth.users, so we need to join to find the correct profile
UPDATE public.profiles 
SET roles = ARRAY['sys-admin']
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'bwenzlau@simpatica.ai'
);

-- ============================================================================
-- 2. MIGRATE EXISTING ROLES TO NEW SYSTEM (when organizational model is deployed)
-- ============================================================================

-- This will be executed after organizational tables exist
-- For now, we document the migration strategy

/*
ROLE MIGRATION STRATEGY:

Current System → New System:
- admin (no org) → sys-admin (system administrator)
- admin (with org) → org-admin (organization administrator)  
- coach → org-coach (organization coach)
- therapist → org-therapist (organization therapist)
- practitioner (with org) → org-practitioner (organization practitioner)
- practitioner (no org) → ind-practitioner (individual practitioner)
- sponsor → ind-sponsor (individual sponsor)

New Role Definitions:
- sys-admin: Full system access, can manage all organizations
- org-admin: Manages their organization, invites users, assigns roles
- org-coach: Supervises org-practitioners, creates reports
- org-therapist: Clinical oversight of org-practitioners
- org-practitioner: Does virtue work within organization
- ind-sponsor: Legacy individual sponsor relationship
- ind-practitioner: Legacy individual practitioner

Benefits:
1. Clear distinction between system, organizational, and individual roles
2. Easy to query: SELECT * FROM profiles WHERE 'org-admin' = ANY(roles)
3. Future-proof for multi-role users
4. Backward compatible during transition
*/

-- ============================================================================
-- 3. CREATE ROLE VALIDATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_user_roles(user_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  valid_roles TEXT[] := ARRAY[
    'sys-admin',
    'org-admin', 'org-coach', 'org-therapist', 'org-practitioner',
    'ind-sponsor', 'ind-practitioner',
    -- Legacy roles for backward compatibility
    'admin', 'coach', 'therapist', 'practitioner', 'sponsor'
  ];
  role TEXT;
BEGIN
  FOREACH role IN ARRAY user_roles
  LOOP
    IF NOT (role = ANY(valid_roles)) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. ADD ROLE VALIDATION CONSTRAINT (when ready)
-- ============================================================================

-- This constraint will be added after migration is complete
-- ALTER TABLE public.profiles 
-- ADD CONSTRAINT valid_roles_check 
-- CHECK (validate_user_roles(roles));

-- ============================================================================
-- 5. CREATE HELPER FUNCTIONS FOR ROLE CHECKING
-- ============================================================================

-- Function to check if user has system admin access
CREATE OR REPLACE FUNCTION has_system_admin_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_roles TEXT[];
BEGIN
  SELECT roles INTO user_roles FROM public.profiles WHERE id = user_id;
  RETURN 'sys-admin' = ANY(user_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has organization admin access
CREATE OR REPLACE FUNCTION has_org_admin_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_roles TEXT[];
BEGIN
  SELECT roles INTO user_roles FROM public.profiles WHERE id = user_id;
  RETURN 'sys-admin' = ANY(user_roles) OR 'org-admin' = ANY(user_roles) OR 'admin' = ANY(user_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can supervise others
CREATE OR REPLACE FUNCTION can_supervise_users(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_roles TEXT[];
BEGIN
  SELECT roles INTO user_roles FROM public.profiles WHERE id = user_id;
  RETURN 'sys-admin' = ANY(user_roles) 
    OR 'org-admin' = ANY(user_roles) 
    OR 'org-coach' = ANY(user_roles)
    OR 'org-therapist' = ANY(user_roles)
    OR 'ind-sponsor' = ANY(user_roles)
    -- Backward compatibility
    OR 'admin' = ANY(user_roles)
    OR 'coach' = ANY(user_roles)
    OR 'therapist' = ANY(user_roles)
    OR 'sponsor' = ANY(user_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_user_roles(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION has_system_admin_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_org_admin_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_supervise_users(UUID) TO authenticated;

-- ============================================================================
-- 6. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION validate_user_roles(TEXT[]) IS 'Validates that all roles in array are valid system roles';
COMMENT ON FUNCTION has_system_admin_access(UUID) IS 'Checks if user has system administrator access';
COMMENT ON FUNCTION has_org_admin_access(UUID) IS 'Checks if user has organization administrator access';
COMMENT ON FUNCTION can_supervise_users(UUID) IS 'Checks if user can supervise other users';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Verify system administrator role was set
SELECT 'System Administrator Role Set' as status, 
       p.full_name, au.email, p.roles 
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email = 'bwenzlau@simpatica.ai';