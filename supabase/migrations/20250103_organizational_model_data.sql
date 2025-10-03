-- Production Migration: Organizational Model Data Migration
-- Phase 2: Migrate existing data to organizational model
-- This script creates default organization and migrates existing users and relationships

-- Create default organization for existing users
INSERT INTO organizations (
  id,
  name,
  slug,
  primary_color,
  secondary_color,
  subscription_tier,
  subscription_status,
  max_users,
  active_user_count,
  settings,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Individual Users',
  'individual-users',
  '#5F4339',
  '#A8A29E',
  'legacy',
  'active',
  1000, -- Higher limit for legacy users
  0, -- Will be updated by trigger
  '{"legacy_migration": true, "migration_date": "' || NOW()::text || '"}',
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- Get the default organization ID for use in subsequent queries
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  SELECT id INTO default_org_id FROM organizations WHERE slug = 'individual-users';
  
  -- Update all existing users to belong to default organization
  -- Set roles based on existing sponsor relationships
  UPDATE profiles 
  SET 
    organization_id = default_org_id,
    roles = CASE 
      WHEN id IN (
        SELECT DISTINCT sponsor_id 
        FROM sponsor_practitioner_relationships 
        WHERE active = true
      ) THEN ARRAY['coach']
      ELSE ARRAY['practitioner']
    END,
    is_active = true,
    last_activity = COALESCE(
      last_sign_in_at, 
      updated_at, 
      created_at
    ),
    -- Set current virtue based on most recent assessment or progress
    current_virtue_id = (
      SELECT virtue_id 
      FROM user_virtue_progress uvp 
      WHERE uvp.user_id = profiles.id 
      ORDER BY uvp.updated_at DESC 
      LIMIT 1
    ),
    current_stage = COALESCE(
      (
        SELECT stage 
        FROM user_virtue_progress uvp 
        WHERE uvp.user_id = profiles.id 
        ORDER BY uvp.updated_at DESC 
        LIMIT 1
      ), 
      1
    )
  WHERE organization_id IS NULL;
  
  -- Create practitioner assignments from existing sponsor relationships
  -- Only if the sponsor_practitioner_relationships table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_practitioner_relationships') THEN
    INSERT INTO practitioner_assignments (
      practitioner_id,
      supervisor_id,
      supervisor_role,
      organization_id,
      assigned_at,
      assigned_by,
      active
    )
    SELECT 
      spr.practitioner_id,
      spr.sponsor_id,
      'coach',
      default_org_id,
      COALESCE(spr.created_at, NOW()),
      spr.sponsor_id, -- Sponsor assigned themselves initially
      COALESCE(spr.active, true)
    FROM sponsor_practitioner_relationships spr
    WHERE spr.active = true
    ON CONFLICT (practitioner_id, supervisor_id, supervisor_role, organization_id) DO NOTHING;
  END IF;
  
  -- Update organization active user count
  UPDATE organizations 
  SET active_user_count = (
    SELECT COUNT(*) 
    FROM profiles 
    WHERE organization_id = default_org_id 
    AND is_active = true
  )
  WHERE id = default_org_id;
  
  RAISE NOTICE 'Migration completed for organization: %', default_org_id;
END $$;

-- Create validation queries to verify migration success
DO $$
DECLARE
  total_users INTEGER;
  migrated_users INTEGER;
  coach_assignments INTEGER;
  legacy_org_id UUID;
BEGIN
  SELECT id INTO legacy_org_id FROM organizations WHERE slug = 'individual-users';
  
  SELECT COUNT(*) INTO total_users FROM profiles;
  SELECT COUNT(*) INTO migrated_users FROM profiles WHERE organization_id IS NOT NULL;
  SELECT COUNT(*) INTO coach_assignments FROM practitioner_assignments WHERE organization_id = legacy_org_id;
  
  RAISE NOTICE 'Migration Summary:';
  RAISE NOTICE '- Total users: %', total_users;
  RAISE NOTICE '- Migrated users: %', migrated_users;
  RAISE NOTICE '- Coach assignments created: %', coach_assignments;
  RAISE NOTICE '- Default organization ID: %', legacy_org_id;
  
  -- Check for any users not migrated
  IF migrated_users < total_users THEN
    RAISE WARNING 'Not all users were migrated! Missing: %', (total_users - migrated_users);
  END IF;
END $$;

-- Create a backup of the original sponsor_practitioner_relationships for rollback
-- Only if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_practitioner_relationships') THEN
    CREATE TABLE IF NOT EXISTS sponsor_practitioner_relationships_backup AS 
    SELECT *, NOW() as backup_created_at 
    FROM sponsor_practitioner_relationships;
    
    RAISE NOTICE 'Created backup table: sponsor_practitioner_relationships_backup';
  END IF;
END $$;

-- Add some sample organizational data for testing (only in non-production environments)
-- This will be skipped in production due to the environment check
DO $$
BEGIN
  -- Only add sample data if this is not production (check for production indicators)
  IF NOT EXISTS (
    SELECT 1 FROM organizations 
    WHERE name ILIKE '%production%' 
    OR name ILIKE '%prod%'
    OR slug ILIKE '%prod%'
  ) AND (
    SELECT COUNT(*) FROM profiles
  ) < 100 THEN -- Assume production has more than 100 users
    
    -- Add sample organizations for development/staging
    INSERT INTO organizations (
      name, slug, primary_color, secondary_color, max_users, subscription_tier
    ) VALUES 
    ('Demo Wellness Corp', 'demo-wellness-corp', '#2563eb', '#64748b', 25, 'basic'),
    ('Sample Therapy Center', 'sample-therapy', '#7c3aed', '#a78bfa', 15, 'premium')
    ON CONFLICT (slug) DO NOTHING;
    
    RAISE NOTICE 'Added sample organizations for development/testing';
  END IF;
END $$;