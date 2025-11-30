-- Fixed Production Migration: Organizational Model Updates
-- This script safely updates the existing organizational model with production-ready features
-- It checks for existing structures and only adds what's missing

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. UPDATE ORGANIZATIONS TABLE (if needed)
-- ============================================================================

-- Check and update organizations table constraints and fields
DO $$
BEGIN
  -- Add legacy subscription tier if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%subscription_tier%' 
    AND check_clause LIKE '%legacy%'
  ) THEN
    -- Drop existing constraint and recreate with legacy option
    ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_tier_check;
    ALTER TABLE organizations ADD CONSTRAINT organizations_subscription_tier_check 
      CHECK (subscription_tier IN ('basic', 'premium', 'enterprise', 'legacy'));
    
    RAISE NOTICE 'Added legacy subscription tier option';
  END IF;
  
  -- Update max_users constraint to allow higher limits for legacy organizations
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%max_users_limit%' 
    AND check_clause LIKE '%<= 40%'
  ) THEN
    -- Drop existing constraint and recreate with higher limit
    ALTER TABLE organizations DROP CONSTRAINT IF EXISTS max_users_limit;
    ALTER TABLE organizations ADD CONSTRAINT max_users_limit 
      CHECK (max_users <= 1000); -- Allow higher limits for legacy migration
    
    RAISE NOTICE 'Updated max_users constraint to allow up to 1000 users';
  END IF;
  
  -- Add billing fields if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'billing_email') THEN
    ALTER TABLE organizations ADD COLUMN billing_email TEXT;
    RAISE NOTICE 'Added billing_email column';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'payment_method_id') THEN
    ALTER TABLE organizations ADD COLUMN payment_method_id TEXT;
    RAISE NOTICE 'Added payment_method_id column';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'next_billing_date') THEN
    ALTER TABLE organizations ADD COLUMN next_billing_date TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added next_billing_date column';
  END IF;
END $$;

-- ============================================================================
-- 2. ENSURE ALL REQUIRED INDEXES EXIST
-- ============================================================================

-- Create indexes only if they don't exist
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_org_active 
  ON profiles(organization_id, is_active) 
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_org_roles 
  ON profiles(organization_id) 
  WHERE 'admin' = ANY(roles) OR 'coach' = ANY(roles) OR 'therapist' = ANY(roles);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_last_activity_desc 
  ON profiles(last_activity DESC NULLS LAST) 
  WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_current_virtue 
  ON profiles(current_virtue_id, current_stage) 
  WHERE current_virtue_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_practitioner_assignments_active 
  ON practitioner_assignments(organization_id, active) 
  WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_practitioner_assignments_supervisor_role 
  ON practitioner_assignments(supervisor_id, supervisor_role, active) 
  WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_invitations_pending 
  ON organization_invitations(organization_id, expires_at) 
  WHERE accepted_at IS NULL AND expires_at > NOW();

-- ============================================================================
-- 3. ADD MISSING FUNCTIONS FOR PRODUCTION
-- ============================================================================

-- Enhanced function to get organizational health metrics
CREATE OR REPLACE FUNCTION get_organizational_health_metrics()
RETURNS TABLE(
  organization_id UUID,
  organization_name TEXT,
  active_users INTEGER,
  total_assignments INTEGER,
  recent_activity_users INTEGER,
  health_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id as organization_id,
    o.name as organization_name,
    o.active_user_count as active_users,
    COALESCE(pa_count.assignment_count, 0) as total_assignments,
    COALESCE(recent_activity.recent_count, 0) as recent_activity_users,
    CASE 
      WHEN o.active_user_count = 0 THEN 0
      ELSE ROUND(
        (COALESCE(recent_activity.recent_count, 0)::NUMERIC / o.active_user_count::NUMERIC) * 100, 
        2
      )
    END as health_score
  FROM organizations o
  LEFT JOIN (
    SELECT 
      organization_id,
      COUNT(*) as assignment_count
    FROM practitioner_assignments 
    WHERE active = true
    GROUP BY organization_id
  ) pa_count ON o.id = pa_count.organization_id
  LEFT JOIN (
    SELECT 
      organization_id,
      COUNT(*) as recent_count
    FROM profiles 
    WHERE last_activity > NOW() - INTERVAL '7 days'
    AND is_active = true
    GROUP BY organization_id
  ) recent_activity ON o.id = recent_activity.organization_id
  WHERE o.subscription_status = 'active'
  ORDER BY o.active_user_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely migrate user to organization
CREATE OR REPLACE FUNCTION migrate_user_to_organization(
  p_user_id UUID,
  p_organization_id UUID,
  p_roles TEXT[] DEFAULT ARRAY['practitioner']
)
RETURNS BOOLEAN AS $$
DECLARE
  org_max_users INTEGER;
  org_active_count INTEGER;
BEGIN
  -- Get organization limits
  SELECT max_users, active_user_count
  INTO org_max_users, org_active_count
  FROM organizations
  WHERE id = p_organization_id;
  
  -- Check if organization has space
  IF org_active_count >= org_max_users THEN
    RAISE EXCEPTION 'Organization has reached maximum user limit of %', org_max_users;
  END IF;
  
  -- Update user
  UPDATE profiles
  SET 
    organization_id = p_organization_id,
    roles = p_roles,
    is_active = true,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Update organization active user count
  PERFORM update_organization_active_user_count(p_organization_id);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. ENSURE DATA CONSISTENCY
-- ============================================================================

-- Update any users without proper role assignments
UPDATE profiles 
SET roles = ARRAY['practitioner']
WHERE roles IS NULL OR array_length(roles, 1) = 0;

-- Update any users without organization assignments to default organization
DO $$
DECLARE
  default_org_id UUID;
  users_without_org INTEGER;
BEGIN
  -- Get default organization
  SELECT id INTO default_org_id 
  FROM organizations 
  WHERE slug = 'individual-users' 
  LIMIT 1;
  
  -- Count users without organization
  SELECT COUNT(*) INTO users_without_org
  FROM profiles 
  WHERE organization_id IS NULL;
  
  IF users_without_org > 0 AND default_org_id IS NOT NULL THEN
    -- Assign users to default organization
    UPDATE profiles
    SET 
      organization_id = default_org_id,
      updated_at = NOW()
    WHERE organization_id IS NULL;
    
    -- Update organization active user count
    PERFORM update_organization_active_user_count(default_org_id);
    
    RAISE NOTICE 'Assigned % users to default organization', users_without_org;
  END IF;
END $$;

-- Ensure all organizations have correct active user counts
DO $$
DECLARE
  org_record RECORD;
BEGIN
  FOR org_record IN SELECT id FROM organizations LOOP
    PERFORM update_organization_active_user_count(org_record.id);
  END LOOP;
  
  RAISE NOTICE 'Updated active user counts for all organizations';
END $$;

-- ============================================================================
-- 5. ADD PRODUCTION MONITORING VIEWS
-- ============================================================================

-- Create view for organization dashboard
CREATE OR REPLACE VIEW organization_dashboard AS
SELECT 
  o.id,
  o.name,
  o.slug,
  o.subscription_tier,
  o.subscription_status,
  o.active_user_count,
  o.max_users,
  ROUND((o.active_user_count::NUMERIC / o.max_users::NUMERIC) * 100, 2) as capacity_percentage,
  COUNT(pa.id) as total_assignments,
  COUNT(CASE WHEN p.last_activity > NOW() - INTERVAL '7 days' THEN 1 END) as recent_active_users,
  o.created_at,
  o.updated_at
FROM organizations o
LEFT JOIN profiles p ON o.id = p.organization_id AND p.is_active = true
LEFT JOIN practitioner_assignments pa ON o.id = pa.organization_id AND pa.active = true
GROUP BY o.id, o.name, o.slug, o.subscription_tier, o.subscription_status, 
         o.active_user_count, o.max_users, o.created_at, o.updated_at;

-- Create view for user activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  p.organization_id,
  o.name as organization_name,
  p.roles,
  p.is_active,
  p.last_activity,
  p.current_virtue_id,
  p.current_stage,
  CASE 
    WHEN p.last_activity > NOW() - INTERVAL '1 day' THEN 'Very Active'
    WHEN p.last_activity > NOW() - INTERVAL '7 days' THEN 'Active'
    WHEN p.last_activity > NOW() - INTERVAL '30 days' THEN 'Inactive'
    ELSE 'Very Inactive'
  END as activity_status,
  COUNT(je.id) as journal_entries_count,
  COUNT(uvp.id) as virtue_progress_count
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN journal_entries je ON p.id = je.user_id
LEFT JOIN user_virtue_progress uvp ON p.id = uvp.user_id
WHERE p.is_active = true
GROUP BY p.id, p.full_name, p.email, p.organization_id, o.name, p.roles, 
         p.is_active, p.last_activity, p.current_virtue_id, p.current_stage;

-- ============================================================================
-- 6. UPDATE RLS POLICIES FOR PRODUCTION
-- ============================================================================

-- Enhanced RLS policy for organization data access
DROP POLICY IF EXISTS "Organization members can view their organization" ON organizations;
CREATE POLICY "Organization members can view their organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

-- Policy for organization admins to view organization dashboard
CREATE POLICY "Organization admins can view dashboard data" ON organization_dashboard
  FOR SELECT USING (
    id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
        AND organization_id IS NOT NULL 
        AND 'admin' = ANY(roles)
    )
  );

-- Enable RLS on the new view
ALTER VIEW organization_dashboard SET (security_barrier = true);

-- ============================================================================
-- 7. ADD COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION get_organizational_health_metrics() IS 'Returns health metrics for all organizations';
COMMENT ON FUNCTION migrate_user_to_organization(UUID, UUID, TEXT[]) IS 'Safely migrates a user to an organization with role assignment';
COMMENT ON VIEW organization_dashboard IS 'Dashboard view for organization administrators';
COMMENT ON VIEW user_activity_summary IS 'Summary view of user activity across organizations';

-- ============================================================================
-- 8. FINAL VALIDATION
-- ============================================================================

-- Validate that all required structures exist
DO $$
DECLARE
  missing_items TEXT := '';
  validation_passed BOOLEAN := true;
BEGIN
  -- Check required tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public') THEN
    missing_items := missing_items || 'organizations table; ';
    validation_passed := false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practitioner_assignments' AND table_schema = 'public') THEN
    missing_items := missing_items || 'practitioner_assignments table; ';
    validation_passed := false;
  END IF;
  
  -- Check required columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id' AND table_schema = 'public') THEN
    missing_items := missing_items || 'profiles.organization_id column; ';
    validation_passed := false;
  END IF;
  
  -- Check required functions
  IF NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_organizational_health_metrics' AND routine_schema = 'public') THEN
    missing_items := missing_items || 'get_organizational_health_metrics function; ';
    validation_passed := false;
  END IF;
  
  IF validation_passed THEN
    RAISE NOTICE 'VALIDATION PASSED: All required organizational model structures exist';
  ELSE
    RAISE EXCEPTION 'VALIDATION FAILED: Missing items: %', missing_items;
  END IF;
END $$;

RAISE NOTICE 'Organizational model production fixes completed successfully';