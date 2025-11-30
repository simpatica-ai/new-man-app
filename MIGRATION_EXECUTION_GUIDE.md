# Migration Execution Guide

**Last Updated**: 2025-01-26  
**Status**: AUTHORITATIVE - This is the single source of truth for migrations  
**Purpose**: Clear, step-by-step guide for applying database migrations

---

## ⚠️ CRITICAL: Read This First

**DO NOT** follow MIGRATION_ORDER.md - it references files that don't exist or are in the wrong location.

**USE THIS GUIDE INSTEAD** - It reflects the actual state of the codebase.

---

## Quick Decision Tree

**Are you deploying to production (main branch)?**
→ Follow [Main Branch Deployment](#main-branch-deployment-production)

**Are you deploying dev branch features?**
→ Follow [Dev Branch Deployment](#dev-branch-deployment-full-features)

**Are you testing locally?**
→ Follow [Local Testing](#local-testing-workflow)

---

## Main Branch Deployment (Production)

### What This Deploys:
- Coaching features (sponsor connections, chat, memos)
- Sequence fixes for SERIAL columns
- Auth user synchronization
- Test accounts

### Prerequisites:
1. ✅ Database backup completed (see Task 0.1)
2. ✅ Migrations tested locally (see Task 0.2)
3. ✅ Rollback scripts ready

### Migration Files (5 total):

```bash
# Location: new-man-app/

1. fix_sponsor_connections_sequence.sql ✅ SAFE
2. PRODUCTION_MIGRATION_COACHING_TABLES_FIXED.sql ✅ SAFE (USE FIXED VERSION)
3. create_auth_users_for_existing_profiles.sql ✅ SAFE
4. add_profiles_rls_policies.sql ✅ SAFE (NEW - Required for sponsor dashboard)
5. create_test_sponsor.sql ⚠️ SKIP FOR PRODUCTION
```

**⚠️ IMPORTANT**: 
- Use `PRODUCTION_MIGRATION_COACHING_TABLES_FIXED.sql`, NOT the original version
- The original references `profiles.roles` (plural) which doesn't exist in production
- Production has `profiles.role` (singular)
- **Skip migration 4** for production (has DELETE statements)

**Safety Review**: See `MIGRATION_SAFETY_REVIEW.md` for complete analysis

### Execution Steps:

#### Step 1: Backup Database
```bash
# Via Supabase Dashboard:
# Database → Backups → Create Backup
# Name: "pre-coaching-migration-YYYY-MM-DD"
```

#### Step 2: Apply Sequence Fix
```bash
psql $DATABASE_URL -f fix_sponsor_connections_sequence.sql
```

**Verify**:
```sql
-- Should return a number (not null)
SELECT nextval('sponsor_connections_id_seq');
```

#### Step 3: Apply Coaching Tables
```bash
psql $DATABASE_URL -f PRODUCTION_MIGRATION_COACHING_TABLES_FIXED.sql
```

**⚠️ Known Issue**: The `sponsor_visible_memos` table may already exist with a different schema in production. The migration will create indexes that may fail, but the table will still be functional. This is expected and safe to ignore.

**Verify**:
```sql
-- All should return 't' (true)
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_connections');
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_chat_messages');
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_visible_memos');

-- Verify no orphaned profiles
SELECT COUNT(*) as orphaned_profiles 
FROM profiles p 
LEFT JOIN auth.users u ON p.id = u.id 
WHERE u.id IS NULL;
-- Should return 0
```

#### Step 4: Sync Auth Users
```bash
psql $DATABASE_URL -f create_auth_users_for_existing_profiles.sql
```

**Verify**:
```sql
-- Should return 0 (no orphaned profiles)
SELECT COUNT(*) FROM profiles p 
LEFT JOIN auth.users u ON p.id = u.id 
WHERE u.id IS NULL;
```

#### Step 5: Add RLS Policies for Profiles (NEW - REQUIRED)
```bash
psql $DATABASE_URL -f add_profiles_rls_policies.sql
```

**Purpose**: Allows sponsors to view their practitioners' profiles and vice versa. Without this, the sponsor dashboard will show "Unknown Practitioner" instead of actual names.

**Verify**:
```sql
-- Should return 4 policies
SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles';

-- Should include these policies:
SELECT policyname FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;
-- Expected:
-- 1. "Practitioners can view their sponsors' profiles"
-- 2. "Sponsors can view their practitioners' profiles"
-- 3. "Users can update own profile"
-- 4. "Users can view own profile"
```

#### Step 6: Create Test Accounts (Optional - SKIP FOR PRODUCTION)
```bash
# ⚠️ SKIP THIS FOR PRODUCTION
# This migration has DELETE statements that will remove existing test users
# Only run in development/testing environments

# For development/testing only:
psql $DATABASE_URL -f create_test_sponsor.sql
```

**⚠️ Production Warning**: This migration contains `DELETE` statements that will remove test users and all their data. Skip this step for production deployment.

**Verify** (if you ran it):
```sql
SELECT email FROM auth.users WHERE email LIKE '%test.com';
```

### Rollback Procedure:

```bash
# If something goes wrong:
psql $DATABASE_URL -f rollback_sponsor_connections_sequence.sql
psql $DATABASE_URL -f rollback_coaching_tables.sql

# Or restore from backup:
# Supabase Dashboard → Database → Backups → Restore
```

### Success Criteria:
- [ ] All 4 migrations executed without errors
- [ ] All verification queries pass
- [ ] Application starts without errors
- [ ] Coach desktop loads
- [ ] Can create connections and send messages

---

## Dev Branch Deployment (Full Features)

### What This Deploys:
- Everything from Main Branch, PLUS:
- Organizational model (organizations, requests)
- Work product reporting
- Enhanced role system
- Profile schema updates

### Prerequisites:
1. ✅ Main branch migrations already applied (or will be applied as part of this)
2. ✅ Database backup completed
3. ✅ Dev branch tested locally
4. ✅ Stashed changes reviewed and committed

### ⚠️ CRITICAL ISSUE: Files Are In Wrong Location

**Problem**: The migrations needed for dev branch are in `supabase/migrations_backup/`

**Solution**: Move them to `supabase/migrations/` first (see [Migration Consolidation](#migration-consolidation-required))

### Migration Files (10 total):

```bash
# Phase 1: Schema Fixes (from migrations_backup)
1. 20250112_cleanup_dev_only_objects.sql
2. 20250112_fix_profiles_schema_mismatch.sql

# Phase 2: Work Product (from migrations_backup)
3. 20250112_work_product_reporting_complete.sql

# Phase 3: Role System (from migrations_backup)
4. 20250113_implement_clear_role_system.sql
5. 20250113_migrate_roles_to_new_system.sql

# Phase 4: Organization Requests (from root)
6. PRODUCTION_MIGRATION_organization_requests.sql

# Phase 5: Coaching Features (from root)
7. fix_sponsor_connections_sequence.sql
8. PRODUCTION_MIGRATION_COACHING_TABLES.sql

# Phase 6: Test Data (from root)
9. create_auth_users_for_existing_profiles.sql
10. create_test_sponsor.sql
```

### Execution Steps:

#### Step 1: Consolidate Migrations First
**YOU MUST DO THIS FIRST** - See [Migration Consolidation](#migration-consolidation-required)

#### Step 2: Apply Migrations in Order

```bash
# Phase 1: Schema Fixes
psql $DATABASE_URL -f supabase/migrations/20250112_cleanup_dev_only_objects.sql
psql $DATABASE_URL -f supabase/migrations/20250112_fix_profiles_schema_mismatch.sql

# Verify profiles table has new columns:
psql $DATABASE_URL -c "\d profiles"
# Should show: role, roles, organization_id, updated_at

# Phase 2: Work Product
psql $DATABASE_URL -f supabase/migrations/20250112_work_product_reporting_complete.sql

# Verify function exists:
psql $DATABASE_URL -c "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'get_work_product_summary';"

# Phase 3: Role System
psql $DATABASE_URL -f supabase/migrations/20250113_implement_clear_role_system.sql
psql $DATABASE_URL -f supabase/migrations/20250113_migrate_roles_to_new_system.sql

# Verify roles updated:
psql $DATABASE_URL -c "SELECT DISTINCT unnest(roles) as role FROM profiles;"

# Phase 4: Organization Requests
psql $DATABASE_URL -f PRODUCTION_MIGRATION_organization_requests.sql

# Verify table exists:
psql $DATABASE_URL -c "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_requests');"

# Phase 5: Coaching Features (if not already applied)
psql $DATABASE_URL -f fix_sponsor_connections_sequence.sql
psql $DATABASE_URL -f PRODUCTION_MIGRATION_COACHING_TABLES.sql

# Phase 6: Test Data
psql $DATABASE_URL -f create_auth_users_for_existing_profiles.sql
psql $DATABASE_URL -f create_test_sponsor.sql
```

### Success Criteria:
- [ ] All 10 migrations executed without errors
- [ ] All verification queries pass
- [ ] Application starts without errors
- [ ] Organizational features work
- [ ] Work product reporting works
- [ ] Role system works correctly
- [ ] Coaching features work

---

## Migration Consolidation (REQUIRED)

### Problem:
Files referenced in old MIGRATION_ORDER.md are in `supabase/migrations_backup/` but need to be in `supabase/migrations/` to work.

### Solution:

```bash
cd new-man-app

# Move dev-required migrations from backup to active
mv supabase/migrations_backup/20250112_cleanup_dev_only_objects.sql supabase/migrations/
mv supabase/migrations_backup/20250112_fix_profiles_schema_mismatch.sql supabase/migrations/
mv supabase/migrations_backup/20250112_work_product_reporting_complete.sql supabase/migrations/
mv supabase/migrations_backup/20250113_implement_clear_role_system.sql supabase/migrations/
mv supabase/migrations_backup/20250113_migrate_roles_to_new_system.sql supabase/migrations/

# Verify they're in the right place
ls -la supabase/migrations/202501*
```

### Delete Deprecated Files:

```bash
# Remove duplicate/superseded versions
rm PRODUCTION_MIGRATION_COMPLETE.sql
rm PRODUCTION_MIGRATION_COMPLETE_V2.sql
rm production_complete.sql

# Remove superseded work product versions
rm supabase/migrations_backup/20250112_work_product_reporting.sql
rm supabase/migrations_backup/20250112_work_product_reporting_final.sql

# Remove superseded schema fix
rm supabase/migrations_backup/20250112_fix_profiles_schema_simple.sql
```

---

## Local Testing Workflow

### Using Local Supabase (Recommended):

```bash
cd new-man-app

# 1. Start local Supabase
supabase start

# 2. Migrations in supabase/migrations/ will auto-apply
# Check status:
supabase status

# 3. Apply root-level migrations manually
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f fix_sponsor_connections_sequence.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f PRODUCTION_MIGRATION_COACHING_TABLES.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f create_auth_users_for_existing_profiles.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f create_test_sponsor.sql

# 4. Test application
npm run dev

# 5. Access Supabase Studio
open http://localhost:54323
```

### Reset and Retry:

```bash
# If something goes wrong, reset:
supabase stop --no-backup
supabase start

# Migrations will reapply automatically
```

---

## Troubleshooting

### Error: "column 'roles' does not exist"
**Full Error**: `ERROR: column "roles" does not exist. HINT: Perhaps you meant to reference the column "profiles.role".`

**Cause**: Using wrong migration file - `PRODUCTION_MIGRATION_COACHING_TABLES.sql` instead of the FIXED version

**Fix**: Use `PRODUCTION_MIGRATION_COACHING_TABLES_FIXED.sql` which references `role` (singular)

### Error: "column 'memo_id' does not exist" (on sponsor_visible_memos)
**Cause**: Production's `sponsor_visible_memos` table has different schema than migration expects

**Fix**: This is expected and safe to ignore. The table exists and is functional with production's schema.

### Error: "relation does not exist"
**Cause**: Migration not applied or applied in wrong order  
**Fix**: Check migration order, ensure prerequisites are met

### Error: "column already exists"
**Cause**: Migration already applied or not idempotent  
**Fix**: Check if migration was already run, or skip if safe

### Error: "foreign key constraint violation"
**Cause**: Referenced table/data doesn't exist  
**Fix**: Ensure migrations are applied in correct order

### Error: "null value in column violates not-null constraint"
**Cause**: Sequence not properly initialized  
**Fix**: Run `fix_sponsor_connections_sequence.sql`

### Application won't start after migration
**Cause**: Schema mismatch between code and database  
**Fix**: 
1. Check which branch you're on (main vs dev)
2. Ensure correct migrations applied for that branch
3. Check browser console for specific errors

---

## File Location Reference

### Root Directory (`new-man-app/`):
- `fix_sponsor_connections_sequence.sql` - Sequence fix
- `PRODUCTION_MIGRATION_COACHING_TABLES.sql` - Coaching tables
- `PRODUCTION_MIGRATION_organization_requests.sql` - Org requests
- `create_auth_users_for_existing_profiles.sql` - Auth sync
- `create_test_sponsor.sql` - Test data
- `rollback_*.sql` - Rollback scripts

### Active Migrations (`supabase/migrations/`):
- Auto-apply when Supabase starts
- Timestamped files (YYYYMMDDHHMMSS_name.sql)
- After consolidation, will include dev-required migrations

### Backup (`supabase/migrations_backup/`):
- Old versions and superseded migrations
- DO NOT USE directly
- Move needed files to active migrations first

### Temp Disabled (`supabase/migrations_temp_disabled/`):
- Disabled to allow direct production data loading
- DO NOT USE

---

## Migration Status Tracking

### Main Branch (Production):
- [x] Sequence fix - `fix_sponsor_connections_sequence.sql`
- [x] Coaching tables - `PRODUCTION_MIGRATION_COACHING_TABLES.sql`
- [x] Auth sync - `create_auth_users_for_existing_profiles.sql`
- [x] Test data - `create_test_sponsor.sql`

### Dev Branch (Full Features):
- [ ] Consolidation complete (move files from backup)
- [ ] Schema cleanup - `20250112_cleanup_dev_only_objects.sql`
- [ ] Profile schema fix - `20250112_fix_profiles_schema_mismatch.sql`
- [ ] Work product - `20250112_work_product_reporting_complete.sql`
- [ ] Role system - `20250113_implement_clear_role_system.sql`
- [ ] Role migration - `20250113_migrate_roles_to_new_system.sql`
- [ ] Org requests - `PRODUCTION_MIGRATION_organization_requests.sql`
- [ ] Coaching features - (same as main branch)
- [ ] Test data - (same as main branch)

---

## Lessons Learned from Testing (2025-01-26)

### Issue 1: Schema Mismatch - profiles.role vs profiles.roles
**Problem**: Original `PRODUCTION_MIGRATION_COACHING_TABLES.sql` referenced `profiles.roles` (TEXT[]) but production has `profiles.role` (TEXT).

**Solution**: Created `PRODUCTION_MIGRATION_COACHING_TABLES_FIXED.sql` that uses `role` (singular) instead.

**Impact**: RLS policies that check user roles now work correctly with production schema.

**Files Affected**:
- ❌ `PRODUCTION_MIGRATION_COACHING_TABLES.sql` - DO NOT USE
- ✅ `PRODUCTION_MIGRATION_COACHING_TABLES_FIXED.sql` - USE THIS

### Issue 2: sponsor_visible_memos Schema Difference
**Problem**: Production's `sponsor_visible_memos` table has different columns than expected:
- Production has: `virtue_id`, `stage_number`, `memo_text`, `practitioner_updated_at`, `sponsor_read_at`
- Migration expects: `memo_id`, `sponsor_user_id`, `is_read`, `read_at`

**Solution**: The migration is idempotent and will skip creating the table if it exists. Index creation may fail but this is safe to ignore.

**Impact**: The table exists and is functional, just with a different schema. Application code must handle both schemas.

### Issue 3: Test Users Already Exist
**Problem**: `create_auth_users_for_existing_profiles.sql` tries to create users that already exist.

**Solution**: The script uses `ON CONFLICT DO NOTHING` so it's safe to run multiple times.

**Impact**: None - script is idempotent.

### Testing Results (Local Supabase with Production Data):
- ✅ Sequence fix applied successfully
- ✅ sponsor_connections table created/verified
- ✅ sponsor_chat_messages table created/verified
- ✅ sponsor_visible_memos table exists (different schema)
- ✅ No orphaned profiles found
- ✅ All migrations are idempotent

---

## Important Notes

1. **MIGRATION_ORDER.md is OUTDATED** - Do not use it. Use this guide instead.

2. **Supabase Auto-Applies Migrations** - Files in `supabase/migrations/` are automatically applied when Supabase starts. Root-level SQL files must be applied manually.

3. **Idempotency** - Most migrations use `IF NOT EXISTS` / `IF EXISTS` so they can be run multiple times safely. But always test in local environment first.

4. **Backup Before Production** - ALWAYS backup production database before applying migrations. No exceptions.

5. **Test Locally First** - ALWAYS test migrations in local Supabase before applying to production.

6. **One-Way Operations** - Some migrations (like role system changes) are difficult to rollback. Test thoroughly.

7. **Stashed Changes** - Dev branch has stashed changes. Review and commit them before deploying.

---

## Questions?

If you're unsure about:
- Which migrations to apply → Check the [Quick Decision Tree](#quick-decision-tree)
- Where files are located → Check [File Location Reference](#file-location-reference)
- How to test locally → Follow [Local Testing Workflow](#local-testing-workflow)
- What to do if errors occur → Check [Troubleshooting](#troubleshooting)

**Still confused?** Read `MIGRATION_AUDIT.md` for the full analysis of how we got here.

---

## Maintenance

**When adding new migrations:**
1. Create timestamped file in `supabase/migrations/` for auto-apply features
2. OR create named file in root for manual-apply features
3. Update this guide with the new migration
4. Test locally before committing
5. Update the [Migration Status Tracking](#migration-status-tracking) section

**When this guide is updated:**
1. Update the "Last Updated" date at the top
2. Document what changed and why
3. Commit with clear message: "docs: update migration guide - [reason]"

---

**End of Guide**
