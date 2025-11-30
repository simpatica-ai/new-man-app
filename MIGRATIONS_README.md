# Database Migrations Documentation

**Purpose**: This document explains the migration documentation structure and which files to use.

---

## 📚 Documentation Files

### 1. **MIGRATION_EXECUTION_GUIDE.md** ⭐ START HERE
**Purpose**: Step-by-step guide for applying migrations  
**Use When**: You need to deploy to production or dev  
**Status**: ✅ AUTHORITATIVE - Single source of truth

**Contains**:
- Quick decision tree (main vs dev branch)
- Exact execution steps with commands
- Verification queries
- Troubleshooting guide
- File location reference

👉 **This is the file you should follow**

---

### 2. **MIGRATION_AUDIT.md** 📊 ANALYSIS
**Purpose**: Detailed analysis of all SQL files in the project  
**Use When**: You want to understand how we got into this mess  
**Status**: ✅ COMPLETE - Historical record

**Contains**:
- Inventory of all 62 SQL files
- Categorization (production/dev/deprecated)
- Schema gap analysis
- Risk assessment
- Recommendations

👉 **Read this to understand the context**

---

### 3. **MIGRATION_ORDER.md** ⚠️ DEPRECATED
**Purpose**: Old migration order (from previous Kiro session)  
**Use When**: DON'T USE THIS  
**Status**: ❌ OUTDATED - References wrong file locations

**Why Deprecated**:
- References files in backup folder
- References files that don't exist
- Created during chat session without proper validation
- Superseded by MIGRATION_EXECUTION_GUIDE.md

👉 **Ignore this file - kept for reference only**

---

### 4. **CRITICAL_MIGRATION_ISSUES.md** 🚨 ISSUES
**Purpose**: Documents known migration issues  
**Use When**: Troubleshooting specific problems  
**Status**: ⚠️ May be outdated

👉 **Check if issues are still relevant**

---

### 5. **ROLLBACK_PROCEDURES.md** 🔄 ROLLBACK
**Purpose**: How to rollback migrations if something goes wrong  
**Use When**: Migration failed and you need to revert  
**Status**: ✅ USEFUL

👉 **Keep handy during production deployments**

---

### 6. **MIGRATION_TESTING_RESULTS.md** 🧪 TEST RESULTS
**Purpose**: Documents actual testing results on local production copy  
**Use When**: Want to see what issues were found and fixed  
**Status**: ✅ CURRENT (2025-01-26)

**Contains**:
- Test environment details
- Each migration's results
- Errors encountered and solutions
- Schema verification
- Known issues
- Recommendations

👉 **Read this to understand what was tested and what works**

---

### 7. **MIGRATION_SAFETY_REVIEW.md** 🔒 SAFETY REVIEW
**Purpose**: Comprehensive safety analysis of all production migrations  
**Use When**: Need to verify migrations are safe for production  
**Status**: ✅ COMPLETE (2025-01-26)

**Contains**:
- Safety checklist results
- Individual migration analysis
- Destructive operation identification
- Idempotency analysis
- Risk assessment
- Production recommendations

👉 **Read this before deploying to production**

---

## ⭐ START HERE

### **WHATS_NEXT.md** 🎯 YOUR ROADMAP
**Purpose**: Shows exactly where you are and what to do next  
**Use When**: You want to know the current status and next steps  
**Status**: ✅ CURRENT (2025-01-26)

**Contains**:
- Current completion status
- Three deployment options
- Recommended path forward
- Decision checklist
- Known issues
- Progress summary

👉 **READ THIS FIRST if you're coming back to this project**

---

## 🎯 Quick Start

### I need to deploy to production (main branch):
1. Read: `MIGRATION_EXECUTION_GUIDE.md` → "Main Branch Deployment"
2. Follow the 4-step process
3. Verify with provided queries

### I need to deploy dev branch features:
1. Read: `MIGRATION_EXECUTION_GUIDE.md` → "Dev Branch Deployment"
2. **First**: Complete migration consolidation
3. Follow the 10-step process
4. Verify with provided queries

### I want to test locally:
1. Read: `MIGRATION_EXECUTION_GUIDE.md` → "Local Testing Workflow"
2. Use local Supabase
3. Test before production

### Something went wrong:
1. Check: `MIGRATION_EXECUTION_GUIDE.md` → "Troubleshooting"
2. If not there, check: `ROLLBACK_PROCEDURES.md`
3. If still stuck, check: `CRITICAL_MIGRATION_ISSUES.md`

### I want to understand the mess:
1. Read: `MIGRATION_AUDIT.md`
2. See how 62 SQL files got scattered everywhere
3. Understand why MIGRATION_ORDER.md is wrong

---

## 📁 File Locations

### SQL Migration Files:

```
new-man-app/
├── *.sql                              # Root-level migrations (manual apply)
│   ├── fix_sponsor_connections_sequence.sql
│   ├── PRODUCTION_MIGRATION_COACHING_TABLES.sql
│   ├── PRODUCTION_MIGRATION_organization_requests.sql
│   ├── create_auth_users_for_existing_profiles.sql
│   ├── create_test_sponsor.sql
│   └── rollback_*.sql
│
├── supabase/
│   ├── migrations/                    # Auto-apply migrations ✅
│   │   └── YYYYMMDDHHMMSS_*.sql
│   │
│   ├── migrations_backup/             # Old/superseded migrations ⚠️
│   │   └── (DO NOT USE - move needed files to migrations/)
│   │
│   └── migrations_temp_disabled/      # Disabled for data loading ⚠️
│       └── (DO NOT USE)
```

### Documentation Files:

```
new-man-app/
├── MIGRATION_EXECUTION_GUIDE.md       # ⭐ USE THIS
├── MIGRATION_AUDIT.md                 # 📊 Context
├── MIGRATION_ORDER.md                 # ❌ Deprecated
├── MIGRATIONS_README.md               # 📚 This file
├── CRITICAL_MIGRATION_ISSUES.md       # 🚨 Issues
├── ROLLBACK_PROCEDURES.md             # 🔄 Rollback
└── ...
```

---

## 🔄 Keeping Documentation Updated

### When you add a new migration:

1. **Create the migration file**:
   - Timestamped in `supabase/migrations/` for auto-apply
   - OR named in root for manual-apply

2. **Update MIGRATION_EXECUTION_GUIDE.md**:
   - Add to appropriate section (main vs dev)
   - Include verification query
   - Update migration count

3. **Test locally first**:
   - Follow local testing workflow
   - Verify it works

4. **Commit with clear message**:
   ```bash
   git add .
   git commit -m "feat: add [feature] migration
   
   - Created [filename].sql
   - Updated MIGRATION_EXECUTION_GUIDE.md
   - Tested locally"
   ```

### When you discover an issue:

1. **Document in MIGRATION_EXECUTION_GUIDE.md**:
   - Add to "Troubleshooting" section
   - Include error message and fix

2. **Update CRITICAL_MIGRATION_ISSUES.md** if severe

3. **Commit the documentation update**:
   ```bash
   git commit -m "docs: document [issue] and fix"
   ```

---

## ❌ What NOT To Do

1. **Don't create new migration order documents**
   - Update MIGRATION_EXECUTION_GUIDE.md instead

2. **Don't rely on chat history**
   - Document everything in markdown files

3. **Don't leave files in migrations_backup**
   - Move to active migrations or delete

4. **Don't create duplicate migration files**
   - Check existing files first
   - Consolidate if needed

5. **Don't skip documentation updates**
   - Future you will thank present you

---

## 🆘 Help

**Still confused?**

1. Start with `MIGRATION_EXECUTION_GUIDE.md`
2. Read the Quick Decision Tree
3. Follow the step-by-step instructions
4. Use the verification queries
5. Check troubleshooting if errors occur

**Found a bug in the documentation?**

1. Fix it
2. Update the "Last Updated" date
3. Commit with clear message
4. Document what you changed

---

## 📝 Lessons Learned

### Why we ended up with 62 scattered SQL files:

1. **Chat sessions don't persist knowledge**
   - Kiro created files during sessions
   - No single source of truth
   - Each session added more files

2. **No clear file organization**
   - Files in root, migrations, backup, temp_disabled
   - Multiple versions of same migration
   - Unclear which to use

3. **Documentation referenced wrong locations**
   - MIGRATION_ORDER.md pointed to backup folder
   - Files moved but docs not updated

4. **No consolidation process**
   - Old files never deleted
   - Superseded versions kept around
   - Confusion multiplied

### How we're fixing it:

1. **Single authoritative guide** (MIGRATION_EXECUTION_GUIDE.md)
2. **Clear file organization** (active vs backup vs deprecated)
3. **Consolidation plan** (move or delete files)
4. **Maintenance process** (how to keep docs updated)
5. **This README** (explains the structure)

---

**Remember**: Documentation is code. Keep it updated, accurate, and useful.

---

**Last Updated**: 2025-01-26  
**Maintainer**: Development Team  
**Status**: ✅ ACTIVE
