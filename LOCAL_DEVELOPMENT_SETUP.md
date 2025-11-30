# Local Supabase Development Setup

## Overview
Run Supabase locally to avoid paying for multiple cloud instances. This guide shows how to use your local machine for development and only use the paid Supabase instance for production.

## Benefits
- ✅ **Cost Savings**: No additional Supabase instances needed
- ✅ **Faster Development**: No network latency
- ✅ **Offline Development**: Work without internet
- ✅ **Safe Testing**: Test migrations without affecting production
- ✅ **Free Resets**: Reset database anytime without cost

## Prerequisites

### 1. Install Docker Desktop
Supabase local development requires Docker.

**macOS**:
```bash
# Install via Homebrew
brew install --cask docker

# Or download from: https://www.docker.com/products/docker-desktop
```

**Verify Docker is running**:
```bash
docker --version
# Should show: Docker version 24.x.x or higher
```

### 2. Install Supabase CLI
```bash
# macOS
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

## Setup Local Supabase

### Step 1: Initialize (Already Done)
Your project already has `supabase/` directory, so this is complete! ✅

If starting fresh, you would run:
```bash
# NOT NEEDED - you already have this
# supabase init
```

### Step 2: Start Local Supabase
```bash
cd new-man-app

# Start all Supabase services locally
supabase start

# This will:
# - Start PostgreSQL database
# - Start Auth service (GoTrue)
# - Start Storage service
# - Start Realtime service
# - Start REST API (PostgREST)
# - Start Studio (web UI)
```

**First time startup takes 2-5 minutes** (downloads Docker images)

**Output will show**:
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Save these values!** You'll need them for `.env.local`

### Step 3: Configure Environment Variables

Create or update `.env.local`:

```bash
# Local Development (default)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-start>

# Production (comment out for local dev)
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-production-anon-key>
```

**Pro Tip**: Create separate env files:
```bash
# .env.local (for local development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>

# .env.production (for production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
```

### Step 4: Apply Migrations to Local Database

```bash
# Apply all migrations to local database
supabase db reset

# This will:
# - Drop and recreate local database
# - Apply all migrations in supabase/migrations/
# - Seed data if you have seed.sql
```

**Or apply specific migration**:
```bash
# Apply a specific migration
supabase db push

# Or manually via psql
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -f PRODUCTION_MIGRATION_COMPLETE_V2.sql
```

### Step 5: Access Local Supabase Studio

Open in browser: **http://localhost:54323**

This is your local version of the Supabase dashboard where you can:
- Browse tables and data
- Run SQL queries
- Manage auth users
- View logs
- Test RLS policies

## Daily Development Workflow

### Starting Your Day
```bash
cd new-man-app

# Start Supabase (if not already running)
supabase start

# Start Next.js dev server
npm run dev
```

### Stopping Services
```bash
# Stop Supabase (keeps data)
supabase stop

# Stop and remove all data (fresh start)
supabase stop --no-backup
```

### Checking Status
```bash
# See what's running
supabase status

# View logs
supabase logs
```

## Testing Migrations Locally

### Before Applying to Production

```bash
# 1. Start with fresh local database
supabase db reset

# 2. Apply your new migration
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -f fix_sponsor_connections_sequence.sql

# 3. Verify it worked
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "SELECT nextval('sponsor_connections_id_seq');"

# 4. Test application
npm run dev
# Navigate to coach desktop, test functionality

# 5. If successful, apply to production
# If failed, fix and repeat
```

### Creating New Migrations

```bash
# Generate a new migration file
supabase migration new add_new_feature

# Edit the generated file in supabase/migrations/
# Then apply it locally
supabase db reset
```

## Switching Between Local and Production

### Option 1: Environment Variables (Recommended)

```bash
# Use local
cp .env.local .env

# Use production
cp .env.production .env
```

### Option 2: Supabase Link

```bash
# Link to production
supabase link --project-ref <your-project-ref>

# Pull production schema
supabase db pull

# Push local changes to production
supabase db push
```

## Common Commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Reset database (fresh start)
supabase db reset

# View status
supabase status

# View logs
supabase logs

# Access database directly
psql postgresql://postgres:postgres@localhost:54322/postgres

# Generate TypeScript types from database
supabase gen types typescript --local > src/types/supabase.ts
```

## Troubleshooting

### Docker Not Running
```bash
# Error: Cannot connect to Docker daemon
# Solution: Start Docker Desktop application
open -a Docker
```

### Port Already in Use
```bash
# Error: Port 54321 already in use
# Solution: Stop other Supabase instances or change ports in config.toml
supabase stop
```

### Database Reset Issues
```bash
# If reset fails, force stop and restart
supabase stop --no-backup
supabase start
supabase db reset
```

### Migrations Not Applying
```bash
# Check migration files
ls -la supabase/migrations/

# Apply manually
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -f supabase/migrations/<migration-file>.sql
```

## Cost Comparison

### Current Setup (Multiple Cloud Instances)
- Production: $25/month (paid plan)
- Staging: $25/month (if separate instance)
- Development: $25/month (if separate instance)
- **Total**: $75/month

### With Local Development
- Production: $25/month (paid plan)
- Staging: Use database branching (included) or local
- Development: **FREE** (local)
- **Total**: $25/month

**Savings**: $50/month or $600/year! 💰

## Best Practices

### 1. Always Test Locally First
```bash
# Never apply migrations directly to production
# Always test locally first:
supabase db reset
psql postgresql://postgres:postgres@localhost:54322/postgres -f new_migration.sql
npm run dev
# Test thoroughly
# Then apply to production
```

### 2. Keep Local and Production in Sync
```bash
# Periodically pull production schema
supabase db pull

# This updates your local migrations to match production
```

### 3. Use Database Branching for Staging
```bash
# Instead of separate staging instance, use branches
supabase branches create staging
supabase branches switch staging
# Test migrations on branch
# Delete branch when done
supabase branches delete staging
```

### 4. Backup Before Major Changes
```bash
# Even locally, backup before big changes
pg_dump postgresql://postgres:postgres@localhost:54322/postgres \
  -F c -f local_backup.dump
```

## Integration with Production Readiness Spec

### Task 0.2: Validate Migration Scripts in Staging

**Use Local Supabase Instead of Separate Staging Instance**:

```bash
# 1. Start fresh local instance
supabase stop --no-backup
supabase start

# 2. Pull production data (optional, for realistic testing)
# Note: This requires linking to production
supabase link --project-ref <your-project-ref>
supabase db pull

# 3. Apply migrations locally
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -f fix_sponsor_connections_sequence.sql

psql postgresql://postgres:postgres@localhost:54322/postgres \
  -f PRODUCTION_MIGRATION_COACHING_TABLES.sql

# 4. Test application
npm run dev
# Test all functionality

# 5. If successful, apply to production
# If failed, fix and repeat (no cost!)
```

## Quick Start Checklist

- [ ] Install Docker Desktop
- [ ] Install Supabase CLI
- [ ] Run `supabase start` in new-man-app directory
- [ ] Copy connection details to `.env.local`
- [ ] Run `supabase db reset` to apply migrations
- [ ] Open http://localhost:54323 (Studio)
- [ ] Run `npm run dev`
- [ ] Test application locally
- [ ] Celebrate cost savings! 🎉

## Resources

- [Supabase Local Development Docs](https://supabase.com/docs/guides/cli/local-development)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

## Support

If you encounter issues:
1. Check Docker is running: `docker ps`
2. Check Supabase status: `supabase status`
3. View logs: `supabase logs`
4. Restart services: `supabase stop && supabase start`
5. Fresh start: `supabase stop --no-backup && supabase start`