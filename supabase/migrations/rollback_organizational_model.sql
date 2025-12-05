-- Production Migration Rollback Script
-- This script rolls back the organizational model migration
-- WARNING: This will remove organizational data - use with caution

-- Create rollback log table
CREATE TABLE IF NOT EXISTS rollback_log (
  id SERIAL PRIMARY KEY,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL,
  details TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to log rollback steps
CREATE OR REPLACE FUNCTION log_rollback_step(
  p_step_name TEXT,
  p_status TEXT,
  p_details TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO rollback_log (step_name, status, details)
  VALUES (p_step_name, p_status, p_details);
  
  RAISE NOTICE '[%] %: %', NOW(), p_step_name, p_status;
  IF p_details IS NOT NULL THEN
    RAISE NOTICE '  Details: %', p_details;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Start rollback process
SELECT log_rollback_step('Rollback Started', 'INFO', 'Beginning organizational model rollback');

-- Step 1: Backup organizational data before removal
DO $$
BEGIN
  -- Backup organizations table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    CREATE TABLE organizations_rollback_backup AS SELECT * FROM organizations;
    PERFORM log_rollback_step('Backup Organizations', 'SUCCESS', 'Organizations table backed up');
  END IF;
  
  -- Backup practitioner assignments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practitioner_assignments') THEN
    CREATE TABLE practitioner_assignments_rollback_backup AS SELECT * FROM practitioner_assignments;
    PERFORM log_rollback_step('Backup Assignments', 'SUCCESS', 'Practitioner assignments backed up');
  END IF;
  
  -- Backup organization invitations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_invitations') THEN
    CREATE TABLE organization_invitations_rollback_backup AS SELECT * FROM organization_invitations;
    PERFORM log_rollback_step('Backup Invitations', 'SUCCESS', 'Organization invitations backed up');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    PERFORM log_rollback_step('Backup Failed', 'ERROR', SQLERRM);
    RAISE;
END $$;

-- Step 2: Restore sponsor_practitioner_relationships if backup exists
DO $$
DECLARE
  backup_count INTEGER;
  restored_count INTEGER;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_practitioner_relationships_backup') THEN
    SELECT COUNT(*) INTO backup_count FROM sponsor_practitioner_relationships_backup;
    
    -- Restore original sponsor relationships
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_practitioner_relationships') THEN
      CREATE TABLE sponsor_practitioner_relationships AS 
      SELECT * FROM sponsor_practitioner_relationships_backup;
      
      -- Remove backup timestamp column if it exists
      IF EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'sponsor_practitioner_relationships' 
                 AND column_name = 'backup_created_at') THEN
        ALTER TABLE sponsor_practitioner_relationships DROP COLUMN backup_created_at;
      END IF;
    ELSE
      -- Table exists, restore data
      TRUNCATE sponsor_practitioner_relationships;
      INSERT INTO sponsor_practitioner_relationships 
      SELECT * FROM sponsor_practitioner_relationships_backup;
    END IF;
    
    SELECT COUNT(*) INTO restored_count FROM sponsor_practitioner_relationships;
    PERFORM log_rollback_step('Restore Sponsor Relationships', 'SUCCESS', 
                             'Restored ' || restored_count || ' relationships from backup');
  ELSE
    PERFORM log_rollback_step('Restore Sponsor Relationships', 'SKIP', 
                             'No backup found - relationships may have been lost');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    PERFORM log_rollback_step('Restore Sponsor Relationships', 'ERROR', SQLERRM);
END $$;

-- Step 3: Remove organizational columns from profiles table
DO $$
BEGIN
  -- Remove organizational columns
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id') THEN
    ALTER TABLE profiles DROP COLUMN organization_id;
    PERFORM log_rollback_step('Remove Organization ID', 'SUCCESS', 'organization_id column removed');
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'roles') THEN
    ALTER TABLE profiles DROP COLUMN roles;
    PERFORM log_rollback_step('Remove Roles', 'SUCCESS', 'roles column removed');
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_activity') THEN
    ALTER TABLE profiles DROP COLUMN last_activity;
    PERFORM log_rollback_step('Remove Last Activity', 'SUCCESS', 'last_activity column removed');
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_virtue_id') THEN
    ALTER TABLE profiles DROP COLUMN current_virtue_id;
    PERFORM log_rollback_step('Remove Current Virtue', 'SUCCESS', 'current_virtue_id column removed');
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_stage') THEN
    ALTER TABLE profiles DROP COLUMN current_stage;
    PERFORM log_rollback_step('Remove Current Stage', 'SUCCESS', 'current_stage column removed');
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
    ALTER TABLE profiles DROP COLUMN is_active;
    PERFORM log_rollback_step('Remove Is Active', 'SUCCESS', 'is_active column removed');
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'archived_at') THEN
    ALTER TABLE profiles DROP COLUMN archived_at;
    PERFORM log_rollback_step('Remove Archived At', 'SUCCESS', 'archived_at column removed');
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'archived_by') THEN
    ALTER TABLE profiles DROP COLUMN archived_by;
    PERFORM log_rollback_step('Remove Archived By', 'SUCCESS', 'archived_by column removed');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    PERFORM log_rollback_step('Remove Profile Columns', 'ERROR', SQLERRM);
END $$;

-- Step 4: Drop organizational tables
DO $$
BEGIN
  -- Drop practitioner_assignments table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'practitioner_assignments') THEN
    DROP TABLE practitioner_assignments CASCADE;
    PERFORM log_rollback_step('Drop Assignments Table', 'SUCCESS', 'practitioner_assignments table dropped');
  END IF;
  
  -- Drop organization_invitations table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_invitations') THEN
    DROP TABLE organization_invitations CASCADE;
    PERFORM log_rollback_step('Drop Invitations Table', 'SUCCESS', 'organization_invitations table dropped');
  END IF;
  
  -- Drop organizations table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    DROP TABLE organizations CASCADE;
    PERFORM log_rollback_step('Drop Organizations Table', 'SUCCESS', 'organizations table dropped');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    PERFORM log_rollback_step('Drop Tables', 'ERROR', SQLERRM);
END $$;

-- Step 5: Drop organizational functions and triggers
DO $$
BEGIN
  -- Drop trigger first
  DROP TRIGGER IF EXISTS trigger_update_active_user_count ON profiles;
  PERFORM log_rollback_step('Drop User Count Trigger', 'SUCCESS', 'Active user count trigger dropped');
  
  -- Drop functions
  DROP FUNCTION IF EXISTS update_organization_active_user_count();
  PERFORM log_rollback_step('Drop User Count Function', 'SUCCESS', 'Active user count function dropped');
  
  DROP FUNCTION IF EXISTS update_updated_at_column();
  PERFORM log_rollback_step('Drop Updated At Function', 'SUCCESS', 'Updated at function dropped');
  
  DROP FUNCTION IF EXISTS get_organizational_index_usage();
  PERFORM log_rollback_step('Drop Index Usage Function', 'SUCCESS', 'Index usage function dropped');
EXCEPTION
  WHEN OTHERS THEN
    PERFORM log_rollback_step('Drop Functions', 'ERROR', SQLERRM);
END $$;

-- Step 6: Drop organizational indexes
DO $$
DECLARE
  index_name TEXT;
  org_indexes TEXT[] := ARRAY[
    'idx_profiles_organization_id',
    'idx_profiles_roles',
    'idx_profiles_is_active',
    'idx_profiles_last_activity',
    'idx_profiles_org_active',
    'idx_profiles_org_roles',
    'idx_profiles_last_activity_desc',
    'idx_profiles_current_virtue',
    'idx_profiles_org_role_activity',
    'idx_profiles_admins',
    'idx_profiles_coaches',
    'idx_profiles_therapists',
    'idx_profiles_practitioners',
    'idx_practitioner_assignments_practitioner',
    'idx_practitioner_assignments_supervisor',
    'idx_practitioner_assignments_org',
    'idx_practitioner_assignments_active',
    'idx_practitioner_assignments_supervisor_role',
    'idx_practitioner_assignments_practitioner_active',
    'idx_organization_invitations_token',
    'idx_organization_invitations_email',
    'idx_organization_invitations_pending',
    'idx_organization_invitations_email_pending',
    'idx_organizations_active',
    'idx_organizations_billing'
  ];
BEGIN
  FOREACH index_name IN ARRAY org_indexes LOOP
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = index_name) THEN
      EXECUTE 'DROP INDEX IF EXISTS ' || index_name;
      PERFORM log_rollback_step('Drop Index', 'SUCCESS', 'Dropped index: ' || index_name);
    END IF;
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    PERFORM log_rollback_step('Drop Indexes', 'ERROR', SQLERRM);
END $$;

-- Step 7: Clean up backup tables (optional - comment out to keep backups)
/*
DO $$
BEGIN
  DROP TABLE IF EXISTS sponsor_practitioner_relationships_backup;
  DROP TABLE IF EXISTS organizations_rollback_backup;
  DROP TABLE IF EXISTS practitioner_assignments_rollback_backup;
  DROP TABLE IF EXISTS organization_invitations_rollback_backup;
  PERFORM log_rollback_step('Clean Backup Tables', 'SUCCESS', 'Backup tables removed');
EXCEPTION
  WHEN OTHERS THEN
    PERFORM log_rollback_step('Clean Backup Tables', 'ERROR', SQLERRM);
END $$;
*/

-- Step 8: Verify rollback completion
DO $$
DECLARE
  remaining_org_tables INTEGER := 0;
  remaining_org_columns INTEGER := 0;
  remaining_org_indexes INTEGER := 0;
BEGIN
  -- Check for remaining organizational tables
  SELECT COUNT(*) INTO remaining_org_tables
  FROM information_schema.tables 
  WHERE table_name IN ('organizations', 'practitioner_assignments', 'organization_invitations');
  
  -- Check for remaining organizational columns in profiles
  SELECT COUNT(*) INTO remaining_org_columns
  FROM information_schema.columns 
  WHERE table_name = 'profiles' 
  AND column_name IN ('organization_id', 'roles', 'is_active', 'last_activity', 'current_virtue_id', 'current_stage', 'archived_at', 'archived_by');
  
  -- Check for remaining organizational indexes
  SELECT COUNT(*) INTO remaining_org_indexes
  FROM pg_indexes 
  WHERE indexname LIKE '%org%' OR indexname LIKE '%practitioner%' OR indexname LIKE '%organization%';
  
  IF remaining_org_tables = 0 AND remaining_org_columns = 0 THEN
    PERFORM log_rollback_step('Rollback Verification', 'SUCCESS', 
                             'Rollback completed successfully. Remaining indexes: ' || remaining_org_indexes);
  ELSE
    PERFORM log_rollback_step('Rollback Verification', 'WARNING', 
                             'Incomplete rollback - Tables: ' || remaining_org_tables || 
                             ', Columns: ' || remaining_org_columns || 
                             ', Indexes: ' || remaining_org_indexes);
  END IF;
END $$;

-- Final rollback summary
SELECT log_rollback_step('Rollback Completed', 'INFO', 'Organizational model rollback process finished');

-- Display rollback log
SELECT 
  step_name,
  status,
  details,
  executed_at
FROM rollback_log
ORDER BY id;

-- Rollback summary
SELECT 
  status,
  COUNT(*) as step_count
FROM rollback_log
GROUP BY status
ORDER BY 
  CASE status 
    WHEN 'ERROR' THEN 1 
    WHEN 'WARNING' THEN 2 
    WHEN 'SUCCESS' THEN 3 
    WHEN 'SKIP' THEN 4 
    WHEN 'INFO' THEN 5 
  END;

-- Clean up rollback functions
DROP FUNCTION log_rollback_step(TEXT, TEXT, TEXT);

RAISE NOTICE '=== ROLLBACK COMPLETED ===';
RAISE NOTICE 'Check rollback_log table for detailed results';
RAISE NOTICE 'Backup tables preserved for data recovery if needed';