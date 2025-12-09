# Production Migration Strategy: Organizational Model

## ⚠️ CRITICAL: Execute in This Exact Order

The organizational model migration **MUST** be executed in the correct sequence to avoid dependency errors.

## 📋 Pre-Migration Checklist

- [ ] **BACKUP PRODUCTION DATABASE** - This is mandatory
- [ ] Verify all 5 migration files are present in `/supabase/migrations/`
- [ ] Test complete migration sequence on staging environment first
- [ ] Confirm application code is deployed and ready
- [ ] Verify environment variables are set (SUPABASE_URL, SUPABASE_ANON_KEY)

## 🚀 Migration Execution Order

**Execute these files in EXACTLY this order:**

### Step 1: Core Organizational Schema
```sql
-- File: 20250104_admin_dashboard.sql
-- Purpose: Creates organizations table, memberships, roles, and core functions
-- Dependencies: None
-- Estimated time: 30 seconds
```

### Step 2: Contact Information Enhancement
```sql
-- File: 20250104_organization_contact_info.sql  
-- Purpose: Adds contact fields and update functions
-- Dependencies: Step 1 must be complete
-- Estimated time: 15 seconds
```

### Step 3: Storage System
```sql
-- File: 20250104_organization_storage.sql
-- Purpose: Creates storage bucket and policies for logos/assets
-- Dependencies: Step 1 must be complete
-- Estimated time: 10 seconds
```

### Step 4: Invitation System
```sql
-- File: 20250104_invitation_functions.sql
-- Purpose: Creates invitation tables and email functions
-- Dependencies: Steps 1-3 must be complete
-- Estimated time: 20 seconds
```

### Step 5: Schema Fixes (CRITICAL)
```sql
-- File: 20250104_fix_organization_schema.sql
-- Purpose: Fixes missing columns and functions discovered during testing
-- Dependencies: Steps 1-4 must be complete
-- Estimated time: 15 seconds
-- NOTE: This step is ESSENTIAL - without it, logo uploads will fail
```

## 🔧 How to Execute

### Option A: Supabase CLI (Recommended)
```bash
# Navigate to project directory
cd new-man-app

# Run migrations in order (CLI will respect the timestamp order)
supabase db push
```

### Option B: Manual SQL Execution
If using Supabase Dashboard SQL Editor, copy and paste each file's contents **in the exact order listed above**.

## ✅ Post-Migration Verification

Run these checks **in order** after migration:

### 1. Verify Core Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'organization_memberships', 'organization_invitations');
-- Should return 3 rows
```

### 2. Verify Functions
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('update_organization_info', 'create_organization_invitation');
-- Should return 2 rows
```

### 3. Verify Storage Bucket
```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'organization-assets';
-- Should return 1 row with public = true
```

### 4. Test Organization Creation
```sql
-- This should work without errors
INSERT INTO organizations (name, slug, max_users) 
VALUES ('Test Org', 'test-org', 10);
```

### 5. Test Logo Upload Function
```sql
-- This should work without errors
SELECT update_organization_info(
  (SELECT id FROM organizations WHERE slug = 'test-org'),
  'https://example.com/logo.png'
);
-- Should return true
```

## 🚨 Common Issues and Solutions

### Issue: "Function does not exist"
**Solution**: Step 5 (fix_organization_schema.sql) was not executed. Run it immediately.

### Issue: "Column does not exist" 
**Solution**: Steps were executed out of order. Check which columns are missing and re-run the appropriate migration.

### Issue: "Storage bucket not found"
**Solution**: Step 3 (organization_storage.sql) failed. Re-run it.

## 🔄 Rollback Plan

**Only if absolutely necessary**, rollback in **reverse order**:

```sql
-- Step 5 Rollback
DROP FUNCTION IF EXISTS update_organization_info;
-- (Storage policies will remain - they're safe to keep)

-- Step 4 Rollback  
DROP TABLE IF EXISTS organization_invitations CASCADE;

-- Step 3 Rollback
DELETE FROM storage.buckets WHERE id = 'organization-assets';

-- Step 2 Rollback
ALTER TABLE organizations 
DROP COLUMN IF EXISTS website_url,
DROP COLUMN IF EXISTS phone_number, 
DROP COLUMN IF EXISTS description;

-- Step 1 Rollback (DANGER - will lose all org data)
DROP TABLE IF EXISTS organization_memberships CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
```

## 📞 Emergency Contacts

If migration fails:
1. **DO NOT PANIC** - the rollback plan above will restore the database
2. Check the error message against "Common Issues" section
3. If unsure, restore from backup and retry on staging first

## 🎯 Success Criteria

Migration is successful when:
- [ ] All 5 migration files executed without errors
- [ ] All verification checks pass
- [ ] Admin dashboard loads without console errors
- [ ] Logo upload works in admin dashboard
- [ ] Organization creation works
- [ ] Invitation system is functional

**Total estimated migration time: 90 seconds**

## 📝 Migration File Details

### File Descriptions:

1. **20250104_admin_dashboard.sql** (REQUIRED FIRST)
   - Creates core `organizations` table
   - Creates `organization_memberships` table
   - Sets up basic RLS policies
   - Creates admin dashboard functions

2. **20250104_organization_contact_info.sql** (REQUIRED SECOND)
   - Adds contact information columns
   - Creates organization update functions
   - Enhances organization data model

3. **20250104_organization_storage.sql** (REQUIRED THIRD)
   - Creates Supabase storage bucket for logos
   - Sets up storage policies
   - Enables file upload functionality

4. **20250104_invitation_functions.sql** (REQUIRED FOURTH)
   - Creates invitation system tables
   - Sets up email invitation functions
   - Enables organization member invitations

5. **20250104_fix_organization_schema.sql** (REQUIRED LAST)
   - Fixes missing columns discovered during testing
   - Ensures all functions exist with correct signatures
   - Critical for logo upload functionality

### Dependencies:
- Steps 2-5 depend on Step 1 (core schema)
- Step 4 depends on Steps 1-3 (needs organizations and storage)
- Step 5 must be last (fixes issues from previous steps)

## 🔍 Troubleshooting Guide

### Before Migration:
- Ensure you have admin access to Supabase project
- Verify database connection is working
- Check that no other migrations are running

### During Migration:
- If any step fails, STOP immediately
- Note the exact error message
- Do not proceed to next step until current step succeeds

### After Migration:
- Run all verification checks
- Test admin dashboard functionality
- Verify logo upload works
- Check console for any errors

## 📊 Expected Results

After successful migration, you should have:
- ✅ 3 new database tables (organizations, organization_memberships, organization_invitations)
- ✅ 2+ new database functions (update_organization_info, create_organization_invitation)
- ✅ 1 new storage bucket (organization-assets)
- ✅ Working admin dashboard at `/orgadmin`
- ✅ Functional logo upload system
- ✅ Organization invitation system

**This migration enables the complete organizational model for the virtue development platform.**