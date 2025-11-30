# 🚨 PRE-MIGRATION SAFETY CHECKLIST

## BEFORE YOU RUN ANY MIGRATIONS ON PRODUCTION

### ✅ **CRITICAL SAFETY STEPS**

#### 1. **BACKUP DATABASE** (MANDATORY)
- [ ] Create full database backup
- [ ] Verify backup can be restored
- [ ] Document backup location and restore procedure
- [ ] Test restore process on a separate instance

#### 2. **TEST ON STAGING/DEV FIRST** (MANDATORY)
- [ ] Run complete migration on dev database
- [ ] Test all application features work after migration
- [ ] Verify organization request form works
- [ ] Test admin dashboard shows pending requests
- [ ] Confirm approval/rejection workflow functions

#### 3. **VERIFY CURRENT PRODUCTION STATE**
- [ ] Check which tables exist in production:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  ORDER BY table_name;
  ```
- [ ] Check profiles table structure:
  ```sql
  \d profiles
  ```
- [ ] Verify no dev-only objects exist:
  ```sql
  SELECT table_name FROM information_schema.views 
  WHERE table_schema = 'public' AND table_name LIKE '%email%';
  ```

#### 4. **PREPARE ROLLBACK PLAN**
- [ ] Document current schema state
- [ ] Prepare rollback scripts for each migration step
- [ ] Test rollback procedures on dev environment
- [ ] Have emergency contact information ready

### ✅ **MIGRATION EXECUTION PLAN**

#### **Option A: Single Complete Migration (RECOMMENDED)**
Use the complete migration script that handles everything safely:
```sql
-- File: PRODUCTION_MIGRATION_COMPLETE_V3.sql
-- This is IDEMPOTENT and SAFE to run multiple times
-- Includes ALL features: organizations, invitations, coaching tables, and functions
```

#### **Option B: Step-by-Step Migration (If you prefer control)**
Follow the exact order in `MIGRATION_ORDER.md`:
1. Cleanup dev objects
2. Fix profiles schema  
3. Add work product reporting
4. Fix missing columns
5. Implement role system
6. Migrate roles
7. Add organization requests

### ✅ **POST-MIGRATION VERIFICATION**

After running migration, verify success:

```sql
-- 1. Check all tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('work_product_reports', 'organization_requests', 'profiles')
ORDER BY table_name;

-- 2. Verify profiles table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 3. Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%organization_request%';

-- 4. Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('work_product_reports', 'organization_requests');
```

### ✅ **APPLICATION TESTING CHECKLIST**

After migration, test these features:

#### **Core Application**
- [ ] User login/registration works
- [ ] Dashboard loads correctly
- [ ] Virtue assessments function
- [ ] Journal entries work
- [ ] User profiles display properly

#### **New Features**
- [ ] Organization request form at `/organizations`
- [ ] Admin dashboard shows pending requests
- [ ] Approve organization request works
- [ ] Reject organization request works
- [ ] Work product reports generate

#### **Role System**
- [ ] Admin users can access admin dashboard
- [ ] Regular users see appropriate interface
- [ ] Role-based permissions work correctly

### 🚨 **EMERGENCY PROCEDURES**

#### **If Migration Fails:**
1. **STOP IMMEDIATELY** - Don't try to fix on production
2. **RESTORE FROM BACKUP** - Use the backup you created
3. **INVESTIGATE ON DEV** - Figure out what went wrong
4. **FIX AND RE-TEST** - Solve the issue in dev environment
5. **TRY AGAIN** - Only after successful dev testing

#### **If Application Breaks After Migration:**
1. **CHECK LOGS** - Look for specific error messages
2. **RUN VERIFICATION QUERIES** - See what's missing
3. **ROLLBACK IF NECESSARY** - Use backup if critical
4. **CONTACT SUPPORT** - Get help if needed

### 📋 **MIGRATION EXECUTION LOG**

Document your migration:

```
Date: ___________
Time Started: ___________
Database Backup Location: ___________
Migration Method Used: [ ] Complete Script [ ] Step-by-Step
Issues Encountered: ___________
Time Completed: ___________
Verification Results: ___________
Application Testing Results: ___________
```

### 🎯 **SUCCESS CRITERIA**

Migration is successful when:
- ✅ All verification queries return expected results
- ✅ Application loads without errors
- ✅ Organization request form works
- ✅ Admin dashboard functions properly
- ✅ Existing users can still log in and use the app
- ✅ No data loss occurred

---

## 🔒 **REMEMBER: SAFETY FIRST**

- **NEVER** run migrations on production without testing first
- **ALWAYS** have a backup and rollback plan
- **TAKE YOUR TIME** - rushing leads to mistakes
- **ASK FOR HELP** if you're unsure about anything

The complete migration script is designed to be safe and idempotent, but preparation and testing are still critical for success!