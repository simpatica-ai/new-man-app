# Deprecated Files Analysis

**Date**: 2025-01-15  
**Purpose**: Identify files that can be safely removed before production deployment

## Summary

The scan identified several categories of potentially deprecated files:
- **45 SQL migration scripts** (many duplicates/superseded)
- **7 files with no exports** (potentially unused)
- **24 files with suspicious names** (test, backup, old)
- **Backup files** (.backup extensions)
- **Test/development utilities**

## Critical SQL Migration Scripts Analysis

### ✅ KEEP - Current Production Migrations

These are the canonical, current versions:

1. **`PRODUCTION_MIGRATION_COMPLETE_V2.sql`** ✅ KEEP
   - Most recent complete migration
   - Supersedes V1
   - Status: Current

2. **`PRODUCTION_MIGRATION_COACHING_TABLES.sql`** ✅ KEEP
   - Supplementary coaching tables
   - Required for coach desktop
   - Status: Current

3. **`fix_sponsor_connections_sequence.sql`** ✅ KEEP
   - Fixes SERIAL sequence issues
   - Part of production readiness
   - Status: Current

4. **`create_test_sponsor.sql`** ✅ KEEP
   - Creates test data for validation
   - Useful for staging/testing
   - Status: Current

5. **`rollback_sponsor_connections_sequence.sql`** ✅ KEEP
   - Rollback script for sequence fix
   - Safety mechanism
   - Status: Current

6. **`rollback_coaching_tables.sql`** ✅ KEEP
   - Rollback script for coaching tables
   - Safety mechanism
   - Status: Current

### ❌ REMOVE - Superseded/Deprecated SQL Scripts

1. **`PRODUCTION_MIGRATION_COMPLETE.sql`** ❌ REMOVE
   - Superseded by V2
   - Reason: Older version with known issues
   - Action: Delete after V2 is verified in production

2. **`PRODUCTION_MIGRATION_organization_requests.sql`** ❌ REMOVE
   - Functionality now in COMPLETE_V2
   - Reason: Merged into main migration
   - Action: Delete

3. **`supabase/migrations/20250112_work_product_reporting*.sql`** ❌ REMOVE (4 files)
   - Multiple versions of same migration
   - Reason: Superseded by final version in COMPLETE_V2
   - Files:
     - `20250112_work_product_reporting.sql`
     - `20250112_work_product_reporting_complete.sql`
     - `20250112_work_product_reporting_final.sql`
     - `20250112_work_product_reporting_rollback.sql`
   - Action: Delete all, functionality in COMPLETE_V2

4. **`supabase/migrations/20250112_fix_profiles_schema*.sql`** ❌ REMOVE (2 files)
   - Multiple attempts at same fix
   - Reason: Superseded by final version in COMPLETE_V2
   - Files:
     - `20250112_fix_profiles_schema_mismatch.sql`
     - `20250112_fix_profiles_schema_simple.sql`
   - Action: Delete, functionality in COMPLETE_V2

5. **`supabase/migrations/20250102_organizational_model*.sql`** ❌ REMOVE (6 files)
   - Old organizational model migrations
   - Reason: Superseded by newer migrations
   - Files:
     - `20250102_organizational_model.sql`
     - `20250102_organizational_model_rollback.sql`
     - `20250103_organizational_model_data.sql`
     - `20250103_organizational_model_fixes.sql`
     - `20250103_organizational_model_indexes.sql`
     - `20250103_organizational_model_schema.sql`
   - Action: Delete, functionality in COMPLETE_V2

6. **Test/Validation Scripts** ❌ REMOVE (5 files)
   - Development-only scripts
   - Files:
     - `supabase/migrations/test_work_product_reporting.sql`
     - `supabase/migrations/monitoring_scripts.sql`
     - `supabase/migrations/validate_organizational_model.sql`
     - `supabase/migrations/validate_production_migration.sql`
     - `supabase/migrations/rollback_organizational_model.sql`
   - Action: Delete, not needed in production

### ⚠️ REVIEW - Potentially Deprecated

1. **`supabase/migrations/20250104_*.sql`** ⚠️ REVIEW (7 files)
   - Organization-related migrations
   - Need to verify if functionality is in COMPLETE_V2
   - Files:
     - `20250104_admin_dashboard.sql`
     - `20250104_fix_organization_schema.sql`
     - `20250104_invitation_functions.sql`
     - `20250104_organization_contact_info.sql`
     - `20250104_organization_storage.sql`
     - `20250104_testing_functions.sql`
     - `20250105_organization_marketing.sql`
   - Action: Review each, merge needed functionality into COMPLETE_V2

2. **`supabase/migrations/20250911*.sql`** ⚠️ REVIEW (3 files)
   - Email invitation migrations
   - Check if still needed
   - Files:
     - `20250911212156_add_email_invitations.sql`
     - `20250911213139_fix_rls_policies.sql`
     - `20250911214509_add_delete_policy.sql`
   - Action: Verify functionality, may be in COMPLETE_V2

## Application Code Analysis

### ❌ REMOVE - Backup Files

1. **`src/app/practitioners/page.tsx.backup`** ❌ REMOVE
   - Backup of current file
   - Reason: Version control handles this
   - Action: Delete

2. **`src/app/coach-desktop/[organizationSlug]/page.tsx.backup`** ❌ REMOVE
   - Backup of current file
   - Reason: Version control handles this
   - Action: Delete

### ❌ REMOVE - Test/Development Components

1. **`src/components/admin/OrganizationTester.tsx`** ❌ REMOVE
   - Development testing component
   - Reason: Not used in production
   - Action: Delete

2. **`src/components/DevRoleTester.tsx`** ❌ REMOVE
   - Development testing component
   - Reason: Not used in production
   - Action: Delete

3. **`src/app/test-connection/page.tsx`** ❌ REMOVE
   - Test page for connection testing
   - Reason: Development only
   - Action: Delete

### ⚠️ REVIEW - Potentially Unused Components

1. **`src/components/admin/OrganizationAdminDashboard.tsx`** ⚠️ REVIEW
   - No exports found
   - Action: Check if used, may need to add exports

2. **`src/components/admin/AdminDashboard.tsx`** ⚠️ REVIEW
   - No exports found
   - Action: Check if used, may need to add exports

3. **`src/components/OrganizationRequestForm.tsx`** ⚠️ REVIEW
   - No exports found
   - Action: Check if used, may need to add exports

### ❌ REMOVE - Test Files

1. **`src/lib/__tests__/*.test.ts`** ❌ REMOVE (3 files)
   - Test files without test runner configured
   - Files:
     - `rbacService.test.ts`
     - `invitationService.test.ts`
     - `organizationService.test.ts`
   - Reason: No test framework configured
   - Action: Delete or move to separate test directory

### ⚠️ REVIEW - Utility Files

1. **`src/lib/testMode.ts`** ⚠️ REVIEW
   - Test mode utilities
   - Action: Check if used in production, may need for staging

2. **`src/lib/emailTemplate.ts`** ⚠️ REVIEW
   - Email template utilities
   - Action: Check if used, may be needed

3. **`src/lib/activityTracker.ts`** ⚠️ REVIEW
   - No exports found
   - Action: Check if used, add exports or delete

## Documentation Files

### ❌ REMOVE - Development Documentation

1. **`create-auth-test-users.md`** ❌ REMOVE
   - Development notes
   - Reason: Superseded by create_test_sponsor.sql
   - Action: Delete

2. **`test-work-product-reporting.md`** ❌ REMOVE
   - Development testing notes
   - Reason: Feature complete
   - Action: Delete

3. **`docs/TEST_MODE.md`** ❌ REMOVE
   - Test mode documentation
   - Reason: Not used in production
   - Action: Delete

4. **`supabase/migrations/TESTING_*.md`** ❌ REMOVE (3 files)
   - Testing documentation
   - Reason: Development only
   - Action: Delete

### ✅ KEEP - Important Documentation

1. **`ROLLBACK_PROCEDURES.md`** ✅ KEEP
   - Critical for production safety
   - Status: Current

2. **`MIGRATION_GUIDE.md`** ✅ KEEP (to be created)
   - Production deployment guide
   - Status: Needed

## Scripts and Utilities

### ❌ REMOVE - Development Scripts

1. **`backup_env.sh`** ❌ REMOVE
   - Development utility
   - Reason: Not needed in production
   - Action: Delete

2. **`supabase/migrations/test_migration.sh`** ❌ REMOVE
   - Testing script
   - Reason: Development only
   - Action: Delete

### ✅ KEEP - Useful Scripts

1. **`identify_deprecated_files.sh`** ✅ KEEP
   - Useful for future cleanup
   - Status: Current

## Cleanup Action Plan

### Phase 1: Safe Deletions (Low Risk)
```bash
# Backup files
rm src/app/practitioners/page.tsx.backup
rm src/app/coach-desktop/[organizationSlug]/page.tsx.backup

# Test components
rm src/components/admin/OrganizationTester.tsx
rm src/components/DevRoleTester.tsx
rm src/app/test-connection/page.tsx

# Test files
rm -rf src/lib/__tests__/

# Development docs
rm create-auth-test-users.md
rm test-work-product-reporting.md
rm docs/TEST_MODE.md
rm supabase/migrations/TESTING_*.md

# Development scripts
rm backup_env.sh
rm supabase/migrations/test_migration.sh
```

### Phase 2: SQL Migration Cleanup (Medium Risk)
```bash
# Superseded migrations
rm PRODUCTION_MIGRATION_COMPLETE.sql
rm PRODUCTION_MIGRATION_organization_requests.sql

# Work product reporting duplicates
rm supabase/migrations/20250112_work_product_reporting.sql
rm supabase/migrations/20250112_work_product_reporting_complete.sql
rm supabase/migrations/20250112_work_product_reporting_final.sql
rm supabase/migrations/20250112_work_product_reporting_rollback.sql

# Profile schema fix duplicates
rm supabase/migrations/20250112_fix_profiles_schema_mismatch.sql
rm supabase/migrations/20250112_fix_profiles_schema_simple.sql

# Old organizational model
rm supabase/migrations/20250102_organizational_model*.sql
rm supabase/migrations/20250103_organizational_model*.sql

# Test/validation scripts
rm supabase/migrations/test_work_product_reporting.sql
rm supabase/migrations/monitoring_scripts.sql
rm supabase/migrations/validate_*.sql
rm supabase/migrations/rollback_organizational_model.sql
```

### Phase 3: Review and Decide (High Risk)
```bash
# These need manual review before deletion:
# - supabase/migrations/20250104_*.sql (7 files)
# - supabase/migrations/20250911*.sql (3 files)
# - src/components/admin/OrganizationAdminDashboard.tsx
# - src/components/admin/AdminDashboard.tsx
# - src/components/OrganizationRequestForm.tsx
# - src/lib/testMode.ts
# - src/lib/emailTemplate.ts
# - src/lib/activityTracker.ts
```

## Verification After Cleanup

After each phase:

```bash
# 1. Run build
npm run build

# 2. Check for broken imports
npm run lint

# 3. Test application
npm run dev
# Navigate to all major routes

# 4. Commit changes
git add -A
git commit -m "chore: remove deprecated files (Phase X)"

# 5. Can revert if issues
git revert HEAD
```

## Estimated Impact

### Files to Delete
- **Safe deletions**: ~15 files
- **SQL migrations**: ~25 files
- **Review needed**: ~13 files
- **Total**: ~53 files

### Disk Space Saved
- Estimated: 2-5 MB
- Benefit: Cleaner codebase, easier maintenance

### Risk Level
- **Phase 1**: Low risk (backup files, test components)
- **Phase 2**: Medium risk (superseded migrations)
- **Phase 3**: High risk (requires careful review)

## Recommendations

1. **Do Phase 1 immediately** - Safe deletions, no risk
2. **Do Phase 2 after migration testing** - Verify COMPLETE_V2 works first
3. **Do Phase 3 carefully** - Review each file individually
4. **Keep version control** - Commit after each phase
5. **Test thoroughly** - Build and run after each phase

## Notes

- All deletions should be done in a feature branch
- Test application after each phase
- Can always recover from git history if needed
- Document any files kept for specific reasons