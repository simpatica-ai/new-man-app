# ⚠️ DEPRECATED - USE MIGRATION_EXECUTION_GUIDE.md INSTEAD

**This file is outdated and should not be used.**

## 👉 Use This Instead:
**[MIGRATION_EXECUTION_GUIDE.md](./MIGRATION_EXECUTION_GUIDE.md)**

The new guide is:
- ✅ More comprehensive and actionable
- ✅ Includes troubleshooting and verification steps
- ✅ Separates main branch vs dev branch clearly
- ✅ Provides local testing workflow
- ✅ Self-contained and doesn't rely on chat history

---

# OLD CONTENT BELOW (Kept for Reference)

# Migration Order for Production Deployment

**Last Updated**: 2025-01-26  
**Status**: ⚠️ DEPRECATED - See MIGRATION_EXECUTION_GUIDE.md instead  
**Related**: See `MIGRATION_AUDIT.md` for complete analysis

---

## Overview

This document provides clear migration execution orders for:
1. **Main Branch (Production)** - Minimal migrations for coaching features
2. **Dev Branch (Full Features)** - Complete migrations including organizational features

---

## Main Branch (Production) Migration Order

### Purpose
Deploy coaching features to production with minimal risk.

### Prerequisites
- ✅ Database backup completed (Task 0.1)
- ✅ Migrations tested in local environment (Task 0.2)
- ✅ Rollback scripts ready (Task 0.3)

### Execution Order

#### 1. Fix SERIAL Sequences (FIRST - CRITICAL)
```bash
psql $DATABASE_URL -f fix_sponsor_connections_sequence.sql
```
**Purpose**: Fix auto-increment sequences for sponsor_connections table  
**Validates**: AC1 - Database schema fixed  
**Rollback**: `rollback_sponsor_connections_sequence.sql`

**Verification**:
```sql
-- Should return a number, not null
SELECT nextval('sponsor_connections_id_seq');
```

---

#### 2. Add Coaching Tables (SECOND)
```bash
psql $DATABASE_URL -f PRODUCTION_MIGRATION_COACHING_TABLES.sql
```
**Purpose**: Create sponsor_connections, sponsor_chat_messages, sponsor_visible_memos tables  
**Validates**: AC1, AC2 - Coaching features functional  
**Rollback**: `rollback_coaching_tables.sql`

**Verification**:
```sql
-- All should return true
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_connections');
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_chat_messages');
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_visible_memos');
```

---

#### 3. Sync Auth Users (THIRD)
```bash
psql $DATABASE_URL -f create_auth_users_for_existing_profiles.sql
```
**Purpose**: Ensure all profiles have corresponding auth.users entries  
**Validates**: AC1, AC6 - Test data available  
**Rollback**: Manual - remove created auth.users entries

**Verification**:
```sql
-- Should return 0 rows (no orphaned profiles)
SELECT p.id, p.full_name 
FROM profiles p 
LEFT JOIN auth.users u ON p.id = u.id 
WHERE u.id IS NULL;
```

---

#### 4. Create Test Data (FOURTH - OPTIONAL)
```bash
psql $DATABASE_URL -f create_test_sponsor.sql
```
**Purpose**: Create test accounts for validation  
**Validates**: AC6 - Test data available  
**Rollback**: Manual - delete test users

**Verification**:
```sql
-- Verify test accounts exist
SELECT u.email, p.full_name, p.roles
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email IN ('sponsor@test.com', 'individual.practitioner@test.com');
```

---

### Main Branch Summary

**Total Migrations**: 4  
**Estimated Time**: 30 minutes  
**Risk Level**: LOW - Well-tested, focused on coaching features  
**Rollback**: Available for all migrations

---

## Dev Branch (Full Features) Migration Order

### Purpose
Deploy complete feature set including organizational features, work product reporting, and role system.

### Prerequisites
- ✅ Main branch migrations completed successfully
- ✅ Dev branch migrations tested in local environment
- ✅ Backup created before dev deployment
- ⚠️ **CRITICAL**: Move migrations from backup to active folder first (see below)

### Required Pre-Deployment Actions

**Move these files from `supabase/migrations_backup/` to `supabase/migrations/`**:
```bash
cd new-man-app/supabase

# Move dev-required migrations to active folder
mv migrations_backup/20250112_cleanup_dev_only_objects.sql migrations/
mv migrations_backup/20250112_fix_profiles_schema_mismatch.sql migrations/
mv migrations_backup/20250112_work_product_reporting_complete.sql migrations/
mv migrations_backup/20250113_implement_clear_role_system.sql migrations/
mv migrations_backup/20250113_migrate_roles_to_new_system.sql migrations/

# Verify they're in the right place
ls -la migrations/202501*
```

---

### Execution Order

#### Phase 1: Cleanup and Schema Fixes

##### 1. Cleanup Dev-Only Objects (FIRST - CRITICAL)
```bash
psql $DATABASE_URL -f supabase/migrations/20250112_cleanup_dev_only_objects.sql
```
**Purpose**: Remove dev-only views/objects that don't exist in production  
**Why First**: Prevents schema conflicts  
**Validates**: AC9 - Migration scripts consolidated

**Verification**:
```sql
-- Should return empty (no dev-only views)
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' AND table_name LIKE '%email%';
```

---

##### 2. Fix Profiles Schema Mismatch (SECOND - CRITICAL)
```bash
psql $DATABASE_URL -f supabase/migrations/20250112_fix_profiles_schema_mismatch.sql
```
**Purpose**: Add missing columns (role, organization_id, etc.) to profiles table  
**Why Second**: Ensures backward compatibility  
**Validates**: AC9 - Schema aligned with dev branch

**Verification**:
```sql
-- Verify profiles table has required columns
\d profiles

-- Should show: role, roles, organization_id, updated_at
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('role', 'roles', 'organization_id', 'updated_at');
```

---

#### Phase 2: Work Product Reporting

##### 3. Work Product Reporting Complete (THIRD)
```bash
psql $DATABASE_URL -f supabase/migrations/20250112_work_product_reporting_complete.sql
```
**Purpose**: Add work product reporting functionality  
**Includes**: Tables, functions, and indexes  
**Validates**: Dev branch work product features

**Verification**:
```sql
-- Test work product functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%work_product%';

-- Should include: get_work_product_summary
```

---

##### 4. Fix Missing Updated At Column (FOURTH - IF NEEDED)
```bash
# Only if step 3 didn't fully complete
# Check first:
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns 
WHERE table_name = 'user_virtue_stage_memos' AND column_name = 'updated_at';"

# If empty, run:
psql $DATABASE_URL -f supabase/migrations_backup/20250112_add_missing_updated_at_columns.sql
```
**Purpose**: Add missing updated_at column to user_virtue_stage_memos  
**Why Conditional**: May already be added by step 3  
**Validates**: Schema completeness

---

#### Phase 3: Role System

##### 5. Implement Clear Role System (FIFTH)
```bash
psql $DATABASE_URL -f supabase/migrations/20250113_implement_clear_role_system.sql
```
**Purpose**: Update role system to be more explicit  
**Actions**:
- Sets system administrator role
- Creates role validation functions
- Prepares for org- vs ind- role prefixes

**Verification**:
```sql
-- Check for role validation functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%role%';
```

---

##### 6. Migrate All Roles to New System (SIXTH)
```bash
psql $DATABASE_URL -f supabase/migrations/20250113_migrate_roles_to_new_system.sql
```
**Purpose**: Convert all existing roles to new clear naming system  
**Handles**:
- Production simple roles (admin, sponsor, user)
- Dev arrays
- Preserves organizational context
- Multi-role users

**Verification**:
```sql
-- Check role migration
SELECT DISTINCT roles FROM profiles WHERE roles IS NOT NULL;

-- Should see org- and ind- prefixes
```

---

#### Phase 4: Organization Request System

##### 7. Organization Request System (SEVENTH - FINAL)
```bash
psql $DATABASE_URL -f PRODUCTION_MIGRATION_organization_requests.sql
```
**Purpose**: Add organization request and approval system  
**Creates**:
- organization_requests table
- Approval workflow
- Admin interface functions

**Verification**:
```sql
-- Verify organization_requests table exists
SELECT EXISTS (SELECT 1 FROM information_schema.tables 
WHERE table_name = 'organization_requests');

-- Check approval functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%organization_request%';
```

---

#### Phase 5: Coaching Features (If Not Already Applied)

If main branch migrations weren't already applied:

##### 8. Fix Sequences
```bash
psql $DATABASE_URL -f fix_sponsor_connections_sequence.sql
```

##### 9. Add Coaching Tables
```bash
psql $DATABASE_URL -f PRODUCTION_MIGRATION_COACHING_TABLES.sql
```

---

#### Phase 6: Test Data

##### 10. Sync Auth Users
```bash
psql $DATABASE_URL -f create_auth_users_for_existing_profiles.sql
```

##### 11. Create Test Data
```bash
psql $DATABASE_URL -f create_test_sponsor.sql
```

---

### Dev Branch Summary

**Total Migrations**: 10-11 (depending on if main migrations already applied)  
**Estimated Time**: 1-2 hours  
**Risk Level**: MEDIUM - More complex, includes organizational features  
**Rollback**: Available for most migrations

---

## Why This Order Matters

### Main Branch:
1. **Sequences First**: Must work before inserting data
2. **Tables Second**: Must exist before foreign keys
3. **Auth Sync Third**: Ensures referential integrity
4. **Test Data Last**: Safe to add after schema is stable

### Dev Branch:
1. **Cleanup First**: Removes objects that exist in dev but not production
2. **Schema Fix Second**: Ensures profiles table has all expected columns
3. **Work Product Third**: Builds on stable schema
4. **Roles Fourth**: Requires profiles schema to be correct
5. **Org Requests Fifth**: Independent feature, safe to add last
6. **Features Last**: Adds new functionality on top of stable schema

---

## Production Safety Checklist

### Before Deploying Main Branch:
- [ ] Database backup completed and verified
- [ ] Migrations tested in local environment
- [ ] Rollback scripts tested
- [ ] Application tested with new schema
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

### Before Deploying Dev Branch:
- [ ] Main branch migrations completed successfully
- [ ] Dev-required migrations moved from backup to active
- [ ] Migrations tested in local environment with dev branch code
- [ ] Application tested with full schema
- [ ] No console errors in browser
- [ ] All dev branch features work

---

## Rollback Plan

### Main Branch Rollback:
```bash
# Rollback in reverse order
psql $DATABASE_URL -f rollback_coaching_tables.sql
psql $DATABASE_URL -f rollback_sponsor_connections_sequence.sql

# Or restore from backup
# Supabase Dashboard → Database → Backups → Restore
```

### Dev Branch Rollback:
```bash
# Work product rollback
psql $DATABASE_URL -f supabase/migrations_backup/20250112_work_product_reporting_rollback.sql

# For other migrations, restore from backup
# Supabase Dashboard → Database → Backups → Restore to point before dev deployment
```

---

## Testing Commands

### After Main Branch Deployment:
```sql
-- Verify sequences work
SELECT nextval('sponsor_connections_id_seq');

-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('sponsor_connections', 'sponsor_chat_messages', 'sponsor_visible_memos');

-- Verify no orphaned profiles
SELECT COUNT(*) FROM profiles p 
LEFT JOIN auth.users u ON p.id = u.id 
WHERE u.id IS NULL;
-- Should return 0
```

### After Dev Branch Deployment:
```sql
-- Verify profiles schema
\d profiles
-- Should show: role, roles, organization_id, updated_at

-- Verify work product functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%work_product%';

-- Verify organization requests table
SELECT EXISTS (SELECT 1 FROM information_schema.tables 
WHERE table_name = 'organization_requests');

-- Verify role system
SELECT DISTINCT roles FROM profiles WHERE roles IS NOT NULL LIMIT 5;
```

---

## Application Compatibility

### Main Branch:
- ✅ Handles missing organizational features gracefully
- ✅ Works with basic role system
- ✅ Coaching features fully functional

### Dev Branch:
- ✅ Requires all migrations to be applied
- ✅ Expects organizational features
- ✅ Requires new role system
- ✅ Needs work product reporting tables

---

## Common Issues and Solutions

### Issue: Migration file not found
**Cause**: File is in backup folder  
**Solution**: Move from `migrations_backup/` to `migrations/` or run from backup location

### Issue: "Table already exists"
**Cause**: Migration not idempotent  
**Solution**: Migrations use `IF NOT EXISTS` - safe to re-run

### Issue: Foreign key violations
**Cause**: Referenced table/data doesn't exist yet  
**Solution**: Follow exact order - tables created before foreign keys

### Issue: Dev branch expects schema that doesn't exist
**Cause**: Migrations not applied or in wrong order  
**Solution**: Follow dev branch order exactly, verify each step

---

## Files Status

### ✅ Ready to Use (Correct Location):
- `fix_sponsor_connections_sequence.sql` (root)
- `PRODUCTION_MIGRATION_COACHING_TABLES.sql` (root)
- `PRODUCTION_MIGRATION_organization_requests.sql` (root)
- `create_auth_users_for_existing_profiles.sql` (root)
- `create_test_sponsor.sql` (root)

### ⚠️ Need to Move (Currently in Backup):
- `20250112_cleanup_dev_only_objects.sql`
- `20250112_fix_profiles_schema_mismatch.sql`
- `20250112_work_product_reporting_complete.sql`
- `20250113_implement_clear_role_system.sql`
- `20250113_migrate_roles_to_new_system.sql`

### ❌ Deprecated (Do Not Use):
- `PRODUCTION_MIGRATION_COMPLETE.sql` (superseded)
- `PRODUCTION_MIGRATION_COMPLETE_V2.sql` (superseded)
- `production_complete.sql` (duplicate)
- `LOCAL_MIGRATION_COACHING_TABLES.sql` (local only)

---

## Related Documentation

- `MIGRATION_AUDIT.md` - Complete analysis of all migration files
- `ROLLBACK_PROCEDURES.md` - Detailed rollback instructions
- `dev-branch-migration-testing.md` - Testing guide for dev branch
- `CRITICAL_MIGRATION_ISSUES.md` - Known issues and solutions

---

**Document Status**: ✅ ACCURATE - Reflects actual file locations  
**Last Verified**: 2025-01-26  
**Next Review**: After dev branch deployment
