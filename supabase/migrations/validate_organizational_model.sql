-- Validation Script: Organizational Model Migration
-- Date: 2025-01-02
-- Description: Validates that the organizational model migration was successful
-- Run this script after applying the migration to verify everything is working correctly

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- 1. Verify all tables were created
SELECT 
  'Tables Created' as check_type,
  CASE 
    WHEN COUNT(*) = 3 THEN 'PASS'
    ELSE 'FAIL - Expected 3 tables, found ' || COUNT(*)
  END as status,
  string_agg(table_name, ', ') as details
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('organizations', 'practitioner_assignments', 'organization_invitations');

-- 2. Verify profiles table columns were added
SELECT 
  'Profiles Columns Added' as check_type,
  CASE 
    WHEN COUNT(*) = 8 THEN 'PASS'
    ELSE 'FAIL - Expected 8 columns, found ' || COUNT(*)
  END as status,
  string_agg(column_name, ', ') as details
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name IN ('organization_id', 'roles', 'last_activity', 'current_virtue_id', 'current_stage', 'is_active', 'archived_at', 'archived_by');

-- 3. Verify indexes were created
SELECT 
  'Indexes Created' as check_type,
  CASE 
    WHEN COUNT(*) >= 12 THEN 'PASS'
    ELSE 'FAIL - Expected at least 12 indexes, found ' || COUNT(*)
  END as status,
  COUNT(*) || ' indexes created' as details
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
  AND indexname IN (
    'idx_organizations_slug',
    'idx_organizations_subscription_status',
    'idx_profiles_organization_id',
    'idx_profiles_organization_active',
    'idx_profiles_roles',
    'idx_profiles_last_activity',
    'idx_profiles_current_virtue',
    'idx_practitioner_assignments_practitioner',
    'idx_practitioner_assignments_supervisor',
    'idx_practitioner_assignments_organization',
    'idx_practitioner_assignments_active',
    'idx_organization_invitations_token',
    'idx_organization_invitations_email',
    'idx_organization_invitations_expires',
    'idx_organization_invitations_organization'
  );

-- 4. Verify functions were created
SELECT 
  'Functions Created' as check_type,
  CASE 
    WHEN COUNT(*) = 4 THEN 'PASS'
    ELSE 'FAIL - Expected 4 functions, found ' || COUNT(*)
  END as status,
  string_agg(proname, ', ') as details
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN (
    'update_organization_active_user_count',
    'archive_user',
    'reactivate_user',
    'validate_organization_user_limit'
  );

-- 5. Verify triggers were created
SELECT 
  'Triggers Created' as check_type,
  CASE 
    WHEN COUNT(*) >= 1 THEN 'PASS'
    ELSE 'FAIL - Expected at least 1 trigger, found ' || COUNT(*)
  END as status,
  string_agg(trigger_name, ', ') as details
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND trigger_name = 'trigger_profiles_organization_count';

-- 6. Verify RLS policies were created
SELECT 
  'RLS Policies Created' as check_type,
  CASE 
    WHEN COUNT(*) >= 8 THEN 'PASS'
    ELSE 'FAIL - Expected at least 8 policies, found ' || COUNT(*)
  END as status,
  COUNT(*) || ' policies created' as details
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'profiles', 'practitioner_assignments', 'organization_invitations', 'journal_entries', 'sponsor_relationships');

-- 7. Verify default organization was created (if there were existing users)
SELECT 
  'Default Organization' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.organizations WHERE slug = 'individual-users') THEN 'PASS'
    ELSE 'INFO - No default organization created (no existing users)'
  END as status,
  COALESCE((SELECT name FROM public.organizations WHERE slug = 'individual-users'), 'None') as details;

-- 8. Verify existing users were migrated to default organization
SELECT 
  'User Migration' as check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS - All users have organization'
    ELSE 'FAIL - ' || COUNT(*) || ' users without organization'
  END as status,
  COUNT(*) || ' users without organization' as details
FROM public.profiles 
WHERE organization_id IS NULL;

-- 9. Verify sponsor relationships were migrated to coach assignments
SELECT 
  'Sponsor Migration' as check_type,
  CASE 
    WHEN sponsor_count = assignment_count THEN 'PASS'
    WHEN sponsor_count = 0 THEN 'INFO - No sponsor relationships to migrate'
    ELSE 'PARTIAL - ' || assignment_count || ' of ' || sponsor_count || ' relationships migrated'
  END as status,
  'Sponsors: ' || sponsor_count || ', Assignments: ' || assignment_count as details
FROM (
  SELECT 
    (SELECT COUNT(*) FROM public.sponsor_relationships WHERE sponsor_id IS NOT NULL) as sponsor_count,
    (SELECT COUNT(*) FROM public.practitioner_assignments WHERE supervisor_role = 'coach') as assignment_count
) counts;

-- 10. Verify table constraints
SELECT 
  'Table Constraints' as check_type,
  CASE 
    WHEN COUNT(*) >= 5 THEN 'PASS'
    ELSE 'FAIL - Expected at least 5 constraints, found ' || COUNT(*)
  END as status,
  string_agg(constraint_name, ', ') as details
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
  AND constraint_type = 'CHECK'
  AND table_name IN ('organizations', 'profiles', 'practitioner_assignments', 'organization_invitations')
  AND constraint_name IN ('max_users_limit', 'valid_roles', 'current_stage_positive', 'no_self_assignment', 'valid_email');

-- ============================================================================
-- DATA INTEGRITY CHECKS
-- ============================================================================

-- 11. Check organization active user counts are accurate
SELECT 
  'User Count Accuracy' as check_type,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS'
    ELSE 'FAIL - ' || COUNT(*) || ' organizations have incorrect user counts'
  END as status,
  CASE 
    WHEN COUNT(*) > 0 THEN string_agg(name || ' (expected: ' || actual_count || ', stored: ' || active_user_count || ')', ', ')
    ELSE 'All counts accurate'
  END as details
FROM (
  SELECT 
    o.id,
    o.name,
    o.active_user_count,
    COUNT(p.id) as actual_count
  FROM public.organizations o
  LEFT JOIN public.profiles p ON o.id = p.organization_id AND p.is_active = true
  GROUP BY o.id, o.name, o.active_user_count
  HAVING o.active_user_count != COUNT(p.id)
) mismatched;

-- 12. Check for orphaned data
SELECT 
  'Orphaned Data Check' as check_type,
  CASE 
    WHEN orphaned_assignments + orphaned_invitations = 0 THEN 'PASS'
    ELSE 'FAIL - Found orphaned records'
  END as status,
  'Assignments: ' || orphaned_assignments || ', Invitations: ' || orphaned_invitations as details
FROM (
  SELECT 
    (SELECT COUNT(*) FROM public.practitioner_assignments pa 
     WHERE NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = pa.organization_id)) as orphaned_assignments,
    (SELECT COUNT(*) FROM public.organization_invitations oi 
     WHERE NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = oi.organization_id)) as orphaned_invitations
) orphaned;

-- ============================================================================
-- PERFORMANCE CHECKS
-- ============================================================================

-- 13. Verify index usage (sample query performance)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT p.* 
FROM public.profiles p 
WHERE p.organization_id = (SELECT id FROM public.organizations LIMIT 1)
  AND p.is_active = true;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================

-- Generate a summary of all validation results
WITH validation_results AS (
  -- Combine all the above checks into a single result set
  -- This would be the actual implementation of all checks above
  SELECT 'Migration Validation Complete' as summary, NOW() as checked_at
)
SELECT * FROM validation_results;

-- ============================================================================
-- MANUAL VERIFICATION STEPS
-- ============================================================================

-- After running this script, manually verify:
-- 1. Application can create new organizations
-- 2. Users can be invited to organizations
-- 3. Role-based access control works correctly
-- 4. Archival and reactivation functions work
-- 5. Existing sponsor relationships still function
-- 6. Journal entries are properly scoped
-- 7. Performance is acceptable with new indexes

-- ============================================================================
-- TROUBLESHOOTING QUERIES
-- ============================================================================

-- If validation fails, use these queries to investigate:

-- Check specific table structure:
-- \d public.organizations
-- \d public.profiles
-- \d public.practitioner_assignments
-- \d public.organization_invitations

-- Check function definitions:
-- \df public.update_organization_active_user_count
-- \df public.archive_user
-- \df public.reactivate_user
-- \df public.validate_organization_user_limit

-- Check policies:
-- SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check triggers:
-- SELECT * FROM information_schema.triggers WHERE trigger_schema = 'public';

-- ============================================================================
-- END OF VALIDATION SCRIPT
-- ============================================================================