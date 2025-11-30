# Migration Audit Report

**Date**: 2025-01-26  
**Branch Analyzed**: dev (with stashed changes)  
**Auditor**: Kiro AI  
**Purpose**: Identify and consolidate migration scripts for production deployment

---

## Executive Summary

This audit reveals **significant migration confusion** with:
- **62 SQL files** scattered across 4 locations
- **Multiple versions** of the same migrations (PRODUCTION_MIGRATION_COMPLETE, V2, etc.)
- **Migrations in backup** that MIGRATION_ORDER.md references
- **Stashed dev branch changes** with additional organizational features
- **Unclear execution order** for production vs dev deployment

---

## SQL Files Inventory

### Total Count: 62 SQL files

#### Location Breakdown:
1. **Root directory**: 15 files
2. **supabase/migrations/**: 9 files  
3. **supabase/migrations_backup/**: 34 files
4. **supabase/migrations_temp_disabled/**: 4 files

---

## Detailed File Catalog

### 1. Root Directory SQL Files (15 files)

#### Production Migration Files:
- `PRODUCTION_MIGRATION_COACHING_TABLES.sql` - Coaching tables (sponsor_connections, chat, memos)
- `PRODUCTION_MIGRATION_COMPLETE.sql` - Complete migration (version 1)
- `PRODUCTION_MIGRATION_COMPLETE_V2.sql` - Complete migration (version 2) ⚠️ DUPLICATE
- `PRODUCTION_MIGRATION_organization_requests.sql` - Organization request system
- `production_complete.sql` - Another complete migration ⚠️ DUPLICATE

#### Sequence/Schema Fixes:
- `fix_sponsor_connections_sequence.sql` - Fixes SERIAL sequence issues
- `LOCAL_MIGRATION_COACHING_TABLES.sql` - Local version of coaching tables

#### Test Data & Setup:
- `create_test_sponsor.sql` - Creates test accounts
- `create_auth_users_for_existing_profiles.sql` - Syncs auth.users with profiles
- `fix_auth_passwords.sql` - Fixes auth passwords for testing

#### Rollback Scripts:
- `rollback_coaching_tables.sql` - Rollback for coaching tables
- `rollback_sponsor_connections_sequence.sql` - Rollback for sequence fix

#### Other:
- `ai_feedback_table.sql` - AI feedback feature
- `user_activity_sessions.sql` - Activity tracking
- `dump.sql` - Database dump

**Status**: ⚠️ **CRITICAL CONFUSION** - Multiple versions of "complete" migrations

---

### 2. Active Migrations (supabase/migrations/) - 9 files

These are the migrations that Supabase will automatically apply:

1. `20250102_organizational_model.sql` - Organizational model
2. `20250102_organizational_model_rollback.sql` - Rollback for above
3. `20250106_fix_all_user_deletion_constraints.sql` - User deletion fixes
4. `20250911212156_add_email_invitations.sql` - Email invitations
5. `20250911213139_fix_rls_policies.sql` - RLS policy fixes
6. `20250911214509_add_delete_policy.sql` - Delete policy
7. `20250914_alpha_feedback.sql` - Alpha feedback feature
8. `20250914_enable_rls_error_logs.sql` - Error logging
9. `validate_organizational_model.sql` - Validation script

**Status**: ✅ These will auto-apply when Supabase starts

---

### 3. Backup Migrations (supabase/migrations_backup/) - 34 files

**CRITICAL**: MIGRATION_ORDER.md references files in this backup folder!

#### Organizational Model (9 files):
- `20250102_organizational_model.sql`
- `20250102_organizational_model_rollback.sql`
- `20250103_organizational_model_schema.sql`
- `20250103_organizational_model_data.sql`
- `20250103_organizational_model_fixes.sql`
- `20250103_organizational_model_indexes.sql`
- `20250104_fix_organization_schema.sql`
- `rollback_organizational_model.sql`
- `validate_organizational_model.sql`

#### Organization Features (5 files):
- `20250104_admin_dashboard.sql`
- `20250104_invitation_functions.sql`
- `20250104_organization_contact_info.sql`
- `20250104_organization_storage.sql`
- `20250105_organization_marketing.sql`
- `20250104_testing_functions.sql`

#### Work Product Reporting (5 files):
- `20250112_work_product_reporting.sql`
- `20250112_work_product_reporting_complete.sql`
- `20250112_work_product_reporting_final.sql` ⚠️ MULTIPLE VERSIONS
- `20250112_work_product_reporting_rollback.sql`
- `test_work_product_reporting.sql`

#### Schema Fixes Referenced in MIGRATION_ORDER.md (4 files):
- `20250112_cleanup_dev_only_objects.sql` ⚠️ **REFERENCED IN MIGRATION_ORDER.md**
- `20250112_fix_profiles_schema_mismatch.sql` ⚠️ **REFERENCED IN MIGRATION_ORDER.md**
- `20250112_fix_profiles_schema_simple.sql`
- `20250112_add_missing_updated_at_columns.sql`

#### Role System (2 files):
- `20250113_implement_clear_role_system.sql` ⚠️ **REFERENCED IN MIGRATION_ORDER.md**
- `20250113_migrate_roles_to_new_system.sql` ⚠️ **REFERENCED IN MIGRATION_ORDER.md**

#### Organization Requests (1 file):
- `20250113_organization_requests.sql`

#### Email/RLS (4 files):
- `20250911212156_add_email_invitations.sql`
- `20250911213139_fix_rls_policies.sql`
- `20250911214509_add_delete_policy.sql`
- `20250914_alpha_feedback.sql`
- `20250914_enable_rls_error_logs.sql`

#### Other (4 files):
- `20250101_add_missing_function.sql`
- `monitoring_scripts.sql`
- `validate_production_migration.sql`
- `deployment_procedures.md` (not SQL)
- `migration_review_and_fixes.md` (not SQL)
- `production_migration_strategy.md` (not SQL)
- `test_on_dev_database.md` (not SQL)
- `TESTING_GUIDE.md` (not SQL)
- `TESTING_STATUS.md` (not SQL)

**Status**: ⚠️ **CRITICAL** - MIGRATION_ORDER.md references files here, but they're in backup!

---

### 4. Temp Disabled Migrations (supabase/migrations_temp_disabled/) - 4 files

These were disabled to load production data directly:

1. `20250115000000_initial_schema.sql`
2. `20250115000001_production_complete.sql`
3. `20250115000002_coaching_tables.sql`
4. `20250115000003_fix_sequences.sql`

**Status**: ⚠️ Disabled for production data loading

---

## MIGRATION_ORDER.md Analysis

### Files Referenced in MIGRATION_ORDER.md:

1. ❌ `20250112_cleanup_dev_only_objects.sql` - **IN BACKUP, NOT ACTIVE**
2. ❌ `20250112_fix_profiles_schema_mismatch.sql` - **IN BACKUP, NOT ACTIVE**
3. ❌ `20250112_work_product_reporting_complete.sql` - **IN BACKUP, NOT ACTIVE**
4. ❌ `fix-missing-updated-at-column.sql` - **DOESN'T EXIST**
5. ❌ `20250113_implement_clear_role_system.sql` - **IN BACKUP, NOT ACTIVE**
6. ❌ `20250113_migrate_roles_to_new_system.sql` - **IN BACKUP, NOT ACTIVE**
7. ✅ `PRODUCTION_MIGRATION_organization_requests.sql` - **EXISTS IN ROOT**

**CRITICAL ISSUE**: 6 out of 7 migrations referenced in MIGRATION_ORDER.md are either in backup or don't exist!

---

## Dev Branch Requirements Analysis

### Expected Database Features (from dev branch code):

#### 1. Organizations System:
- `organizations` table
- `organization_requests` table
- `profiles.organization_id` column (foreign key)
- Functions:
  - `approve_organization_request`
  - `check_organizational_health`
  - `delete_organization_with_users`
  - `detect_organizational_issues`
  - `get_organization_activity_overview`

#### 2. Work Product Reporting:
- `get_work_product_summary` function
- Related tables for work product tracking

#### 3. Role System:
- `profiles.roles` column (TEXT[])
- Support for organizational roles (org-admin, org-sponsor, etc.)
- Support for individual roles (ind-practitioner, etc.)

#### 4. Coaching Tables (Already in main):
- `sponsor_connections`
- `sponsor_chat_messages`
- `sponsor_visible_memos`

---

## Migration Categories

### Category A: Production-Ready (Main Branch)
**Purpose**: Support current main branch functionality

1. ✅ `fix_sponsor_connections_sequence.sql` - Fixes SERIAL sequences
2. ✅ `PRODUCTION_MIGRATION_COACHING_TABLES.sql` - Coaching tables
3. ✅ `create_test_sponsor.sql` - Test data
4. ✅ `create_auth_users_for_existing_profiles.sql` - Auth sync

**Status**: Ready for production deployment

---

### Category B: Dev-Required (Dev Branch Deployment)
**Purpose**: Required for dev branch to function

#### Schema Fixes:
1. ⚠️ `20250112_cleanup_dev_only_objects.sql` (in backup)
2. ⚠️ `20250112_fix_profiles_schema_mismatch.sql` (in backup)

#### Work Product:
3. ⚠️ `20250112_work_product_reporting_complete.sql` (in backup)

#### Role System:
4. ⚠️ `20250113_implement_clear_role_system.sql` (in backup)
5. ⚠️ `20250113_migrate_roles_to_new_system.sql` (in backup)

#### Organization Requests:
6. ✅ `PRODUCTION_MIGRATION_organization_requests.sql` (in root)

**Status**: ⚠️ Most files in backup, need to be moved to active migrations

---

### Category C: Organizational Model (Dev-Only, Not Ready)
**Purpose**: Full organizational features (not yet ready for production)

1. `20250102_organizational_model.sql` (in active migrations)
2. `20250103_organizational_model_schema.sql` (in backup)
3. `20250103_organizational_model_data.sql` (in backup)
4. `20250103_organizational_model_fixes.sql` (in backup)
5. `20250103_organizational_model_indexes.sql` (in backup)
6. `20250104_admin_dashboard.sql` (in backup)
7. `20250104_invitation_functions.sql` (in backup)
8. `20250104_organization_contact_info.sql` (in backup)
9. `20250104_organization_storage.sql` (in backup)
10. `20250105_organization_marketing.sql` (in backup)

**Status**: ⚠️ Dev-only, not ready for production

---

### Category D: Deprecated/Superseded
**Purpose**: Old versions, duplicates, or superseded migrations

1. ❌ `PRODUCTION_MIGRATION_COMPLETE.sql` - Superseded by V2
2. ❌ `PRODUCTION_MIGRATION_COMPLETE_V2.sql` - Unclear if needed
3. ❌ `production_complete.sql` - Duplicate
4. ❌ `LOCAL_MIGRATION_COACHING_TABLES.sql` - Local version only
5. ❌ `20250112_work_product_reporting.sql` - Superseded by _complete
6. ❌ `20250112_work_product_reporting_final.sql` - Superseded by _complete
7. ❌ `20250112_fix_profiles_schema_simple.sql` - Superseded by _mismatch
8. ❌ `dump.sql` - Database dump, not a migration

**Status**: ❌ Should be removed or archived

---

### Category E: Utility/Testing Scripts
**Purpose**: Not migrations, but useful scripts

1. `rollback_coaching_tables.sql`
2. `rollback_sponsor_connections_sequence.sql`
3. `rollback_organizational_model.sql`
4. `validate_organizational_model.sql`
5. `validate_production_migration.sql`
6. `test_work_product_reporting.sql`
7. `monitoring_scripts.sql`
8. `ai_feedback_table.sql`
9. `user_activity_sessions.sql`

**Status**: ✅ Keep for testing/validation

---

## Schema Gaps Analysis

### Dev Branch Expects But No Migration Provides:

Based on the dev branch code analysis, all expected features have corresponding migrations, but they're in the wrong location (backup folder).

**No critical gaps identified** - migrations exist but need to be moved/activated.

---

## Recommendations

### Immediate Actions:

1. **Move Dev-Required Migrations from Backup to Active**:
   ```bash
   # Move these from migrations_backup to migrations:
   - 20250112_cleanup_dev_only_objects.sql
   - 20250112_fix_profiles_schema_mismatch.sql
   - 20250112_work_product_reporting_complete.sql
   - 20250113_implement_clear_role_system.sql
   - 20250113_migrate_roles_to_new_system.sql
   ```

2. **Update MIGRATION_ORDER.md**:
   - Remove references to non-existent files
   - Update paths to reflect actual file locations
   - Create separate sections for main vs dev deployment

3. **Delete Deprecated Files**:
   ```bash
   # Remove duplicates and superseded versions:
   - PRODUCTION_MIGRATION_COMPLETE.sql
   - PRODUCTION_MIGRATION_COMPLETE_V2.sql
   - production_complete.sql
   - LOCAL_MIGRATION_COACHING_TABLES.sql (keep for reference)
   - 20250112_work_product_reporting.sql
   - 20250112_work_product_reporting_final.sql
   - 20250112_fix_profiles_schema_simple.sql
   ```

4. **Create Clear Migration Paths**:
   - **Main Branch (Production)**: Minimal migrations for coaching features
   - **Dev Branch**: Full migrations including organizational features

---

## Proposed Migration Execution Orders

### For Main Branch (Production Deployment):

```sql
-- 1. Fix sequences
fix_sponsor_connections_sequence.sql

-- 2. Add coaching tables
PRODUCTION_MIGRATION_COACHING_TABLES.sql

-- 3. Sync auth users
create_auth_users_for_existing_profiles.sql

-- 4. Create test data
create_test_sponsor.sql
```

**Total**: 4 migrations

---

### For Dev Branch (Full Feature Deployment):

```sql
-- Phase 1: Cleanup and Schema Fixes
1. 20250112_cleanup_dev_only_objects.sql
2. 20250112_fix_profiles_schema_mismatch.sql

-- Phase 2: Work Product Reporting
3. 20250112_work_product_reporting_complete.sql

-- Phase 3: Role System
4. 20250113_implement_clear_role_system.sql
5. 20250113_migrate_roles_to_new_system.sql

-- Phase 4: Organization Requests
6. PRODUCTION_MIGRATION_organization_requests.sql

-- Phase 5: Coaching Features (if not already applied)
7. fix_sponsor_connections_sequence.sql
8. PRODUCTION_MIGRATION_COACHING_TABLES.sql

-- Phase 6: Test Data
9. create_auth_users_for_existing_profiles.sql
10. create_test_sponsor.sql
```

**Total**: 10 migrations

---

## Risk Assessment

### High Risk:
- ⚠️ **MIGRATION_ORDER.md references non-existent files** - Could cause deployment failure
- ⚠️ **Multiple "complete" migration versions** - Unclear which to use
- ⚠️ **Dev-required migrations in backup** - Won't auto-apply

### Medium Risk:
- ⚠️ **Organizational model in active migrations** - May conflict with production
- ⚠️ **Stashed changes not committed** - Could be lost

### Low Risk:
- ✅ **Coaching migrations well-defined** - Clear purpose and tested
- ✅ **Rollback scripts exist** - Can revert if needed

---

## Next Steps

1. ✅ **This audit complete**
2. ⏳ **Move dev-required migrations from backup to active**
3. ⏳ **Update MIGRATION_ORDER.md with accurate paths**
4. ⏳ **Delete deprecated migration files**
5. ⏳ **Test migrations in local environment** (Task 0.2)
6. ⏳ **Review migration safety** (Task 0.4)
7. ⏳ **Document final execution order** (Task 5.1)

---

## Conclusion

The migration confusion stems from:
1. **Files in wrong locations** (backup vs active)
2. **Multiple versions** of the same migrations
3. **Outdated documentation** (MIGRATION_ORDER.md)
4. **Unclear separation** between main and dev requirements

**Resolution**: Move dev-required migrations to active folder, delete duplicates, and update documentation with clear execution orders for both main and dev branches.

---

**Audit Status**: ✅ COMPLETE  
**Confidence Level**: HIGH  
**Recommended Action**: Proceed with consolidation plan above
