# What's Next - Production Readiness

**Last Updated**: 2025-11-30  
**Current Status**: Ready for Phase 1 - Database Deployment  
**Spec**: `.kiro/specs/production-readiness`

---

## 🎯 Current Status

### ✅ COMPLETED

**Phase 0: Migration Safety & Validation**
- Local Supabase setup and testing
- Migration audit (62 SQL files)
- Safety review and rollback scripts
- Comprehensive documentation

**Phase 3: Build & Testing**
- Task 3.1: Dev server test ✅
- Task 3.2: Production build test ✅
- Task 3.3: Linting check ✅ (19 critical errors fixed)

**Code Commits:**
- 3 commits pushed to GitHub main branch
- Dev-only files removed (45 files)
- Linting errors fixed
- Ready for deployment

---

## 🚀 NEXT: Phase 1 - Database Deployment

**⚠️ CRITICAL: Database migrations must be applied BEFORE deploying code!**

### What Happens in Phase 1:

**Task 1.1: Fix SERIAL Sequences** (30 min)
- Apply `fix_sponsor_connections_sequence.sql` to production
- Verify sequence generates proper IDs

**Task 1.2: Deploy Coaching Tables** (30 min)
- Apply `PRODUCTION_MIGRATION_COACHING_TABLES_FIXED.sql` to production
- Verify tables exist and are functional

**Task 1.3: Sync Auth Users** (1 hour)
- Apply `create_auth_users_for_existing_profiles.sql` to production
- Verify no orphaned profiles

---

## 📋 Phase 1: Step-by-Step Instructions

### Step 1: Verify Supabase Backup (5 min)

```
1. Log into Supabase Dashboard
2. Navigate to: Database → Backups
3. Verify:
   - Daily backups enabled ✓
   - Last backup < 24 hours old ✓
   - Backup size reasonable (not 0 bytes) ✓
4. Note backup timestamp for rollback reference
```

### Step 2: Get Database Connection String

```bash
# From Supabase Dashboard:
# Settings → Database → Connection String → URI
# Copy the connection string (starts with postgresql://)

export DATABASE_URL="postgresql://postgres:[password]@[host]:5432/postgres"
```

### Step 3: Apply Migration 1 - Sequence Fix

```bash
cd new-man-app
psql $DATABASE_URL -f fix_sponsor_connections_sequence.sql
```

**Verify:**
```sql
-- Should return a number (not null)
SELECT nextval('sponsor_connections_id_seq');
```

### Step 4: Apply Migration 2 - Coaching Tables

```bash
psql $DATABASE_URL -f PRODUCTION_MIGRATION_COACHING_TABLES_FIXED.sql
```

**Verify:**
```sql
-- All should return 't' (true)
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_connections');
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_chat_messages');
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_visible_memos');
```

### Step 5: Apply Migration 3 - Auth Sync

```bash
psql $DATABASE_URL -f create_auth_users_for_existing_profiles.sql
```

**Verify:**
```sql
-- Should return 0 (no orphaned profiles)
SELECT COUNT(*) as orphaned_profiles 
FROM profiles p 
LEFT JOIN auth.users u ON p.id = u.id 
WHERE u.id IS NULL;
```

---

## 🚀 After Phase 1: Deploy Code

**Once database migrations are complete:**

### Option A: Vercel Deployment (Automatic)
```bash
# Vercel will auto-deploy from main branch
# Just push if not already pushed:
git push origin main
```

### Option B: Manual Deployment
```bash
# If using a different platform
npm run build
# Deploy .next folder to your hosting
```

---

## 📋 Phase 2: Test in Production

**After code is deployed:**

**Task 2.1: Test Connection Creation**
- Login as a coach/sponsor
- Navigate to coach desktop
- Verify practitioner list loads
- Verify connections can be created

**Task 2.2: Test Chat Functionality**
- Select a practitioner
- Verify chat interface loads
- Send a test message
- Verify message appears

**Task 2.3: Test Memo Display**
- Verify memos are displayed
- Check unread counts
- Test marking as read

---

## 📚 Key Documentation

**For Database Deployment:**
- `MIGRATION_EXECUTION_GUIDE.md` - Detailed deployment steps
- `MIGRATION_SAFETY_REVIEW.md` - Safety analysis
- `ROLLBACK_PROCEDURES.md` - If something goes wrong

**For Reference:**
- `MIGRATION_AUDIT.md` - What we audited
- `MIGRATION_TESTING_RESULTS.md` - Local testing results
- `.kiro/specs/production-readiness/tasks.md` - Complete task list

---

## ⚠️ If Something Goes Wrong

### Primary: Supabase Backup Restore
```
1. Supabase Dashboard → Database → Backups
2. Select backup from before migration
3. Click "Restore"
4. Wait 5-15 minutes
```

### Secondary: Rollback Scripts
```bash
psql $DATABASE_URL -f rollback_sponsor_connections_sequence.sql
psql $DATABASE_URL -f rollback_coaching_tables.sql
```

See `ROLLBACK_PROCEDURES.md` for complete instructions.

---

## ✅ Deployment Checklist

### Pre-Deployment:
- [ ] Supabase backup verified (< 24 hours old)
- [ ] Database connection string obtained
- [ ] Rollback scripts ready
- [ ] `MIGRATION_EXECUTION_GUIDE.md` reviewed

### Phase 1 - Database:
- [ ] Migration 1: Sequence fix applied
- [ ] Migration 1: Verified with SELECT nextval()
- [ ] Migration 2: Coaching tables applied
- [ ] Migration 2: Verified tables exist
- [ ] Migration 3: Auth sync applied
- [ ] Migration 3: Verified no orphaned profiles

### Code Deployment:
- [ ] Code deployed to production (Vercel/hosting)
- [ ] Application loads without errors
- [ ] No console errors in browser

### Phase 2 - Testing:
- [ ] Coach desktop loads
- [ ] Practitioner list displays
- [ ] Connections can be created
- [ ] Chat interface works
- [ ] Messages can be sent
- [ ] Memos display correctly

---

## 🎯 You Are Here

**Current Step:** Ready to start Phase 1 - Database Deployment

**Next Action:** Verify Supabase backup, then apply migrations

**Estimated Time:** 2 hours (database deployment + testing)

---

**Last Updated**: 2025-11-30  
**Status**: ✅ Ready for Database Deployment  
**Next**: Apply migrations to production database
