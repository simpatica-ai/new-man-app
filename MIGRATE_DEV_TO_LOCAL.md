# Migrating from Cloud Dev Instance to Local Supabase

## Overview
This guide helps you transition from a paid Supabase dev instance to free local development.

## What to Migrate

### Option 1: Schema Only (Recommended for Fresh Start)
**Best for**: Starting clean with just the database structure
**Time**: 5-10 minutes
**Data**: None (fresh start)

### Option 2: Schema + Test Data
**Best for**: Keeping specific test accounts and sample data
**Time**: 15-20 minutes
**Data**: Selected test data only

### Option 3: Full Export (Not Recommended)
**Best for**: Preserving everything from dev
**Time**: 30+ minutes
**Data**: All data (may include junk from development)

## Recommended Approach: Schema Only

Since your dev instance likely has:
- Test data that may be outdated
- Development artifacts
- Potentially inconsistent data

**It's better to start fresh with just the schema.**

### Step 1: Export Schema from Dev Instance

**Via Supabase CLI** (Easiest):
```bash
# Link to your dev instance
supabase link --project-ref <your-dev-project-ref>

# Pull the schema (creates migration files)
supabase db pull

# This creates a new migration file in supabase/migrations/
# with the current schema from your dev instance
```

**Via Supabase Dashboard**:
```
1. Go to your dev project dashboard
2. Navigate to: Database → Schema
3. Click "Generate Types" or use SQL Editor
4. Copy the schema SQL
5. Save to a new migration file
```

**Via pg_dump** (Manual):
```bash
# Export schema only (no data)
pg_dump -h db.<dev-project-ref>.supabase.co \
  -U postgres.<dev-project-ref> \
  -d postgres \
  --schema-only \
  -f dev_schema_export.sql

# Clean up the file (remove Supabase-specific stuff)
# Then copy relevant parts to your migration files
```

### Step 2: Review and Consolidate Migrations

You currently have **many migration files** in `supabase/migrations/`. Before going local:

```bash
# 1. Review what's in your migrations
ls -la supabase/migrations/

# 2. Consolidate into canonical migrations
# Keep only:
# - PRODUCTION_MIGRATION_COMPLETE_V2.sql (move to migrations/)
# - PRODUCTION_MIGRATION_COACHING_TABLES.sql (move to migrations/)
# - Any new migrations from db pull

# 3. Remove deprecated migrations (see DEPRECATED_FILES_ANALYSIS.md)
```

**Recommended Structure**:
```
supabase/migrations/
├── 20250115000000_initial_schema.sql          # Base schema
├── 20250115000001_coaching_tables.sql         # Coaching features
├── 20250115000002_fix_sequences.sql           # Sequence fixes
└── 20250115000003_test_data.sql               # Test accounts
```

### Step 3: Start Local Supabase

```bash
# Start local instance
supabase start

# Apply all migrations
supabase db reset

# This will:
# - Create fresh local database
# - Apply all migrations in order
# - Give you clean starting point
```

### Step 4: Create Test Data Locally

Instead of importing old test data, create fresh test data:

```bash
# Apply test data script
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -f create_test_sponsor.sql

# This creates:
# - Test sponsor account
# - Test practitioner account
# - Sample connections
# - Sample memos and messages
```

### Step 5: Verify Local Setup

```bash
# 1. Check tables exist
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "\dt"

# 2. Check test users
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "SELECT email, raw_user_meta_data->>'full_name' as name FROM auth.users;"

# 3. Test application
npm run dev
# Login with: sponsor@test.com / testpassword123
```

### Step 6: Delete Dev Instance (Save Money!)

Once local is working:

```
1. Go to Supabase Dashboard
2. Select your dev project
3. Settings → General
4. Scroll to "Danger Zone"
5. Click "Pause project" (keeps data, stops billing)
   OR
   Click "Delete project" (permanent, stops billing immediately)
```

**💰 Savings**: $25/month immediately!

---

## Option 2: Migrate Specific Test Data

If you have specific test data you want to keep:

### Step 1: Export Specific Data

```bash
# Export specific tables with data
pg_dump -h db.<dev-project-ref>.supabase.co \
  -U postgres.<dev-project-ref> \
  -d postgres \
  --data-only \
  --table=profiles \
  --table=organizations \
  -f dev_test_data.sql

# Or export specific records
psql -h db.<dev-project-ref>.supabase.co \
  -U postgres.<dev-project-ref> \
  -d postgres \
  -c "COPY (SELECT * FROM profiles WHERE email LIKE '%@test.com%') TO STDOUT" \
  > test_profiles.csv
```

### Step 2: Import to Local

```bash
# Start local Supabase
supabase start
supabase db reset

# Import data
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -f dev_test_data.sql
```

---

## Option 3: Full Migration (Not Recommended)

Only do this if you absolutely need all dev data:

### Full Export

```bash
# Export everything
pg_dump -h db.<dev-project-ref>.supabase.co \
  -U postgres.<dev-project-ref> \
  -d postgres \
  -F c \
  -f dev_full_backup.dump

# Import to local
supabase start
pg_restore -h localhost \
  -p 54322 \
  -U postgres \
  -d postgres \
  -c \
  dev_full_backup.dump
```

**⚠️ Warning**: This may import:
- Broken data from development
- Inconsistent foreign keys
- Deprecated tables
- Test artifacts

---

## Recommended Migration Plan

### Phase 1: Setup Local (Day 1)
```bash
# 1. Pull schema from dev
supabase link --project-ref <dev-ref>
supabase db pull

# 2. Start local
supabase start

# 3. Apply migrations
supabase db reset

# 4. Create test data
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -f create_test_sponsor.sql

# 5. Test application
npm run dev
```

### Phase 2: Parallel Testing (Days 2-3)
- Keep dev instance running
- Develop on local
- Compare behavior
- Fix any issues

### Phase 3: Cutover (Day 4)
- Verify local works completely
- Update team to use local
- Pause/delete dev instance
- Save $25/month!

---

## Comparison: What You Get

### Current Dev Instance
- ❌ Costs $25/month
- ❌ May have inconsistent data
- ❌ Slower (network latency)
- ❌ Requires internet
- ✅ Accessible to team

### Local Supabase
- ✅ Free
- ✅ Clean, consistent data
- ✅ Faster (no network)
- ✅ Works offline
- ✅ Easy to reset
- ⚠️ Each developer runs own instance

---

## Team Considerations

If you have multiple developers:

### Option A: Everyone Runs Local
```bash
# Each developer:
git clone repo
supabase start
supabase db reset
npm run dev
```

**Pros**: Free, fast, independent
**Cons**: Each has own data

### Option B: Shared Dev + Local
```bash
# Keep one shared dev instance for team
# Each developer also has local for testing
```

**Pros**: Shared data when needed
**Cons**: Still costs $25/month

### Option C: Use Production for Shared Dev
```bash
# Use production database branching
supabase branches create dev-shared
# Team can share this branch
# Delete and recreate as needed
```

**Pros**: Free, uses production plan
**Cons**: Requires paid plan with branching

---

## Migration Checklist

- [ ] Export schema from dev instance (`supabase db pull`)
- [ ] Review and consolidate migration files
- [ ] Start local Supabase (`supabase start`)
- [ ] Apply migrations (`supabase db reset`)
- [ ] Create test data (`create_test_sponsor.sql`)
- [ ] Update `.env.local` to point to local
- [ ] Test application thoroughly
- [ ] Verify all features work
- [ ] Document any differences
- [ ] Train team on local setup (if applicable)
- [ ] Pause/delete dev instance
- [ ] Celebrate cost savings! 🎉

---

## Troubleshooting

### Schema Differences
```bash
# If local doesn't match dev:
supabase db pull  # Pull latest from dev
supabase db reset # Apply to local
```

### Missing Data
```bash
# If you need specific data:
# Export from dev, import to local
# See Option 2 above
```

### Migration Conflicts
```bash
# If migrations conflict:
supabase db reset --no-backup  # Fresh start
# Fix migration files
supabase db reset  # Try again
```

---

## Quick Decision Guide

**Choose Schema Only if**:
- ✅ You can recreate test data easily
- ✅ Dev data is messy/inconsistent
- ✅ You want a clean start
- ✅ You have `create_test_sponsor.sql`

**Choose Schema + Data if**:
- ✅ You have specific test accounts to preserve
- ✅ Test data is clean and valuable
- ✅ Recreating data is time-consuming

**Choose Full Export if**:
- ✅ You absolutely need all dev data
- ✅ You understand the risks
- ✅ You're willing to clean up issues

**Recommendation**: **Schema Only** - Clean, fast, reliable

---

## Cost Impact Timeline

```
Day 0 (Today):        $25/month (dev) + $25/month (prod) = $50/month
Day 1 (Setup local):  $25/month (dev) + $25/month (prod) = $50/month
Day 4 (Delete dev):   $0/month (local) + $25/month (prod) = $25/month

Annual Savings: $300/year
```

---

## Next Steps

1. **Review your current dev instance**
   - What data do you actually need?
   - Is it clean and consistent?

2. **Choose migration approach**
   - Recommended: Schema Only
   - Alternative: Schema + Specific Data

3. **Follow migration plan**
   - Phase 1: Setup (1 day)
   - Phase 2: Test (2-3 days)
   - Phase 3: Cutover (1 day)

4. **Delete dev instance**
   - Save $25/month immediately
   - Keep production instance only

Need help with any step? Just ask!