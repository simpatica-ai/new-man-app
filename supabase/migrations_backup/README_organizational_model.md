# Organizational Model Migration

This directory contains the migration scripts for implementing the organizational model in the virtue development application.

## Overview

The organizational model adds multi-tenant functionality with role-based access control, supporting organizations with up to 40 active users. The migration includes:

- Organizations table with subscription management
- Extended user profiles with roles and activity tracking
- Practitioner-supervisor assignment system
- Organization invitation system
- User archival system (soft delete)
- Enhanced security policies and indexes

## Migration Files

### 1. `20250102_organizational_model.sql`
**Main migration script** that implements the complete organizational model.

**What it does:**
- Creates `organizations` table with 40-user limit and Stripe preparation
- Extends `profiles` table with organizational fields and role arrays
- Creates `practitioner_assignments` table for coach/therapist relationships
- Creates `organization_invitations` table for secure user invitations
- Adds comprehensive indexes for performance
- Implements functions for user archival and organization management
- Sets up Row Level Security (RLS) policies
- Migrates existing sponsor relationships to coach assignments
- Creates default organization for existing users

### 2. `20250102_organizational_model_rollback.sql`
**Rollback script** to reverse the migration if needed.

**What it does:**
- Removes all organizational tables and columns
- Restores original RLS policies
- Drops all organizational functions and triggers
- Preserves existing user data and sponsor relationships

### 3. `validate_organizational_model.sql`
**Validation script** to verify migration success.

**What it checks:**
- All tables, columns, and indexes were created
- Functions and triggers are working
- RLS policies are properly configured
- Data migration completed successfully
- No orphaned or inconsistent data

## Migration Process

### Prerequisites

1. **Backup your database** before running any migration
2. Ensure you have admin access to the Supabase project
3. Test the migration on a development environment first
4. Review the migration script to understand the changes

### Step 1: Apply the Migration

```sql
-- Connect to your Supabase database and run:
\i supabase/migrations/20250102_organizational_model.sql
```

Or using the Supabase CLI:
```bash
supabase db push
```

### Step 2: Validate the Migration

```sql
-- Run the validation script:
\i supabase/migrations/validate_organizational_model.sql
```

Review the output to ensure all checks pass. Address any failures before proceeding.

### Step 3: Test Application Functionality

1. **Existing Users**: Verify existing users can still log in and access their data
2. **Sponsor Relationships**: Confirm existing sponsor-practitioner relationships work
3. **Journal Entries**: Test that journal entries are properly accessible
4. **New Features**: Test organization creation, user invitations, and role assignments

## Key Changes

### Database Schema

#### New Tables
- `organizations`: Multi-tenant organization management
- `practitioner_assignments`: Coach/therapist to practitioner relationships
- `organization_invitations`: Secure invitation system

#### Extended Tables
- `profiles`: Added organization_id, roles[], activity tracking, archival fields

#### New Indexes
- Organization-scoped query optimization
- Role-based access performance
- Activity tracking queries

### Security Model

#### Row Level Security (RLS)
- Organization-scoped data access
- Role-based permissions (admin, coach, therapist, practitioner)
- Supervisor access to assigned practitioners
- Enhanced journal entry privacy

#### Functions
- `update_organization_active_user_count()`: Maintains accurate user counts
- `archive_user()`: Soft delete with organization count updates
- `reactivate_user()`: Restore archived users with limit validation
- `validate_organization_user_limit()`: Enforce 40-user limit

### Data Migration

#### Automatic Migrations
1. **Default Organization**: Creates "Individual Users" organization for existing users
2. **Sponsor to Coach**: Migrates sponsor relationships to coach assignments
3. **Role Assignment**: Updates sponsor users to include 'coach' role
4. **User Counts**: Calculates and sets accurate active user counts

## Rollback Process

If you need to rollback the migration:

### Step 1: Run Rollback Script
```sql
\i supabase/migrations/20250102_organizational_model_rollback.sql
```

### Step 2: Verify Rollback
- Check that organizational tables are removed
- Verify profiles table is back to original structure
- Test that existing functionality still works

### Step 3: Application Updates
- Update application code to remove organizational features
- Revert any UI changes that depend on organizational model
- Test all existing functionality

## Post-Migration Tasks

### 1. Application Code Updates
- Update API endpoints to handle organization context
- Implement role-based UI components
- Add organization management interfaces
- Update authentication flows

### 2. Testing
- Test all user roles and permissions
- Verify organization creation and management
- Test user invitation and acceptance flows
- Validate reporting and analytics features

### 3. Monitoring
- Monitor database performance with new indexes
- Track organization user counts and limits
- Monitor invitation system usage
- Watch for any security policy issues

## Troubleshooting

### Common Issues

#### Migration Fails
1. Check for existing data conflicts
2. Verify database permissions
3. Review error messages for specific issues
4. Consider running migration in smaller chunks

#### Validation Fails
1. Run individual validation queries to identify issues
2. Check for orphaned data or constraint violations
3. Verify function and trigger creation
4. Review RLS policy configuration

#### Performance Issues
1. Verify all indexes were created successfully
2. Check query execution plans
3. Monitor database resource usage
4. Consider additional indexes for specific use cases

### Support Queries

```sql
-- Check organization user counts
SELECT o.name, o.active_user_count, COUNT(p.id) as actual_count
FROM organizations o
LEFT JOIN profiles p ON o.id = p.organization_id AND p.is_active = true
GROUP BY o.id, o.name, o.active_user_count;

-- View user roles distribution
SELECT organization_id, unnest(roles) as role, COUNT(*)
FROM profiles
WHERE is_active = true
GROUP BY organization_id, role
ORDER BY organization_id, role;

-- Check practitioner assignments
SELECT o.name, pa.supervisor_role, COUNT(*) as assignments
FROM practitioner_assignments pa
JOIN organizations o ON pa.organization_id = o.id
WHERE pa.active = true
GROUP BY o.name, pa.supervisor_role;
```

## Security Considerations

### Data Isolation
- All organizational data is strictly isolated by organization_id
- RLS policies prevent cross-organization data access
- Supervisor access is limited to assigned practitioners

### Role-Based Access
- Multi-role support (users can have multiple roles)
- Principle of least privilege
- Admin roles inherit coach and therapist permissions

### Privacy Protection
- Journal entries remain private to practitioners and assigned supervisors
- Archival system preserves data while removing access
- Invitation system uses secure tokens with expiration

## Performance Considerations

### Optimizations
- Comprehensive indexing strategy for organizational queries
- Efficient user count tracking with triggers
- Optimized RLS policies for common access patterns

### Monitoring
- Track query performance on organizational data
- Monitor index usage and effectiveness
- Watch for N+1 query patterns in application code

## Future Enhancements

### Payment Integration
- Database schema includes Stripe preparation fields
- Subscription tier enforcement ready for implementation
- Billing email and payment method storage prepared

### Advanced Features
- Custom virtue definitions per organization
- Advanced reporting and analytics
- SSO integration for enterprise customers
- Custom domain support

## Support

For issues with this migration:

1. Check the validation script output
2. Review the troubleshooting section
3. Examine database logs for errors
4. Test on a development environment first
5. Consider rolling back if critical issues arise

Remember to always backup your data before running migrations in production.