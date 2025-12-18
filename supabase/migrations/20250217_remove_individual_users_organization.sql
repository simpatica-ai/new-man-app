-- Migration: Remove "Individual Users" fake organization
-- This migration converts legacy users back to true individual practitioners
-- so they can access payment features as intended.
--
-- Background: The organizational model migration automatically assigned all
-- existing users to a default "Individual Users" organization. This caused
-- individual practitioners to be treated as organization members, blocking
-- their access to payment features.
--
-- This migration:
-- 1. Removes organization_id from users in "Individual Users" org
-- 2. Preserves any real organizations and their members
-- 3. Optionally removes the "Individual Users" organization
-- 4. Maintains data integrity and provides rollback capability

-- Step 1: Create backup of current state for rollback
CREATE TABLE IF NOT EXISTS profiles_backup_20250217 AS 
SELECT * FROM profiles 
WHERE organization_id IN (
  SELECT id FROM organizations WHERE slug = 'individual-users'
);

-- Step 2: Get the "Individual Users" organization ID
DO $$
DECLARE
  individual_users_org_id UUID;
  affected_users_count INTEGER;
BEGIN
  -- Find the fake organization
  SELECT id INTO individual_users_org_id 
  FROM organizations 
  WHERE slug = 'individual-users';
  
  IF individual_users_org_id IS NULL THEN
    RAISE NOTICE 'No "Individual Users" organization found. Migration not needed.';
    RETURN;
  END IF;
  
  -- Count affected users
  SELECT COUNT(*) INTO affected_users_count
  FROM profiles
  WHERE organization_id = individual_users_org_id;
  
  RAISE NOTICE 'Found "Individual Users" organization: %', individual_users_org_id;
  RAISE NOTICE 'Affected users: %', affected_users_count;
  
  -- Step 3: Remove organization_id from all users in "Individual Users" org
  -- This converts them back to individual practitioners
  UPDATE profiles
  SET 
    organization_id = NULL,
    updated_at = NOW()
  WHERE organization_id = individual_users_org_id;
  
  RAISE NOTICE 'Converted % users to individual practitioners', affected_users_count;
  
  -- Step 4: Remove practitioner assignments from "Individual Users" org
  -- These were legacy sponsor relationships that should remain as coach connections
  -- but not as organizational assignments
  DELETE FROM practitioner_assignments
  WHERE organization_id = individual_users_org_id;
  
  RAISE NOTICE 'Removed organizational practitioner assignments';
  
  -- Step 5: Update organization active user count (should be 0 now)
  UPDATE organizations
  SET 
    active_user_count = 0,
    updated_at = NOW()
  WHERE id = individual_users_org_id;
  
  -- Step 6: Optionally mark the organization as inactive instead of deleting
  -- This preserves the record for audit purposes
  UPDATE organizations
  SET 
    subscription_status = 'cancelled',
    settings = jsonb_set(
      COALESCE(settings, '{}'::jsonb),
      '{migration_removed}',
      to_jsonb(NOW()::text)
    ),
    updated_at = NOW()
  WHERE id = individual_users_org_id;
  
  RAISE NOTICE 'Marked "Individual Users" organization as cancelled';
  
  -- Verification: Check that users are now individual practitioners
  SELECT COUNT(*) INTO affected_users_count
  FROM profiles
  WHERE organization_id IS NULL
  AND id IN (SELECT id FROM profiles_backup_20250217);
  
  RAISE NOTICE 'Verification: % users are now individual practitioners', affected_users_count;
  
END $$;

-- Step 7: Create verification query
DO $$
DECLARE
  individual_count INTEGER;
  org_count INTEGER;
  legacy_org_id UUID;
BEGIN
  SELECT id INTO legacy_org_id FROM organizations WHERE slug = 'individual-users';
  
  SELECT COUNT(*) INTO individual_count 
  FROM profiles 
  WHERE organization_id IS NULL;
  
  SELECT COUNT(*) INTO org_count 
  FROM profiles 
  WHERE organization_id IS NOT NULL;
  
  RAISE NOTICE '=== Migration Summary ===';
  RAISE NOTICE 'Individual practitioners (no org): %', individual_count;
  RAISE NOTICE 'Organization members: %', org_count;
  RAISE NOTICE 'Legacy org status: %', 
    CASE 
      WHEN legacy_org_id IS NULL THEN 'Not found'
      ELSE 'Cancelled'
    END;
  RAISE NOTICE '========================';
END $$;

-- Add comment for documentation
COMMENT ON TABLE profiles_backup_20250217 IS 
  'Backup of profiles before removing Individual Users organization. Created: 2025-02-17. Can be used for rollback if needed.';

-- Rollback instructions (for reference, not executed):
/*
-- To rollback this migration:

-- 1. Restore organization_id from backup
UPDATE profiles p
SET 
  organization_id = b.organization_id,
  updated_at = NOW()
FROM profiles_backup_20250217 b
WHERE p.id = b.id;

-- 2. Reactivate the organization
UPDATE organizations
SET 
  subscription_status = 'active',
  active_user_count = (
    SELECT COUNT(*) FROM profiles WHERE organization_id = id AND is_active = true
  ),
  updated_at = NOW()
WHERE slug = 'individual-users';

-- 3. Restore practitioner assignments (if backed up separately)
-- This would require a backup of practitioner_assignments table

-- 4. Drop the backup table
DROP TABLE IF EXISTS profiles_backup_20250217;
*/
