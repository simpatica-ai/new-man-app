# Rollback Procedures

**Last Updated**: 2025-01-26  
**Purpose**: Step-by-step procedures for rolling back production migrations  
**Status**: ✅ TESTED on local environment

---

## ⚠️ CRITICAL: Read Before Rolling Back

**Rollback should be a LAST RESORT**. Consider these alternatives first:

1. **Fix Forward**: Can the issue be fixed with a new migration?
2. **Partial Rollback**: Can you rollback just one component?
3. **Data Preservation**: Can you export data before rollback?

**Only rollback if**:
- Migration caused critical production failure
- Application is completely broken
- Data corruption occurred
- No forward fix is possible

---

## Prerequisites

Before performing any rollback:

- [ ] ✅ Database backup exists and is recent
- [ ] ✅ Backup has been tested and can be restored
- [ ] ✅ Team is notified of rollback plan
- [ ] ✅ Maintenance window is scheduled
- [ ] ✅ Rollback scripts have been reviewed
- [ ] ✅ You understand what data will be lost

---

## Rollback Decision Tree

```
Is the application completely broken?
├─ NO → Try fix forward first
└─ YES → Is data corrupted?
    ├─ NO → Rollback specific migration
    └─ YES → Full database restore from backup
```

---

## Rollback Options

### Option 1: Rollback Specific Migration (Recommended)

Use this when:
- One specific migration caused the issue
- Data is intact
- Other migrations are working

**Available Rollback Scripts**:
1. `rollback_sponsor_connections_sequence.sql` - Rollback sequence fix
2. `rollback_coaching_tables.sql` - Rollback coaching tables (⚠️ DESTRUCTIVE)

### Option 2: Full Database Restore (Nuclear Option)

Use this when:
- Multiple migrations failed
- Data is corrupted
- Rollback scripts don't work

**Process**: Restore from Supabase backup (see below)

---

## Rollback Script 1: Sequence Fix

### When to Use:
- Sequence fix caused issues
- IDs are generating incorrectly
- Null constraint violations on sponsor_connections.id

### Impact:
- ✅ **NO DATA LOSS**
- ✅ Safe to run multiple times
- ✅ Only resets sequence to safe value

### Procedure:

```bash
# 1. Verify the issue
psql $DATABASE_URL -c "SELECT last_value, is_called FROM sponsor_connections_id_seq;"

# 2. Run rollback
psql $DATABASE_URL -f rollback_sponsor_connections_sequence.sql

# 3. Verify rollback
psql $DATABASE_URL -c "SELECT nextval('sponsor_connections_id_seq');"
# Should return a number (not null)

# 4. Test insert
psql $DATABASE_URL -c "
  INSERT INTO sponsor_connections (id, practitioner_user_id, sponsor_user_id, status)
  VALUES (DEFAULT, gen_random_uuid(), gen_random_uuid(), 'active')
  RETURNING id;
"
# Should succeed and return an ID

# 5. Clean up test insert
psql $DATABASE_URL -c "DELETE FROM sponsor_connections WHERE id = (SELECT MAX(id) FROM sponsor_connections);"
```

### Verification:
```sql
-- Sequence should be working
SELECT nextval('sponsor_connections_id_seq');
-- Should return a number

-- Max ID should be less than sequence value
SELECT 
  (SELECT MAX(id) FROM sponsor_connections) as max_id,
  (SELECT last_value FROM sponsor_connections_id_seq) as sequence_value;
-- sequence_value should be > max_id
```

### Recovery:
If you need to re-apply the fix after rollback:
```bash
psql $DATABASE_URL -f fix_sponsor_connections_sequence.sql
```

---

## Rollback Script 2: Coaching Tables

### ⚠️ CRITICAL WARNING

**THIS ROLLBACK IS DESTRUCTIVE**

- ❌ **DELETES ALL COACHING DATA**
- ❌ **CANNOT BE UNDONE** (unless you have backup)
- ❌ Removes: sponsor_connections, sponsor_chat_messages, sponsor_visible_memos
- ❌ Removes: All chat history, connections, shared memos

### When to Use:
- Coaching tables migration caused critical failure
- Tables are corrupted beyond repair
- Application cannot function with current tables
- You have a backup of the data

### Impact:
- ❌ **ALL coaching data will be lost**
- ❌ All coach-practitioner connections deleted
- ❌ All chat messages deleted
- ❌ All shared memos deleted
- ✅ Other data (profiles, virtues, journal) unaffected

### Before You Proceed:

**STOP and answer these questions:**

1. Do you have a recent database backup? **YES / NO**
2. Have you tested restoring from that backup? **YES / NO**
3. Have you exported coaching data separately? **YES / NO**
4. Is there NO other way to fix the issue? **YES / NO**
5. Has the team been notified? **YES / NO**

**If any answer is NO, DO NOT PROCEED**

### Procedure:

#### Step 1: Export Data (if possible)

```bash
# Export coaching data before rollback
psql $DATABASE_URL -c "\copy (SELECT * FROM sponsor_connections) TO 'backup_sponsor_connections.csv' CSV HEADER"
psql $DATABASE_URL -c "\copy (SELECT * FROM sponsor_chat_messages) TO 'backup_sponsor_chat_messages.csv' CSV HEADER"
psql $DATABASE_URL -c "\copy (SELECT * FROM sponsor_visible_memos) TO 'backup_sponsor_visible_memos.csv' CSV HEADER"
```

#### Step 2: Review What Will Be Deleted

```bash
# Run rollback script WITHOUT uncommenting DROP statements
psql $DATABASE_URL -f rollback_coaching_tables.sql

# This will show:
# - Tables that will be dropped
# - Functions that will be dropped
# - Row counts (data that will be lost)
```

#### Step 3: Perform Rollback

```bash
# 1. Edit rollback_coaching_tables.sql
# 2. Uncomment the DROP statements (remove /* and */)
# 3. Run the modified script
psql $DATABASE_URL -f rollback_coaching_tables.sql

# 4. Verify tables are gone
psql $DATABASE_URL -c "
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_name IN ('sponsor_connections', 'sponsor_chat_messages', 'sponsor_visible_memos');
"
# Should return 0 rows
```

#### Step 4: Verify Application

```bash
# 1. Restart application
npm run dev

# 2. Test that app works without coaching tables
# - Login should work
# - Virtues should work
# - Journal should work
# - Coach desktop may show errors (expected)

# 3. Check logs for errors
```

### Recovery:

If you need to re-apply coaching tables after rollback:

```bash
# 1. Re-apply migration
psql $DATABASE_URL -f PRODUCTION_MIGRATION_COACHING_TABLES_FIXED.sql

# 2. Restore data from backup (if you exported it)
psql $DATABASE_URL -c "\copy sponsor_connections FROM 'backup_sponsor_connections.csv' CSV HEADER"
psql $DATABASE_URL -c "\copy sponsor_chat_messages FROM 'backup_sponsor_chat_messages.csv' CSV HEADER"
psql $DATABASE_URL -c "\copy sponsor_visible_memos FROM 'backup_sponsor_visible_memos.csv' CSV HEADER"

# 3. Fix sequences
psql $DATABASE_URL -c "
  SELECT setval('sponsor_connections_id_seq', (SELECT MAX(id) FROM sponsor_connections) + 1);
  SELECT setval('sponsor_chat_messages_id_seq', (SELECT MAX(id) FROM sponsor_chat_messages) + 1);
  SELECT setval('sponsor_visible_memos_id_seq', (SELECT MAX(id) FROM sponsor_visible_memos) + 1);
"
```

---

## Full Database Restore (Nuclear Option)

### When to Use:
- Multiple migrations failed
- Data is corrupted
- Rollback scripts don't work
- Application is completely broken

### Prerequisites:
- ✅ Recent backup exists in Supabase
- ✅ Backup timestamp is known
- ✅ Team is notified
- ✅ Maintenance window is scheduled

### Procedure (Supabase Dashboard):

#### Step 1: Verify Backup Exists

```
1. Log into Supabase Dashboard
2. Navigate to: Project → Database → Backups
3. Verify backup exists with timestamp BEFORE migration
4. Note the backup timestamp
```

#### Step 2: Prepare for Restore

```
1. Notify all users of downtime
2. Stop application (prevent new writes)
3. Export any critical data created AFTER backup
4. Document current state
```

#### Step 3: Restore from Backup

```
1. In Supabase Dashboard: Database → Backups
2. Find backup from BEFORE migration
3. Click "Restore" button
4. Confirm restoration
5. Wait for restore to complete (may take several minutes)
```

#### Step 4: Verify Restore

```sql
-- Check that tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check data counts
SELECT 
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM virtues) as virtues,
  (SELECT COUNT(*) FROM journal_entries) as journal_entries;

-- Verify no orphaned profiles
SELECT COUNT(*) FROM profiles p LEFT JOIN auth.users u ON p.id = u.id WHERE u.id IS NULL;
-- Should return 0
```

#### Step 5: Restart Application

```bash
# 1. Ensure .env points to correct database
cat .env.production | grep DATABASE_URL

# 2. Restart application
# (deployment-specific commands)

# 3. Test critical functionality
# - Login
# - View virtues
# - Create journal entry
# - Check for errors
```

### Recovery Time:
- Backup restore: 5-15 minutes
- Application restart: 2-5 minutes
- Verification: 5-10 minutes
- **Total**: 15-30 minutes

---

## Rollback Testing (Local Environment)

### Test Sequence Rollback:

```bash
cd new-man-app

# 1. Apply sequence fix
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -f fix_sponsor_connections_sequence.sql

# 2. Verify it works
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT nextval('sponsor_connections_id_seq');"

# 3. Rollback
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -f rollback_sponsor_connections_sequence.sql

# 4. Verify rollback worked
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT nextval('sponsor_connections_id_seq');"
```

**Result**: ✅ Tested successfully on 2025-01-26

### Test Coaching Tables Rollback:

⚠️ **DO NOT TEST IN PRODUCTION**

```bash
# Only test in local environment
cd new-man-app

# 1. Create snapshot first
pg_dump postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -f before_rollback_test.sql

# 2. Review what will be deleted
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -f rollback_coaching_tables.sql

# 3. Edit script to uncomment DROP statements
# 4. Run rollback
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -f rollback_coaching_tables.sql

# 5. Verify tables are gone
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -c "SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'sponsor_%';"

# 6. Restore from snapshot
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres \
  -f before_rollback_test.sql
```

---

## Rollback Checklist

### Before Rollback:
- [ ] Database backup verified
- [ ] Backup tested and can be restored
- [ ] Team notified
- [ ] Maintenance window scheduled
- [ ] Rollback scripts reviewed
- [ ] Data export completed (if applicable)
- [ ] Alternative fixes considered
- [ ] Rollback procedure documented
- [ ] Recovery plan documented

### During Rollback:
- [ ] Application stopped (prevent new writes)
- [ ] Rollback script executed
- [ ] Verification queries run
- [ ] Results documented
- [ ] Errors logged

### After Rollback:
- [ ] Application restarted
- [ ] Critical functionality tested
- [ ] Users notified
- [ ] Incident documented
- [ ] Root cause analyzed
- [ ] Prevention plan created

---

## Common Issues and Solutions

### Issue: Rollback script fails with "relation does not exist"

**Cause**: Table was never created or already rolled back

**Solution**: 
```sql
-- Check if table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'sponsor_connections';
-- If empty, table doesn't exist - rollback not needed
```

### Issue: Foreign key constraint prevents rollback

**Cause**: Other tables reference the table being dropped

**Solution**:
```sql
-- Use CASCADE (but be careful!)
DROP TABLE sponsor_connections CASCADE;
-- This will drop dependent objects too
```

### Issue: Sequence rollback doesn't fix ID generation

**Cause**: Sequence value is still wrong

**Solution**:
```sql
-- Manually set sequence to correct value
SELECT setval('sponsor_connections_id_seq', 
  (SELECT COALESCE(MAX(id), 0) + 1 FROM sponsor_connections));
```

### Issue: Application still broken after rollback

**Cause**: Code expects tables that no longer exist

**Solution**:
1. Deploy previous version of application code
2. Or add error handling for missing tables
3. Or restore database from backup

---

## Emergency Contacts

**If rollback fails or causes additional issues:**

1. **Stop immediately** - Don't make it worse
2. **Restore from backup** - Use Supabase dashboard
3. **Contact team** - Get help
4. **Document everything** - For post-mortem

---

## Post-Rollback Actions

### Immediate:
1. Verify application is working
2. Notify users service is restored
3. Monitor for errors
4. Document what happened

### Within 24 hours:
1. Analyze root cause
2. Create fix-forward plan
3. Test fix in development
4. Schedule re-deployment

### Within 1 week:
1. Conduct post-mortem
2. Update procedures
3. Improve testing
4. Prevent recurrence

---

## Rollback Script Inventory

### Available Scripts:

| Script | Purpose | Data Loss | Safety | Tested |
|--------|---------|-----------|--------|--------|
| `rollback_sponsor_connections_sequence.sql` | Reset sequence | None | ✅ Safe | ✅ Yes |
| `rollback_coaching_tables.sql` | Remove coaching tables | ⚠️ All coaching data | ❌ Destructive | ⚠️ Local only |

### Missing Scripts:

- `rollback_auth_users.sql` - Not needed (uses ON CONFLICT DO NOTHING)
- `rollback_test_sponsor.sql` - Not needed (test data only)

---

## Testing Status

- ✅ Sequence rollback tested successfully (2025-01-26)
- ⚠️ Coaching tables rollback tested in local only
- ❌ Full database restore not tested (requires production backup)

---

## Maintenance

**When to update this document:**
- New migrations added
- New rollback scripts created
- Rollback procedures change
- Issues discovered during rollback
- Team feedback received

**Last Review**: 2025-01-26  
**Next Review**: Before next production deployment  
**Owner**: Development Team

---

## Related Documentation

- `MIGRATION_EXECUTION_GUIDE.md` - How to apply migrations
- `MIGRATION_SAFETY_REVIEW.md` - Migration safety analysis
- `MIGRATION_TESTING_RESULTS.md` - Testing results
- `MIGRATIONS_README.md` - Documentation overview

---

**Remember**: Rollback is a last resort. Always try to fix forward first!
