# Testing Migration Scripts on Dev Database

## Overview

Since you're using a hosted Supabase instance, we'll test the migration scripts on your **development database** before applying them to production. This approach is much safer and more realistic.

## Testing Strategy

### Phase 1: Current State Assessment
1. Run validation script on dev database to understand current state
2. Identify what organizational model components already exist
3. Determine what our migration scripts need to do

### Phase 2: Safe Migration Testing
1. Test our fixed migration scripts on dev database
2. Validate data integrity after migration
3. Test rollback procedures
4. Document any issues found

### Phase 3: Production Readiness
1. Refine scripts based on dev testing results
2. Create final production migration plan
3. Prepare monitoring and rollback procedures

## Step-by-Step Testing Process

### Step 1: Check Current Dev Database State

Run this query in your Supabase SQL Editor (dev instance):

```sql
-- Copy and paste the contents of validate_current_state.sql
```

This will show you:
- What tables already exist
- What organizational model components are in place
- Current data counts
- Existing functions and indexes

### Step 2: Test Migration Scripts

Based on the current state, we'll run the appropriate migration script:

**If organizational model doesn't exist:**
```sql
-- Run: 20250103_organizational_model_schema.sql
-- Then: 20250103_organizational_model_data.sql  
-- Then: 20250103_organizational_model_indexes.sql
```

**If organizational model already exists:**
```sql
-- Run: 20250103_organizational_model_fixes.sql
```

### Step 3: Validate Migration Results

After running migration scripts:

```sql
-- Run: validate_production_migration.sql
```

This will verify:
- All users have organization assignments
- All sponsor relationships migrated to coach assignments
- Data integrity maintained
- Performance indexes created

### Step 4: Test Monitoring Scripts

```sql
-- Run: monitoring_scripts.sql
```

Then test the monitoring functions:
```sql
SELECT * FROM check_organizational_health();
SELECT * FROM monitor_organization_metrics();
```

### Step 5: Test Rollback (Optional)

If you want to test rollback:
```sql
-- Run: rollback_organizational_model.sql
```

Then restore from backup or re-run migration.

## Files to Test in Order

1. **validate_current_state.sql** - Check what exists
2. **20250103_organizational_model_fixes.sql** - Apply fixes/updates
3. **validate_production_migration.sql** - Verify migration success
4. **monitoring_scripts.sql** - Set up monitoring
5. **rollback_organizational_model.sql** - Test rollback (optional)

## Expected Results

After successful migration on dev, you should see:
- All existing users assigned to organizations
- Sponsor relationships converted to coach assignments
- New organizational tables and functions created
- Monitoring views and functions available
- No data loss or corruption

## Next Steps After Dev Testing

1. **Document any issues found** during dev testing
2. **Refine migration scripts** based on results
3. **Create production deployment plan** with lessons learned
4. **Schedule production migration** with confidence

## Safety Notes

- Dev database testing is safe - no production impact
- Always check results after each script
- Document any unexpected behavior
- Keep backups of dev database state if needed

Would you like me to help you run these tests on your dev database?