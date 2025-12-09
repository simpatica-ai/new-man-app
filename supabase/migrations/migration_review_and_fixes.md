# Migration Scripts Review and Fixes

## Issues Found in Migration Scripts

After reviewing the migration scripts against the existing database schema, I've identified several issues that need to be addressed:

### 1. **Duplicate Migration Conflict**

**Issue**: The database already has an organizational model migration (`20250102_organizational_model.sql`) that creates:
- `organizations` table
- `practitioner_assignments` table  
- `organization_invitations` table
- Extensions to `profiles` table with organizational columns

**Our new scripts** (`20250103_organizational_model_*.sql`) attempt to create the same structures.

**Fix**: We need to either:
- A) Update our scripts to work with the existing schema
- B) Create incremental migration scripts that only add what's missing
- C) Create a consolidated migration that handles both scenarios

### 2. **Schema Conflicts**

**Existing Schema** (from `20250102_organizational_model.sql`):
```sql
-- Organizations table already exists with these fields:
- max_users INTEGER DEFAULT 40 (with CHECK constraint <= 40)
- subscription_tier: 'basic', 'premium', 'enterprise' 
- roles constraint: ARRAY['admin', 'coach', 'therapist', 'practitioner']
```

**Our New Schema** attempts to create:
```sql
-- Same table with slightly different constraints:
- max_users with CHECK <= 1000 (conflicts with existing <= 40)
- subscription_tier includes 'legacy' (not in existing)
```

### 3. **Data Migration Issues**

**Issue**: Our data migration script assumes:
- No existing organizational data
- Need to create "individual-users" default organization
- Need to migrate sponsor_relationships to practitioner_assignments

**Reality**: The existing migration already:
- Creates a default organization for existing users
- Migrates sponsor relationships to coach assignments
- Updates user roles

### 4. **Index Conflicts**

Many indexes we're trying to create already exist from the previous migration.

## Recommended Fix Strategy

### Option A: Create Incremental Migration (Recommended)

Create new migration scripts that:
1. Check what already exists
2. Only add missing pieces
3. Handle data migration safely

### Option B: Update Existing Migration

Modify the existing `20250102_organizational_model.sql` to include our production-ready features.

### Option C: Create Consolidated Migration

Create a single, comprehensive migration that handles all scenarios.

## Fixed Migration Scripts

Let me create corrected versions of our migration scripts: