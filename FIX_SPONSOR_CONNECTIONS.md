# Fix Sponsor Connections Issue

## Problem
The `sponsor_connections` table either doesn't exist in production or has incorrect RLS policies, causing 406 errors when viewing practitioner dashboards.

## Solution Steps

### Step 1: Verify Current State
Run this to see what's currently in the database:

```bash
# For production
psql $PRODUCTION_DATABASE_URL -f verify_sponsor_tables.sql

# For local development
psql postgresql://postgres:postgres@localhost:54322/postgres -f verify_sponsor_tables.sql
```

### Step 2: Create/Fix sponsor_connections Table
This script will:
- Create the `sponsor_connections` table if it doesn't exist
- Set up proper RLS policies
- Migrate existing active relationships from `sponsor_relationships`

```bash
# For production
psql $PRODUCTION_DATABASE_URL -f create_sponsor_connections_table.sql

# For local development
psql postgresql://postgres:postgres@localhost:54322/postgres -f create_sponsor_connections_table.sql
```

### Step 3: Verify the Fix
Run the verification script again to confirm:

```bash
psql $PRODUCTION_DATABASE_URL -f verify_sponsor_tables.sql
```

You should see:
- ✅ `sponsor_connections` table exists
- ✅ Active connections match active relationships
- ✅ RLS policies are in place

### Step 4: Test in Browser
1. Go to https://new-man-app.simpatica.ai/sponsor/dashboard
2. Click on a practitioner card
3. The practitioner detail page should load with:
   - Assessment rose chart
   - Virtue progress buttons
   - Chat interface
   - No 406 errors in console

## What These Tables Do

### sponsor_relationships
- **Purpose**: Invitation management
- **Used for**: Email invitations, invitation tokens, tracking invitation status
- **Created when**: Practitioner sends invitation
- **Updated when**: Sponsor accepts invitation

### sponsor_connections
- **Purpose**: Active coaching relationships
- **Used for**: Chat messages, shared memos, assessment viewing
- **Created when**: Invitation is accepted (now fixed in code)
- **Required for**: Sponsor dashboard functionality

## Rollback (if needed)

If something goes wrong, you can drop the table:

```sql
DROP TABLE IF EXISTS public.sponsor_connections CASCADE;
```

Then restore from backup or re-run the creation script.

## Future Invitations

The code has been updated so that future invitation acceptances will automatically create both records. This fix is only needed for existing relationships.
