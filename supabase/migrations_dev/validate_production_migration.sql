-- Production Migration Validation Script
-- This script validates the organizational model migration was successful
-- Run this after migration to verify data integrity

-- Set up validation results table
CREATE TEMP TABLE migration_validation_results (
  check_name TEXT,
  status TEXT,
  expected_value TEXT,
  actual_value TEXT,
  details TEXT,
  severity TEXT -- 'ERROR', 'WARNING', 'INFO'
);

-- Function to add validation result
CREATE OR REPLACE FUNCTION add_validation_result(
  p_check_name TEXT,
  p_status TEXT,
  p_expected TEXT DEFAULT NULL,
  p_actual TEXT DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'INFO'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO migration_validation_results 
  VALUES (p_check_name, p_status, p_expected, p_actual, p_details, p_severity);
END;
$$ LANGUAGE plpgsql;

-- 1. Validate all users have organization assignments
DO $$
DECLARE
  total_users INTEGER;
  users_with_org INTEGER;
  users_without_org INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM profiles;
  SELECT COUNT(*) INTO users_with_org FROM profiles WHERE organization_id IS NOT NULL;
  users_without_org := total_users - users_with_org;
  
  IF users_without_org = 0 THEN
    PERFORM add_validation_result(
      'User Organization Assignment',
      'PASS',
      total_users::TEXT,
      users_with_org::TEXT,
      'All users assigned to organizations',
      'INFO'
    );
  ELSE
    PERFORM add_validation_result(
      'User Organization Assignment',
      'FAIL',
      total_users::TEXT,
      users_with_org::TEXT,
      users_without_org || ' users without organization assignment',
      'ERROR'
    );
  END IF;
END $$;

-- 2. Validate all users have roles assigned
DO $$
DECLARE
  total_users INTEGER;
  users_with_roles INTEGER;
  users_without_roles INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM profiles WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO users_with_roles 
  FROM profiles 
  WHERE organization_id IS NOT NULL 
  AND roles IS NOT NULL 
  AND array_length(roles, 1) > 0;
  users_without_roles := total_users - users_with_roles;
  
  IF users_without_roles = 0 THEN
    PERFORM add_validation_result(
      'User Role Assignment',
      'PASS',
      total_users::TEXT,
      users_with_roles::TEXT,
      'All users have roles assigned',
      'INFO'
    );
  ELSE
    PERFORM add_validation_result(
      'User Role Assignment',
      'FAIL',
      total_users::TEXT,
      users_with_roles::TEXT,
      users_without_roles || ' users without role assignment',
      'ERROR'
    );
  END IF;
END $$;

-- 3. Validate default organization exists
DO $$
DECLARE
  default_org_exists BOOLEAN;
  default_org_id UUID;
  default_org_user_count INTEGER;
BEGIN
  SELECT EXISTS(SELECT 1 FROM organizations WHERE slug = 'individual-users') INTO default_org_exists;
  
  IF default_org_exists THEN
    SELECT id, active_user_count INTO default_org_id, default_org_user_count 
    FROM organizations WHERE slug = 'individual-users';
    
    PERFORM add_validation_result(
      'Default Organization Exists',
      'PASS',
      'true',
      'true',
      'Default organization created with ' || default_org_user_count || ' users',
      'INFO'
    );
  ELSE
    PERFORM add_validation_result(
      'Default Organization Exists',
      'FAIL',
      'true',
      'false',
      'Default organization not found',
      'ERROR'
    );
  END IF;
END $$;

-- 4. Validate sponsor relationships migrated to coach assignments
DO $$
DECLARE
  sponsor_relationships INTEGER := 0;
  coach_assignments INTEGER;
  migration_ratio NUMERIC;
BEGIN
  -- Check if sponsor_practitioner_relationships table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_practitioner_relationships') THEN
    SELECT COUNT(*) INTO sponsor_relationships 
    FROM sponsor_practitioner_relationships 
    WHERE active = true;
  END IF;
  
  SELECT COUNT(*) INTO coach_assignments 
  FROM practitioner_assignments 
  WHERE supervisor_role = 'coach' AND active = true;
  
  IF sponsor_relationships > 0 THEN
    migration_ratio := (coach_assignments::NUMERIC / sponsor_relationships::NUMERIC) * 100;
    
    IF migration_ratio >= 100 THEN
      PERFORM add_validation_result(
        'Sponsor to Coach Migration',
        'PASS',
        sponsor_relationships::TEXT,
        coach_assignments::TEXT,
        'All sponsor relationships migrated to coach assignments',
        'INFO'
      );
    ELSE
      PERFORM add_validation_result(
        'Sponsor to Coach Migration',
        'PARTIAL',
        sponsor_relationships::TEXT,
        coach_assignments::TEXT,
        'Only ' || ROUND(migration_ratio, 2) || '% of relationships migrated',
        'WARNING'
      );
    END IF;
  ELSE
    PERFORM add_validation_result(
      'Sponsor to Coach Migration',
      'SKIP',
      '0',
      coach_assignments::TEXT,
      'No sponsor relationships found to migrate',
      'INFO'
    );
  END IF;
END $$;

-- 5. Validate user activity tracking data
DO $$
DECLARE
  users_with_activity INTEGER;
  total_active_users INTEGER;
  activity_ratio NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_active_users FROM profiles WHERE is_active = true;
  SELECT COUNT(*) INTO users_with_activity 
  FROM profiles 
  WHERE is_active = true AND last_activity IS NOT NULL;
  
  activity_ratio := (users_with_activity::NUMERIC / total_active_users::NUMERIC) * 100;
  
  IF activity_ratio >= 90 THEN
    PERFORM add_validation_result(
      'User Activity Tracking',
      'PASS',
      total_active_users::TEXT,
      users_with_activity::TEXT,
      ROUND(activity_ratio, 2) || '% of users have activity tracking',
      'INFO'
    );
  ELSE
    PERFORM add_validation_result(
      'User Activity Tracking',
      'WARNING',
      total_active_users::TEXT,
      users_with_activity::TEXT,
      'Only ' || ROUND(activity_ratio, 2) || '% of users have activity tracking',
      'WARNING'
    );
  END IF;
END $$;

-- 6. Validate virtue progress data preservation
DO $$
DECLARE
  users_with_virtue_progress INTEGER;
  users_with_current_virtue INTEGER;
  preservation_ratio NUMERIC;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO users_with_virtue_progress FROM user_virtue_progress;
  SELECT COUNT(*) INTO users_with_current_virtue 
  FROM profiles 
  WHERE current_virtue_id IS NOT NULL AND is_active = true;
  
  IF users_with_virtue_progress > 0 THEN
    preservation_ratio := (users_with_current_virtue::NUMERIC / users_with_virtue_progress::NUMERIC) * 100;
    
    IF preservation_ratio >= 80 THEN
      PERFORM add_validation_result(
        'Virtue Progress Preservation',
        'PASS',
        users_with_virtue_progress::TEXT,
        users_with_current_virtue::TEXT,
        ROUND(preservation_ratio, 2) || '% of users have current virtue set',
        'INFO'
      );
    ELSE
      PERFORM add_validation_result(
        'Virtue Progress Preservation',
        'WARNING',
        users_with_virtue_progress::TEXT,
        users_with_current_virtue::TEXT,
        'Only ' || ROUND(preservation_ratio, 2) || '% of users have current virtue set',
        'WARNING'
      );
    END IF;
  ELSE
    PERFORM add_validation_result(
      'Virtue Progress Preservation',
      'SKIP',
      '0',
      '0',
      'No virtue progress data found',
      'INFO'
    );
  END IF;
END $$;

-- 7. Validate organization active user counts
DO $$
DECLARE
  org_record RECORD;
  calculated_count INTEGER;
  count_mismatch INTEGER := 0;
BEGIN
  FOR org_record IN SELECT id, name, active_user_count FROM organizations LOOP
    SELECT COUNT(*) INTO calculated_count 
    FROM profiles 
    WHERE organization_id = org_record.id AND is_active = true;
    
    IF calculated_count != org_record.active_user_count THEN
      count_mismatch := count_mismatch + 1;
      PERFORM add_validation_result(
        'Organization User Count - ' || org_record.name,
        'FAIL',
        calculated_count::TEXT,
        org_record.active_user_count::TEXT,
        'User count mismatch for organization',
        'ERROR'
      );
    END IF;
  END LOOP;
  
  IF count_mismatch = 0 THEN
    PERFORM add_validation_result(
      'Organization User Counts',
      'PASS',
      'All counts match',
      'All counts match',
      'All organization user counts are accurate',
      'INFO'
    );
  END IF;
END $$;

-- 8. Validate database constraints and indexes
DO $$
DECLARE
  missing_indexes INTEGER := 0;
  required_indexes TEXT[] := ARRAY[
    'idx_profiles_organization_id',
    'idx_profiles_roles',
    'idx_profiles_is_active',
    'idx_practitioner_assignments_practitioner',
    'idx_practitioner_assignments_supervisor',
    'idx_organization_invitations_token'
  ];
  idx_name TEXT;
BEGIN
  FOREACH idx_name IN ARRAY required_indexes LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = idx_name
    ) THEN
      missing_indexes := missing_indexes + 1;
      PERFORM add_validation_result(
        'Missing Index - ' || idx_name,
        'FAIL',
        'exists',
        'missing',
        'Required index not found',
        'WARNING'
      );
    END IF;
  END LOOP;
  
  IF missing_indexes = 0 THEN
    PERFORM add_validation_result(
      'Database Indexes',
      'PASS',
      array_length(required_indexes, 1)::TEXT,
      array_length(required_indexes, 1)::TEXT,
      'All required indexes exist',
      'INFO'
    );
  END IF;
END $$;

-- 9. Validate RLS policies are enabled
DO $$
DECLARE
  rls_tables TEXT[] := ARRAY['organizations', 'practitioner_assignments', 'organization_invitations'];
  table_name TEXT;
  rls_enabled BOOLEAN;
  rls_issues INTEGER := 0;
BEGIN
  FOREACH table_name IN ARRAY rls_tables LOOP
    SELECT relrowsecurity INTO rls_enabled 
    FROM pg_class 
    WHERE relname = table_name;
    
    IF NOT rls_enabled THEN
      rls_issues := rls_issues + 1;
      PERFORM add_validation_result(
        'RLS Policy - ' || table_name,
        'FAIL',
        'enabled',
        'disabled',
        'Row Level Security not enabled',
        'ERROR'
      );
    END IF;
  END LOOP;
  
  IF rls_issues = 0 THEN
    PERFORM add_validation_result(
      'Row Level Security',
      'PASS',
      'enabled',
      'enabled',
      'RLS enabled on all organizational tables',
      'INFO'
    );
  END IF;
END $$;

-- 10. Check for orphaned data
DO $$
DECLARE
  orphaned_assignments INTEGER;
  orphaned_invitations INTEGER;
  orphan_issues INTEGER := 0;
BEGIN
  -- Check for practitioner assignments with invalid references
  SELECT COUNT(*) INTO orphaned_assignments
  FROM practitioner_assignments pa
  LEFT JOIN profiles p1 ON pa.practitioner_id = p1.id
  LEFT JOIN profiles p2 ON pa.supervisor_id = p2.id
  LEFT JOIN organizations o ON pa.organization_id = o.id
  WHERE p1.id IS NULL OR p2.id IS NULL OR o.id IS NULL;
  
  -- Check for invitations with invalid organization references
  SELECT COUNT(*) INTO orphaned_invitations
  FROM organization_invitations oi
  LEFT JOIN organizations o ON oi.organization_id = o.id
  WHERE o.id IS NULL;
  
  IF orphaned_assignments > 0 THEN
    orphan_issues := orphan_issues + 1;
    PERFORM add_validation_result(
      'Orphaned Assignments',
      'FAIL',
      '0',
      orphaned_assignments::TEXT,
      'Found assignments with invalid references',
      'ERROR'
    );
  END IF;
  
  IF orphaned_invitations > 0 THEN
    orphan_issues := orphan_issues + 1;
    PERFORM add_validation_result(
      'Orphaned Invitations',
      'FAIL',
      '0',
      orphaned_invitations::TEXT,
      'Found invitations with invalid organization references',
      'ERROR'
    );
  END IF;
  
  IF orphan_issues = 0 THEN
    PERFORM add_validation_result(
      'Data Integrity',
      'PASS',
      'no orphans',
      'no orphans',
      'No orphaned data found',
      'INFO'
    );
  END IF;
END $$;

-- Display validation results
SELECT 
  check_name,
  status,
  CASE 
    WHEN expected_value IS NOT NULL AND actual_value IS NOT NULL 
    THEN 'Expected: ' || expected_value || ', Actual: ' || actual_value
    ELSE details
  END as result_details,
  severity
FROM migration_validation_results
ORDER BY 
  CASE severity 
    WHEN 'ERROR' THEN 1 
    WHEN 'WARNING' THEN 2 
    WHEN 'INFO' THEN 3 
  END,
  check_name;

-- Summary report
SELECT 
  severity,
  COUNT(*) as count,
  ROUND((COUNT(*)::NUMERIC / (SELECT COUNT(*) FROM migration_validation_results)::NUMERIC) * 100, 2) as percentage
FROM migration_validation_results
GROUP BY severity
ORDER BY 
  CASE severity 
    WHEN 'ERROR' THEN 1 
    WHEN 'WARNING' THEN 2 
    WHEN 'INFO' THEN 3 
  END;

-- Final migration status
DO $$
DECLARE
  error_count INTEGER;
  warning_count INTEGER;
  total_checks INTEGER;
BEGIN
  SELECT COUNT(*) INTO error_count FROM migration_validation_results WHERE severity = 'ERROR';
  SELECT COUNT(*) INTO warning_count FROM migration_validation_results WHERE severity = 'WARNING';
  SELECT COUNT(*) INTO total_checks FROM migration_validation_results;
  
  RAISE NOTICE '=== MIGRATION VALIDATION SUMMARY ===';
  RAISE NOTICE 'Total checks: %', total_checks;
  RAISE NOTICE 'Errors: %', error_count;
  RAISE NOTICE 'Warnings: %', warning_count;
  RAISE NOTICE 'Passed: %', (total_checks - error_count - warning_count);
  
  IF error_count = 0 THEN
    RAISE NOTICE 'MIGRATION STATUS: SUCCESS';
    IF warning_count > 0 THEN
      RAISE NOTICE 'Note: % warnings found - review recommended', warning_count;
    END IF;
  ELSE
    RAISE NOTICE 'MIGRATION STATUS: FAILED - % critical errors found', error_count;
    RAISE NOTICE 'Review errors and consider rollback if necessary';
  END IF;
END $$;

-- Clean up temporary functions
DROP FUNCTION add_validation_result(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);