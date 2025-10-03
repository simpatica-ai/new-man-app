-- Production Migration: Organizational Model Schema Changes
-- Phase 1: Core schema implementation
-- This script creates the organizational model tables and extends existing tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#5F4339',
  secondary_color TEXT DEFAULT '#A8A29E',
  subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'enterprise', 'legacy')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended', 'cancelled')),
  max_users INTEGER DEFAULT 40,
  active_user_count INTEGER DEFAULT 0,
  custom_domain TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Payment model preparation (future implementation)
  billing_email TEXT,
  payment_method_id TEXT,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT max_users_limit CHECK (max_users <= 1000), -- Higher limit for legacy migration
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Add organizational columns to profiles table
DO $$ 
BEGIN
  -- Add organization_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id') THEN
    ALTER TABLE profiles ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
  
  -- Add roles column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'roles') THEN
    ALTER TABLE profiles ADD COLUMN roles TEXT[] DEFAULT ARRAY['practitioner'];
  END IF;
  
  -- Add activity tracking columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_activity') THEN
    ALTER TABLE profiles ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_virtue_id') THEN
    ALTER TABLE profiles ADD COLUMN current_virtue_id INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_stage') THEN
    ALTER TABLE profiles ADD COLUMN current_stage INTEGER DEFAULT 1;
  END IF;
  
  -- Add archival columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
    ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'archived_at') THEN
    ALTER TABLE profiles ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'archived_by') THEN
    ALTER TABLE profiles ADD COLUMN archived_by UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Create practitioner_assignments table for coach/therapist relationships
CREATE TABLE IF NOT EXISTS practitioner_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  supervisor_role TEXT NOT NULL CHECK (supervisor_role IN ('coach', 'therapist')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  active BOOLEAN DEFAULT true,
  
  -- Ensure unique active assignments per role
  UNIQUE(practitioner_id, supervisor_id, supervisor_role, organization_id)
);

-- Create organization_invitations table
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  roles TEXT[] NOT NULL,
  invited_by UUID REFERENCES profiles(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate active invitations
  UNIQUE(organization_id, email) WHERE accepted_at IS NULL
);

-- Add constraints and validation
ALTER TABLE profiles ADD CONSTRAINT valid_roles 
  CHECK (roles <@ ARRAY['admin', 'coach', 'therapist', 'practitioner']);

-- Create function to update organization active user count
CREATE OR REPLACE FUNCTION update_organization_active_user_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update active user count for the organization
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE organizations 
    SET active_user_count = (
      SELECT COUNT(*) 
      FROM profiles 
      WHERE organization_id = NEW.organization_id 
      AND is_active = true
    )
    WHERE id = NEW.organization_id;
    
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE organizations 
    SET active_user_count = (
      SELECT COUNT(*) 
      FROM profiles 
      WHERE organization_id = OLD.organization_id 
      AND is_active = true
    )
    WHERE id = OLD.organization_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update active user count
DROP TRIGGER IF EXISTS trigger_update_active_user_count ON profiles;
CREATE TRIGGER trigger_update_active_user_count
  AFTER INSERT OR UPDATE OF is_active, organization_id OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_organization_active_user_count();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for organizations updated_at
DROP TRIGGER IF EXISTS trigger_organizations_updated_at ON organizations;
CREATE TRIGGER trigger_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE practitioner_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Organizations: Only admins can modify their organization
CREATE POLICY "Admins can modify their organization" ON organizations
  FOR ALL USING (
    id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND 'admin' = ANY(roles)
    )
  );

-- Practitioner assignments: Users can see assignments in their organization
CREATE POLICY "Users can view assignments in their organization" ON practitioner_assignments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Practitioner assignments: Admins and supervisors can manage assignments
CREATE POLICY "Supervisors can manage assignments" ON practitioner_assignments
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND ('admin' = ANY(roles) OR 'coach' = ANY(roles) OR 'therapist' = ANY(roles))
    )
  );

-- Organization invitations: Admins can manage invitations
CREATE POLICY "Admins can manage invitations" ON organization_invitations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND 'admin' = ANY(roles)
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON profiles USING GIN(roles);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON profiles(last_activity);
CREATE INDEX IF NOT EXISTS idx_practitioner_assignments_practitioner ON practitioner_assignments(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_practitioner_assignments_supervisor ON practitioner_assignments(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_practitioner_assignments_org ON practitioner_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_token ON organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON organization_invitations(email);

-- Add comments for documentation
COMMENT ON TABLE organizations IS 'Organizations that manage groups of users with role-based access';
COMMENT ON TABLE practitioner_assignments IS 'Assignments between practitioners and their supervisors (coaches/therapists)';
COMMENT ON TABLE organization_invitations IS 'Pending invitations for users to join organizations';
COMMENT ON COLUMN profiles.roles IS 'Array of roles: admin, coach, therapist, practitioner';
COMMENT ON COLUMN profiles.is_active IS 'Whether user is active (false = archived)';
COMMENT ON COLUMN organizations.max_users IS 'Maximum active users allowed (40 for regular orgs, 1000 for legacy)';