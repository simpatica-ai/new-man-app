-- Migration: Organizational Model Implementation
-- Date: 2025-01-02
-- Description: Adds organizational structure with multi-tenant support, role-based access control,
--              user archival system, and activity tracking

-- ============================================================================
-- 1. CREATE ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#5F4339',
  secondary_color TEXT DEFAULT '#A8A29E',
  subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended', 'cancelled')),
  max_users INTEGER DEFAULT 40,
  active_user_count INTEGER DEFAULT 0,
  custom_domain TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Payment model preparation (future Stripe integration)
  billing_email TEXT,
  payment_method_id TEXT,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT max_users_limit CHECK (max_users <= 40),
  CONSTRAINT active_user_count_non_negative CHECK (active_user_count >= 0),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$' AND length(slug) >= 3 AND length(slug) <= 50)
);

-- Add RLS to organizations table
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. EXTEND PROFILES TABLE FOR ORGANIZATIONAL MODEL
-- ============================================================================

-- Add organizational fields to profiles table
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['practitioner'],
  ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS current_virtue_id UUID REFERENCES public.virtues(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS current_stage INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Update existing role column to be compatible with new roles array
-- This preserves existing data while transitioning to the new system
UPDATE public.profiles 
SET roles = ARRAY[COALESCE(role, 'practitioner')]
WHERE roles IS NULL OR array_length(roles, 1) IS NULL;

-- Add constraints for roles
ALTER TABLE public.profiles 
  ADD CONSTRAINT valid_roles CHECK (
    roles <@ ARRAY['admin', 'coach', 'therapist', 'practitioner']
    AND array_length(roles, 1) > 0
  ),
  ADD CONSTRAINT current_stage_positive CHECK (current_stage > 0);

-- ============================================================================
-- 3. CREATE PRACTITIONER ASSIGNMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.practitioner_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  supervisor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  supervisor_role TEXT NOT NULL CHECK (supervisor_role IN ('coach', 'therapist')),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  active BOOLEAN DEFAULT true,
  
  -- Constraints
  CONSTRAINT no_self_assignment CHECK (practitioner_id != supervisor_id),
  UNIQUE(practitioner_id, supervisor_id, supervisor_role, organization_id)
);

-- Add RLS to practitioner_assignments table
ALTER TABLE public.practitioner_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE ORGANIZATION INVITATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  roles TEXT[] NOT NULL CHECK (
    roles <@ ARRAY['admin', 'coach', 'therapist', 'practitioner']
    AND array_length(roles, 1) > 0
  ),
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT expires_in_future CHECK (expires_at > created_at),
  UNIQUE(organization_id, email)
);

-- Add RLS to organization_invitations table
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Organizations indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON public.organizations(subscription_status);

-- Profiles indexes for organizational queries
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_active ON public.profiles(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON public.profiles USING GIN(roles);
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity ON public.profiles(last_activity);
CREATE INDEX IF NOT EXISTS idx_profiles_current_virtue ON public.profiles(current_virtue_id, current_stage);

-- Practitioner assignments indexes
CREATE INDEX IF NOT EXISTS idx_practitioner_assignments_practitioner ON public.practitioner_assignments(practitioner_id);
CREATE INDEX IF NOT EXISTS idx_practitioner_assignments_supervisor ON public.practitioner_assignments(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_practitioner_assignments_organization ON public.practitioner_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_practitioner_assignments_active ON public.practitioner_assignments(active);

-- Organization invitations indexes
CREATE INDEX IF NOT EXISTS idx_organization_invitations_token ON public.organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON public.organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_expires ON public.organization_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_organization ON public.organization_invitations(organization_id);

-- ============================================================================
-- 6. CREATE FUNCTIONS FOR ORGANIZATIONAL OPERATIONS
-- ============================================================================

-- Function to update active user count for an organization
CREATE OR REPLACE FUNCTION update_organization_active_user_count(org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM public.profiles
  WHERE organization_id = org_id AND is_active = true;
  
  UPDATE public.organizations
  SET active_user_count = active_count,
      updated_at = NOW()
  WHERE id = org_id;
  
  RETURN active_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive a user (soft delete)
CREATE OR REPLACE FUNCTION archive_user(user_id UUID, archived_by_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_org_id UUID;
BEGIN
  -- Get user's organization
  SELECT organization_id INTO user_org_id
  FROM public.profiles
  WHERE id = user_id;
  
  -- Archive the user
  UPDATE public.profiles
  SET is_active = false,
      archived_at = NOW(),
      archived_by = archived_by_id,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Update organization active user count
  IF user_org_id IS NOT NULL THEN
    PERFORM update_organization_active_user_count(user_org_id);
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reactivate a user
CREATE OR REPLACE FUNCTION reactivate_user(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_org_id UUID;
  org_max_users INTEGER;
  org_active_count INTEGER;
BEGIN
  -- Get user's organization and check limits
  SELECT p.organization_id, o.max_users, o.active_user_count
  INTO user_org_id, org_max_users, org_active_count
  FROM public.profiles p
  LEFT JOIN public.organizations o ON p.organization_id = o.id
  WHERE p.id = user_id;
  
  -- Check if organization has space for reactivation
  IF user_org_id IS NOT NULL AND org_active_count >= org_max_users THEN
    RAISE EXCEPTION 'Organization has reached maximum user limit of %', org_max_users;
  END IF;
  
  -- Reactivate the user
  UPDATE public.profiles
  SET is_active = true,
      archived_at = NULL,
      archived_by = NULL,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Update organization active user count
  IF user_org_id IS NOT NULL THEN
    PERFORM update_organization_active_user_count(user_org_id);
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate organization user limit before adding users
CREATE OR REPLACE FUNCTION validate_organization_user_limit(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  max_users INTEGER;
  active_count INTEGER;
BEGIN
  SELECT max_users, active_user_count
  INTO max_users, active_count
  FROM public.organizations
  WHERE id = org_id;
  
  IF active_count >= max_users THEN
    RAISE EXCEPTION 'Organization has reached maximum user limit of %', max_users;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. CREATE TRIGGERS FOR AUTOMATIC OPERATIONS
-- ============================================================================

-- Trigger to update organization active user count when profiles change
CREATE OR REPLACE FUNCTION trigger_update_organization_user_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NOT NULL AND NEW.is_active = true THEN
      PERFORM update_organization_active_user_count(NEW.organization_id);
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- If organization changed or active status changed
    IF (OLD.organization_id IS DISTINCT FROM NEW.organization_id) OR 
       (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
      
      -- Update old organization count
      IF OLD.organization_id IS NOT NULL THEN
        PERFORM update_organization_active_user_count(OLD.organization_id);
      END IF;
      
      -- Update new organization count
      IF NEW.organization_id IS NOT NULL THEN
        PERFORM update_organization_active_user_count(NEW.organization_id);
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.organization_id IS NOT NULL THEN
      PERFORM update_organization_active_user_count(OLD.organization_id);
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_profiles_organization_count
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_update_organization_user_count();

-- ============================================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Organizations policies
CREATE POLICY "Organization members can view their organization" ON public.organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

CREATE POLICY "Organization admins can update their organization" ON public.organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND organization_id IS NOT NULL 
        AND 'admin' = ANY(roles)
    )
  );

-- Enhanced profiles policies for organizational context
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view accessible profiles" ON public.profiles
  FOR SELECT USING (
    -- Users can view their own profile
    auth.uid() = id
    OR
    -- Organization members can view other members in same organization
    (organization_id IS NOT NULL AND organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    ))
    OR
    -- Supervisors can view their assigned practitioners
    (id IN (
      SELECT practitioner_id 
      FROM public.practitioner_assignments 
      WHERE supervisor_id = auth.uid() AND active = true
    ))
    OR
    -- Practitioners can view their supervisors
    (id IN (
      SELECT supervisor_id 
      FROM public.practitioner_assignments 
      WHERE practitioner_id = auth.uid() AND active = true
    ))
  );

-- Practitioner assignments policies
CREATE POLICY "Organization members can view assignments" ON public.practitioner_assignments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
  );

CREATE POLICY "Admins can manage assignments" ON public.practitioner_assignments
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND organization_id IS NOT NULL 
        AND 'admin' = ANY(roles)
    )
  );

-- Organization invitations policies
CREATE POLICY "Organization admins can manage invitations" ON public.organization_invitations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND organization_id IS NOT NULL 
        AND 'admin' = ANY(roles)
    )
  );

-- Enhanced journal entries policies for organizational context
DROP POLICY IF EXISTS "Users can view own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can create own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update own journal entries" ON public.journal_entries;

CREATE POLICY "Users can view accessible journal entries" ON public.journal_entries
  FOR SELECT USING (
    -- Users can view their own entries
    auth.uid() = user_id
    OR
    -- Supervisors can view their assigned practitioners' entries
    (user_id IN (
      SELECT practitioner_id 
      FROM public.practitioner_assignments 
      WHERE supervisor_id = auth.uid() AND active = true
    ))
  );

CREATE POLICY "Users can create own journal entries" ON public.journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries" ON public.journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Enhanced sponsor relationships policies (maintain backward compatibility)
DROP POLICY IF EXISTS "Users can view their sponsor relationships" ON public.sponsor_relationships;

CREATE POLICY "Users can view their sponsor relationships" ON public.sponsor_relationships
  FOR SELECT USING (
    auth.uid() = sponsor_id 
    OR auth.uid() = practitioner_id
    OR
    -- Organization admins can view relationships in their organization
    EXISTS (
      SELECT 1 FROM public.profiles p1, public.profiles p2
      WHERE p1.id = auth.uid() 
        AND p2.id IN (sponsor_id, practitioner_id)
        AND p1.organization_id = p2.organization_id
        AND p1.organization_id IS NOT NULL
        AND 'admin' = ANY(p1.roles)
    )
  );

-- ============================================================================
-- 9. MIGRATION DATA SETUP
-- ============================================================================

-- Create a default organization for existing users without organization
-- This ensures backward compatibility during the transition
DO $$
DECLARE
  default_org_id UUID;
  user_count INTEGER;
BEGIN
  -- Check if there are users without organization
  SELECT COUNT(*) INTO user_count
  FROM public.profiles
  WHERE organization_id IS NULL;
  
  -- Only create default organization if there are users without organization
  IF user_count > 0 THEN
    -- Create default organization
    INSERT INTO public.organizations (
      name, 
      slug, 
      subscription_tier, 
      subscription_status,
      max_users,
      settings
    ) VALUES (
      'Individual Users', 
      'individual-users', 
      'basic', 
      'active',
      1000, -- Higher limit for individual users
      '{"is_default": true, "allow_individual_users": true}'
    ) RETURNING id INTO default_org_id;
    
    -- Assign existing users without organization to default organization
    UPDATE public.profiles
    SET organization_id = default_org_id,
        updated_at = NOW()
    WHERE organization_id IS NULL;
    
    -- Update the active user count for the default organization
    PERFORM update_organization_active_user_count(default_org_id);
  END IF;
END $$;

-- Migrate existing sponsor relationships to coach assignments
-- This preserves existing sponsor-practitioner relationships as coach relationships
INSERT INTO public.practitioner_assignments (
  practitioner_id,
  supervisor_id,
  supervisor_role,
  organization_id,
  assigned_at,
  active
)
SELECT DISTINCT
  sr.practitioner_id,
  sr.sponsor_id,
  'coach' as supervisor_role,
  p.organization_id,
  sr.created_at,
  CASE WHEN sr.status = 'active' THEN true ELSE false END
FROM public.sponsor_relationships sr
JOIN public.profiles p ON sr.practitioner_id = p.id
WHERE sr.sponsor_id IS NOT NULL
  AND p.organization_id IS NOT NULL
ON CONFLICT (practitioner_id, supervisor_id, supervisor_role, organization_id) DO NOTHING;

-- Update roles for existing sponsors to include coach role
UPDATE public.profiles
SET roles = array_append(roles, 'coach'),
    updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT sponsor_id 
  FROM public.sponsor_relationships 
  WHERE sponsor_id IS NOT NULL
)
AND NOT ('coach' = ANY(roles));

-- ============================================================================
-- 10. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.organizations IS 'Organizations table for multi-tenant support with 40-user limit';
COMMENT ON TABLE public.practitioner_assignments IS 'Manages coach and therapist assignments to practitioners within organizations';
COMMENT ON TABLE public.organization_invitations IS 'Handles secure invitation system for organization membership';

COMMENT ON COLUMN public.organizations.max_users IS 'Maximum active users allowed (hard limit of 40)';
COMMENT ON COLUMN public.organizations.active_user_count IS 'Current count of active users (automatically maintained)';
COMMENT ON COLUMN public.organizations.subscription_tier IS 'Subscription tier: basic, premium, or enterprise';
COMMENT ON COLUMN public.organizations.settings IS 'JSON configuration for organization-specific settings';

COMMENT ON COLUMN public.profiles.roles IS 'Array of user roles: admin, coach, therapist, practitioner';
COMMENT ON COLUMN public.profiles.is_active IS 'Soft delete flag - false means user is archived';
COMMENT ON COLUMN public.profiles.last_activity IS 'Timestamp of user''s last activity for engagement tracking';
COMMENT ON COLUMN public.profiles.current_virtue_id IS 'Current virtue the user is working on';
COMMENT ON COLUMN public.profiles.current_stage IS 'Current stage within the virtue (1-4)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================