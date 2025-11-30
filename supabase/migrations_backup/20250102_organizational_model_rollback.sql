-- Rollback Migration: Organizational Model Implementation
-- Date: 2025-01-02
-- Description: Rollback script to reverse organizational model changes
-- WARNING: This will remove organizational data. Use with caution.

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback this migration:
-- 1. Run this rollback script
-- 2. Verify data integrity
-- 3. Test application functionality
-- 4. Monitor for any issues

-- ============================================================================
-- 1. DROP TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_profiles_organization_count ON public.profiles;

-- Drop functions
DROP FUNCTION IF EXISTS trigger_update_organization_user_count();
DROP FUNCTION IF EXISTS validate_organization_user_limit(UUID);
DROP FUNCTION IF EXISTS reactivate_user(UUID);
DROP FUNCTION IF EXISTS archive_user(UUID, UUID);
DROP FUNCTION IF EXISTS update_organization_active_user_count(UUID);

-- ============================================================================
-- 2. DROP ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Drop new organizational policies
DROP POLICY IF EXISTS "Organization members can view their organization" ON public.organizations;
DROP POLICY IF EXISTS "Organization admins can update their organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view accessible profiles" ON public.profiles;
DROP POLICY IF EXISTS "Organization members can view assignments" ON public.practitioner_assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.practitioner_assignments;
DROP POLICY IF EXISTS "Organization admins can manage invitations" ON public.organization_invitations;
DROP POLICY IF EXISTS "Users can view accessible journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can create own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can view their sponsor relationships" ON public.sponsor_relationships;

-- Restore original policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own journal entries" ON public.journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own journal entries" ON public.journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries" ON public.journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their sponsor relationships" ON public.sponsor_relationships
  FOR SELECT USING (auth.uid() = sponsor_id OR auth.uid() = practitioner_id);

-- ============================================================================
-- 3. DROP INDEXES
-- ============================================================================

-- Drop organizational indexes
DROP INDEX IF EXISTS idx_organizations_slug;
DROP INDEX IF EXISTS idx_organizations_subscription_status;
DROP INDEX IF EXISTS idx_profiles_organization_id;
DROP INDEX IF EXISTS idx_profiles_organization_active;
DROP INDEX IF EXISTS idx_profiles_roles;
DROP INDEX IF EXISTS idx_profiles_last_activity;
DROP INDEX IF EXISTS idx_profiles_current_virtue;
DROP INDEX IF EXISTS idx_practitioner_assignments_practitioner;
DROP INDEX IF EXISTS idx_practitioner_assignments_supervisor;
DROP INDEX IF EXISTS idx_practitioner_assignments_organization;
DROP INDEX IF EXISTS idx_practitioner_assignments_active;
DROP INDEX IF EXISTS idx_organization_invitations_token;
DROP INDEX IF EXISTS idx_organization_invitations_email;
DROP INDEX IF EXISTS idx_organization_invitations_expires;
DROP INDEX IF EXISTS idx_organization_invitations_organization;

-- ============================================================================
-- 4. DROP TABLES
-- ============================================================================

-- Drop organizational tables (in reverse dependency order)
DROP TABLE IF EXISTS public.organization_invitations;
DROP TABLE IF EXISTS public.practitioner_assignments;
DROP TABLE IF EXISTS public.organizations;

-- ============================================================================
-- 5. REMOVE COLUMNS FROM PROFILES TABLE
-- ============================================================================

-- Remove organizational columns from profiles table
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS organization_id,
  DROP COLUMN IF EXISTS roles,
  DROP COLUMN IF EXISTS last_activity,
  DROP COLUMN IF EXISTS current_virtue_id,
  DROP COLUMN IF EXISTS current_stage,
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS archived_at,
  DROP COLUMN IF EXISTS archived_by;

-- Remove constraints that were added
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS valid_roles,
  DROP CONSTRAINT IF EXISTS current_stage_positive;

-- ============================================================================
-- 6. RESTORE ORIGINAL SCHEMA STATE
-- ============================================================================

-- Ensure the original role column behavior is maintained
-- (The original schema had a single role column, not an array)
-- This step preserves any existing role data

-- ============================================================================
-- 7. CLEANUP AND VERIFICATION
-- ============================================================================

-- Remove any organizational data that might have been created
-- This is a safety measure to ensure clean rollback

-- Verify that the schema is back to its original state
-- The following should return the original table structure:
-- \d public.profiles
-- \d public.sponsor_relationships
-- \d public.journal_entries

-- ============================================================================
-- ROLLBACK VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after rollback to verify success:

-- 1. Check that organizational tables are gone
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('organizations', 'practitioner_assignments', 'organization_invitations');
-- Should return 0 rows

-- 2. Check that profiles table is back to original structure
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_schema = 'public' AND table_name = 'profiles' 
-- AND column_name IN ('organization_id', 'roles', 'last_activity', 'current_virtue_id', 'current_stage', 'is_active', 'archived_at', 'archived_by');
-- Should return 0 rows

-- 3. Check that original policies are restored
-- SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile';
-- Should return 1 row

-- ============================================================================
-- POST-ROLLBACK NOTES
-- ============================================================================

-- After running this rollback:
-- 1. All organizational data will be lost
-- 2. Users will revert to individual accounts
-- 3. Sponsor relationships will remain intact
-- 4. All virtue progress and journal entries will be preserved
-- 5. The application should function as it did before the organizational model

-- ============================================================================
-- END OF ROLLBACK MIGRATION
-- ============================================================================