-- Production Migration: Organizational Model Performance Indexes
-- Phase 3: Add performance indexes for organizational queries
-- This script creates indexes to optimize organizational model queries

-- Indexes for profiles table organizational queries
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

-- Indexes for practitioner_assignments table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_practitioner_assignments_active 
  ON practitioner_assignments(organization_id, active) 
  WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_practitioner_assignments_supervisor_role 
  ON practitioner_assignments(supervisor_id, supervisor_role, active) 
  WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_practitioner_assignments_practitioner_active 
  ON practitioner_assignments(practitioner_id, active) 
  WHERE active = true;

-- Indexes for organization_invitations table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_invitations_pending 
  ON organization_invitations(organization_id, expires_at) 
  WHERE accepted_at IS NULL AND expires_at > NOW();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organization_invitations_email_pending 
  ON organization_invitations(email) 
  WHERE accepted_at IS NULL;

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_org_role_activity 
  ON profiles(organization_id, is_active, last_activity DESC) 
  WHERE is_active = true;

-- Index for virtue progress queries within organizations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_virtue_progress_org 
  ON user_virtue_progress(user_id, virtue_id, updated_at DESC);

-- Index for journal entries organizational queries (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'journal_entries') THEN
    EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_journal_entries_user_created 
             ON journal_entries(user_id, created_at DESC)';
  END IF;
END $$;

-- Index for assessments organizational queries (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessments') THEN
    EXECUTE 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessments_user_created 
             ON assessments(user_id, created_at DESC)';
  END IF;
END $$;

-- Partial indexes for specific organizational roles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_admins 
  ON profiles(organization_id, id) 
  WHERE 'admin' = ANY(roles) AND is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_coaches 
  ON profiles(organization_id, id) 
  WHERE 'coach' = ANY(roles) AND is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_therapists 
  ON profiles(organization_id, id) 
  WHERE 'therapist' = ANY(roles) AND is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_practitioners 
  ON profiles(organization_id, id) 
  WHERE 'practitioner' = ANY(roles) AND is_active = true;

-- Index for organization settings and branding queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_active 
  ON organizations(subscription_status, subscription_tier) 
  WHERE subscription_status = 'active';

-- Index for billing and subscription queries (future use)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_billing 
  ON organizations(next_billing_date) 
  WHERE next_billing_date IS NOT NULL AND subscription_status = 'active';

-- Statistics update to help query planner
ANALYZE profiles;
ANALYZE organizations;
ANALYZE practitioner_assignments;
ANALYZE organization_invitations;

-- Create a function to monitor index usage
CREATE OR REPLACE FUNCTION get_organizational_index_usage()
RETURNS TABLE(
  schemaname TEXT,
  tablename TEXT,
  indexname TEXT,
  idx_scan BIGINT,
  idx_tup_read BIGINT,
  idx_tup_fetch BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.schemaname::TEXT,
    s.tablename::TEXT,
    s.indexname::TEXT,
    s.idx_scan,
    s.idx_tup_read,
    s.idx_tup_fetch
  FROM pg_stat_user_indexes s
  WHERE s.indexname LIKE 'idx_%org%' 
     OR s.indexname LIKE 'idx_profiles_%'
     OR s.indexname LIKE 'idx_practitioner_%'
     OR s.indexname LIKE 'idx_organization_%'
  ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comments for index documentation
COMMENT ON INDEX idx_profiles_org_active IS 'Optimizes queries for active users within organizations';
COMMENT ON INDEX idx_profiles_org_roles IS 'Optimizes queries for users with supervisory roles';
COMMENT ON INDEX idx_practitioner_assignments_active IS 'Optimizes queries for active practitioner assignments';
COMMENT ON INDEX idx_organization_invitations_pending IS 'Optimizes queries for pending invitations';

-- Log index creation completion
DO $$
BEGIN
  RAISE NOTICE 'Organizational model indexes created successfully at %', NOW();
  RAISE NOTICE 'Run SELECT * FROM get_organizational_index_usage() to monitor index performance';
END $$;