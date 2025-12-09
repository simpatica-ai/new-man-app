# Migration Testing Guide for Hosted Supabase

## Overview

Since you're using a hosted Supabase instance (not local), we need a different approach to test our migration scripts safely. This guide provides a step-by-step process to validate and test the migration scripts.

## Current Situation

Based on the existing migrations in your project, it appears the organizational model has already been partially implemented. Our new migration scripts may conflict with existing structures.

## Step 1: Validate Current Database State

First, let's check what already exists in your database:

### Run the Validation Query

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the contents of `validate_current_state.sql`

This will show you:
- What tables already exist
- What columns are already added to profiles
- Current data counts
- Existing functions and indexes

## Step 2: Review Migration Conflicts

Based on the validation results, we need to determine:

### If Organizational Model Already Exists:
- ✅ Organizations table exists
- ✅ Profiles has organization_id, roles, is_active columns
- ✅ Practitioner assignments table exists

**Action**: Use the fixed migration script (`20250103_organizational_model_fixes.sql`) instead of the original scripts.

### If Organizational Model is Missing:
- ❌ Organizations table missing
- ❌ Profiles missing organizational columns

**Action**: Use the original migration scripts, but test them first.

## Step 3: Safe Testing Strategy

### Option A: Test on Staging/Development Database

If you have a staging environment:

1. **Create a backup** of your staging database
2. **Run the migration scripts** on staging
3. **Validate the results** using the validation script
4. **Test the application** to ensure everything works
5. **Document any issues** and fix them

### Option B: Test with Transaction Rollback

If you only have production (not recommended for major migrations):

```sql
BEGIN;
-- Run migration script here
-- Test the results
-- If everything looks good: COMMIT;
-- If there are issues: ROLLBACK;
```

### Option C: Create Test Database

1. **Export your current schema and sample data**
2. **Create a new Supabase project** for testing
3. **Import the data** into the test project
4. **Run migrations** on the test project
5. **Validate results** before applying to production

## Step 4: Recommended Testing Sequence

### 1. Run Current State Validation
```sql
-- Copy and paste contents of validate_current_state.sql
```

### 2. Based on Results, Choose Migration Path

#### If Organizational Model Exists:
```sql
-- Run the fixes script
-- Copy and paste contents of 20250103_organizational_model_fixes.sql
```

#### If Organizational Model Missing:
```sql
-- Run original scripts in order:
-- 1. 20250103_organizational_model_schema.sql
-- 2. 20250103_organizational_model_data.sql  
-- 3. 20250103_organizational_model_indexes.sql
```

### 3. Validate Migration Results
```sql
-- Copy and paste contents of validate_production_migration.sql
```

### 4. Test Application Functionality

After running migrations, test:
- ✅ User login still works
- ✅ Existing sponsor dashboards work (now as coach dashboards)
- ✅ Practitioner experience unchanged
- ✅ No broken functionality

## Step 5: Production Deployment Plan

### Pre-Deployment Checklist
- [ ] Migration tested on staging/test environment
- [ ] All validation scripts pass
- [ ] Application functionality verified
- [ ] Rollback procedure tested
- [ ] Team notified of maintenance window

### Deployment Steps
1. **Schedule maintenance window** (30-60 minutes)
2. **Create production backup**
3. **Run migration scripts** in sequence
4. **Run validation scripts**
5. **Test critical functionality**
6. **Monitor for issues**

### Rollback Plan
If issues are detected:
1. **Stop application** (maintenance mode)
2. **Run rollback script** (`rollback_organizational_model.sql`)
3. **Restore from backup** if needed
4. **Validate rollback** success
5. **Resume application**

## Step 6: Monitoring After Migration

### Immediate Monitoring (First Hour)
- User login success rate
- API response times
- Database performance
- Error logs

### Extended Monitoring (First 24 Hours)
- User engagement levels
- Feature functionality
- Support ticket volume
- Performance metrics

## Common Issues and Solutions

### Issue: "Table already exists" errors
**Solution**: Use the fixes script instead of original schema script

### Issue: "Column already exists" errors  
**Solution**: Scripts should use `IF NOT EXISTS` - check script syntax

### Issue: Data migration fails
**Solution**: Check existing data structure and adjust migration logic

### Issue: Performance degradation
**Solution**: Ensure all indexes are created and analyze query performance

## Files You Need

1. **validate_current_state.sql** - Check what exists
2. **20250103_organizational_model_fixes.sql** - Safe migration updates
3. **validate_production_migration.sql** - Verify migration success
4. **rollback_organizational_model.sql** - Emergency rollback
5. **monitoring_scripts.sql** - Post-migration monitoring

## Next Steps

1. **Run the validation query** to understand your current state
2. **Share the results** so we can determine the best migration path
3. **Test the appropriate migration script** on a safe environment
4. **Plan the production deployment** once testing is successful

## Questions to Answer

Before proceeding, please check:

1. **Do you have a staging/development Supabase project** for testing?
2. **What does the validation query show** about your current database state?
3. **When would be a good maintenance window** for production deployment?
4. **Do you have database backup procedures** in place?

Let me know the results of the validation query and we can proceed with the appropriate migration path!