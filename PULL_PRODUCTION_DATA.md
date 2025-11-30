# Pull Production Schema and Data to Local

## Overview
Since production doesn't have much data yet, we can pull both schema AND data to local for realistic testing.

## Benefits
- ✅ Test with real production data
- ✅ Realistic testing environment
- ✅ Catch issues before they hit production
- ✅ Verify migrations work with actual data
- ✅ Test application with real scenarios

## Method 1: Using Supabase CLI (Recommended)

### Step 1: Link to Production
```bash
cd new-man-app

# Link to production (will prompt for password)
supabase link --project-ref ogucnankmxrakkxavelk

# Get password from:
# https://supabase.com/dashboard/project/ogucnankmxrakkxavelk/settings/database
```

### Step 2: Pull Schema
```bash
# This creates a migration file with current schema
supabase db pull

# Creates: supabase/migrations/YYYYMMDDHHMMSS_remote_schema.sql
# This is the COMPLETE working schema from production
```

### Step 3: Pull Data (Manual)
Since Supabase CLI doesn't pull data automatically, we'll use pg_dump:

```bash
# Get connection string from Supabase dashboard:
# Settings → Database → Connection String → URI

# Export data only (no schema)
pg_dump "postgresql://postgres.ogucnankmxrakkxavelk:[PASSWORD]@aws-1-us-west-1.pooler.supabase.com:6543/postgres" \
  --data-only \
  --schema=public \
  --exclude-table=auth.* \
  --exclude-table=storage.* \
  -f production_data.sql

# This exports all data from public schema
```

### Step 4: Apply to Local
```bash
# Start local Supabase
supabase start

# Apply schema (from pulled migration)
supabase db reset

# Import data
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -f production_data.sql
```

## Method 2: Using pg_dump (Complete Backup)

### Step 1: Get Connection Details
From Supabase Dashboard:
- Go to: Settings → Database
- Copy: Connection String (URI format)
- Replace `[YOUR-PASSWORD]` with actual password

### Step 2: Export Everything
```bash
# Export schema + data in one file
pg_dump "postgresql://postgres.ogucnankmxrakkxavelk:[PASSWORD]@aws-1-us-west-1.pooler.supabase.com:6543/postgres" \
  --schema=public \
  --format=custom \
  -f production_complete.dump

# Or as SQL file (easier to read/edit)
pg_dump "postgresql://postgres.ogucnankmxrakkxavelk:[PASSWORD]@aws-1-us-west-1.pooler.supabase.com:6543/postgres" \
  --schema=public \
  -f production_complete.sql
```

### Step 3: Import to Local
```bash
# Start local Supabase
supabase start

# Import (custom format)
pg_restore -h localhost -p 54322 -U postgres -d postgres \
  --clean \
  production_complete.dump

# Or import (SQL format)
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -f production_complete.sql
```

## Method 3: Using Supabase Dashboard (Manual but Simple)

### Step 1: Export Tables via Dashboard
```
1. Go to: https://supabase.com/dashboard/project/ogucnankmxrakkxavelk
2. Navigate to: Database → Tables
3. For each table:
   - Click on table
   - Click "..." menu
   - Select "Export as CSV"
   - Save file
```

### Step 2: Get Schema via SQL Editor
```sql
-- Run in SQL Editor to get CREATE TABLE statements
SELECT 
  'CREATE TABLE ' || table_schema || '.' || table_name || ' (' ||
  string_agg(
    column_name || ' ' || data_type || 
    CASE WHEN character_maximum_length IS NOT NULL 
      THEN '(' || character_maximum_length || ')' 
      ELSE '' 
    END,
    ', '
  ) || ');'
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_schema, table_name
ORDER BY table_name;
```

### Step 3: Import to Local
```bash
# Create tables manually or use schema file
# Then import CSVs via Supabase Studio (http://localhost:54323)
```

## Recommended Approach

**Use Method 1 (Supabase CLI + pg_dump)** because:
1. ✅ Most reliable
2. ✅ Gets complete schema
3. ✅ Gets all data
4. ✅ Preserves relationships
5. ✅ Easy to repeat

## Step-by-Step Instructions

### 1. Get Database Password
```
Go to: https://supabase.com/dashboard/project/ogucnankmxrakkxavelk/settings/database
Find: "Database Password" section
Copy or reset password
```

### 2. Link to Production
```bash
cd new-man-app
supabase link --project-ref ogucnankmxrakkxavelk
# Paste password when prompted
```

### 3. Pull Schema
```bash
supabase db pull
# Creates migration file with complete schema
```

### 4. Export Data
```bash
# Replace [PASSWORD] with your database password
pg_dump "postgresql://postgres.ogucnankmxrakkxavelk:[PASSWORD]@aws-1-us-west-1.pooler.supabase.com:6543/postgres" \
  --data-only \
  --schema=public \
  --exclude-table-data='auth.*' \
  --exclude-table-data='storage.*' \
  -f production_data.sql
```

### 5. Start Local and Import
```bash
# Clean start
supabase stop --no-backup
supabase start

# Apply schema
supabase db reset

# Import data
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -f production_data.sql

# Verify
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "SELECT COUNT(*) FROM profiles;"
```

### 6. Test Application
```bash
# Update .env.local to point to local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>

# Start app
npm run dev

# Test with real production data!
```

## What Gets Pulled

### Schema (via supabase db pull):
- All table definitions
- All column types and constraints
- All foreign keys
- All indexes
- All RLS policies
- All functions
- All triggers

### Data (via pg_dump):
- All rows from all tables
- Preserves relationships
- Includes auth.users (if not excluded)
- Includes all application data

## Data Size Considerations

Since you mentioned there's not much data:
- Small dataset: Pull everything
- Medium dataset: Pull everything, it's fine
- Large dataset: Pull schema + sample data only

## Security Notes

⚠️ **Important**:
- Production data may contain real user information
- Keep local database secure
- Don't commit data files to git
- Add to .gitignore:
  ```
  production_data.sql
  production_complete.sql
  production_complete.dump
  ```

## Troubleshooting

### Connection Refused
```bash
# Make sure you're using the pooler connection string
# Should include: pooler.supabase.com:6543
```

### Password Authentication Failed
```bash
# Reset password in dashboard:
# Settings → Database → Database Password → Reset
```

### Permission Denied
```bash
# Make sure you're using the postgres user
# Connection string should start with: postgres.ogucnankmxrakkxavelk
```

### Too Much Data
```bash
# If data is too large, pull specific tables only:
pg_dump "connection-string" \
  --data-only \
  --table=profiles \
  --table=organizations \
  --table=virtues \
  -f production_data_subset.sql
```

## Next Steps After Import

1. ✅ Verify data imported correctly
2. ✅ Test application with production data
3. ✅ Test migrations on production-like data
4. ✅ Identify any issues before production deployment
5. ✅ Fix issues in local environment
6. ✅ Re-test until perfect
7. ✅ Then deploy to production with confidence

## Keeping Local in Sync

To refresh local with latest production data:

```bash
# Pull latest schema
supabase db pull

# Export latest data
pg_dump "connection-string" --data-only -f production_data.sql

# Reset local and import
supabase db reset
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -f production_data.sql
```

## Benefits of This Approach

1. **Realistic Testing**: Test with actual production data
2. **Catch Issues Early**: Find problems before production
3. **Safe Experimentation**: Break things locally, not in production
4. **Migration Validation**: Test migrations on real data
5. **Application Testing**: Test features with real scenarios
6. **Cost Savings**: No need for separate staging instance

## Ready to Pull?

Once you have the database password, run:

```bash
cd new-man-app

# Link to production
supabase link --project-ref ogucnankmxrakkxavelk

# Pull schema
supabase db pull

# Export data (replace [PASSWORD])
pg_dump "postgresql://postgres.ogucnankmxrakkxavelk:[PASSWORD]@aws-1-us-west-1.pooler.supabase.com:6543/postgres" \
  --data-only \
  --schema=public \
  -f production_data.sql

# Start local and import
supabase start
supabase db reset
psql postgresql://postgres:postgres@localhost:54322/postgres -f production_data.sql

# Test!
npm run dev
```