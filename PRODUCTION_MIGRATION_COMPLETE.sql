-- ============================================================================
-- COMPLETE PRODUCTION MIGRATION SCRIPT
-- Date: 2025-01-13
-- 
-- ⚠️  CRITICAL: READ BEFORE EXECUTING ⚠️
-- 
-- This script contains ALL migrations needed for production deployment.
-- It is designed to be SAFE and IDEMPOTENT (can run multiple times).
-- 
-- BACKUP YOUR DATABASE BEFORE RUNNING!
-- 
-- Order of operations:
-- 1. Cleanup dev-only objects
-- 2. Fix profiles schema
-- 3. Add work product reporting
-- 4. Fix missing updated_at columns
-- 5. Implement clear role system
-- 6. Migrate roles to new system
-- 7. Add organization request system
-- ============================================================================

-- ============================================================================
-- STEP 1: CLEANUP DEV-ONLY OBJECTS (CRITICAL FIRST STEP)
-- ============================================================================

-- Remove dev-only views that don't exist in production
DROP VIEW IF EXISTS public.profile_with_email CASCADE;
DROP VIEW IF EXISTS public.profiles_with_email CASCADE;

-- Remove any dev-only functions that might conflict
DROP FUNCTION IF EXISTS public.get_user_profile_with_email(UUID) CASCADE;

-- ============================================================================
-- STEP 2: FIX PROFILES SCHEMA MISMATCH (CRITICAL SECOND STEP)
-- ============================================================================

-- Add missing columns to profiles table (safe if they already exist)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS roles TEXT[],
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updated_at trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_profiles_updated_at 
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- STEP 3: WORK PRODUCT REPORTING SYSTEM (SIMPLIFIED FOR PRODUCTION)
-- ============================================================================

-- NOTE: The following dev-only tables are NOT created in production:
-- - work_product_reports (with organization_id) - caused foreign key conflicts
-- - practitioner_assignments - unused development table
-- These tables were causing foreign key constraint issues during organization deletion
-- and are not needed for the MVP organizational model.

-- Create simplified work product reports table (user-scoped only)
CREATE TABLE IF NOT EXISTS public.work_product_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  report_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- NOTE: No organization_id column to avoid foreign key conflicts
);

-- Add RLS
ALTER TABLE public.work_product_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work product reports
CREATE POLICY IF NOT EXISTS "Users can view their own work product reports" ON public.work_product_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create their own work product reports" ON public.work_product_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_work_product_reports_user_id ON public.work_product_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_work_product_reports_date_range ON public.work_product_reports(start_date, end_date);

-- Add updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_work_product_reports_updated_at'
  ) THEN
    CREATE TRIGGER update_work_product_reports_updated_at 
      BEFORE UPDATE ON public.work_product_reports
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- STEP 4: FIX MISSING UPDATED_AT COLUMNS
-- ============================================================================

-- Add updated_at to user_virtue_stage_memos if missing
ALTER TABLE public.user_virtue_stage_memos 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_virtue_stage_memos_updated_at'
  ) THEN
    CREATE TRIGGER update_user_virtue_stage_memos_updated_at 
      BEFORE UPDATE ON public.user_virtue_stage_memos
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- STEP 5: IMPLEMENT CLEAR ROLE SYSTEM
-- ============================================================================

-- Create role validation function
CREATE OR REPLACE FUNCTION public.validate_user_roles(user_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  -- Allow empty or null roles
  IF user_roles IS NULL OR array_length(user_roles, 1) IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check each role is valid
  FOR i IN 1..array_length(user_roles, 1) LOOP
    IF user_roles[i] NOT IN (
      'sys-admin', 'org-admin', 'coach', 'practitioner', 
      'admin', 'sponsor', 'user'  -- Legacy roles
    ) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add role validation constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS valid_roles;

ALTER TABLE public.profiles 
ADD CONSTRAINT valid_roles CHECK (validate_user_roles(roles));

-- ============================================================================
-- STEP 6: MIGRATE ROLES TO NEW SYSTEM
-- ============================================================================

-- Update existing roles to new system (safe to run multiple times)
UPDATE public.profiles 
SET roles = CASE 
  WHEN role = 'admin' THEN ARRAY['sys-admin']
  WHEN role = 'sponsor' THEN ARRAY['coach'] 
  WHEN role = 'user' THEN ARRAY['practitioner']
  WHEN roles IS NULL AND role IS NOT NULL THEN ARRAY[role]
  ELSE COALESCE(roles, ARRAY['practitioner'])
END
WHERE roles IS NULL OR array_length(roles, 1) IS NULL;

-- ============================================================================
-- STEP 7: ADD MISSING ORGANIZATION FEATURES
-- ============================================================================

-- Add user_limit column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS user_limit INTEGER NULL;

-- Add comment and index for user_limit
COMMENT ON COLUMN public.organizations.user_limit IS 'Maximum number of users allowed in this organization. NULL means unlimited.';
CREATE INDEX IF NOT EXISTS idx_organizations_user_limit ON public.organizations(user_limit) WHERE user_limit IS NOT NULL;

-- ============================================================================
-- STEP 8: ORGANIZATION INVITATIONS SYSTEM
-- ============================================================================

-- Create organization_invitations table
CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_name TEXT NULL,
    roles TEXT[] NOT NULL DEFAULT '{}',
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for organization_invitations
CREATE INDEX IF NOT EXISTS idx_organization_invitations_organization_id ON public.organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_email ON public.organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_token ON public.organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_expires_at ON public.organization_invitations(expires_at);
CREATE INDEX IF NOT EXISTS idx_organization_invitations_accepted_at ON public.organization_invitations(accepted_at);

-- Add RLS for organization_invitations
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view organization invitations" ON public.organization_invitations;
DROP POLICY IF EXISTS "Org admins can create invitations" ON public.organization_invitations;
DROP POLICY IF EXISTS "Org admins can update invitations" ON public.organization_invitations;
DROP POLICY IF EXISTS "Org admins can delete invitations" ON public.organization_invitations;
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON public.organization_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON public.organization_invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON public.organization_invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON public.organization_invitations;

-- RLS Policies for organization_invitations (more permissive for compatibility)
CREATE POLICY "Users can view organization invitations" ON public.organization_invitations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Allow users with any admin role to create invitations
CREATE POLICY "Admins can create invitations" ON public.organization_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (
                'org-admin' = ANY(roles) 
                OR 'sys-admin' = ANY(roles)
                OR 'admin' = ANY(roles)  -- Legacy admin role
            )
        )
    );

-- Allow admins to update invitations
CREATE POLICY "Admins can update invitations" ON public.organization_invitations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (
                'org-admin' = ANY(roles) 
                OR 'sys-admin' = ANY(roles)
                OR 'admin' = ANY(roles)
            )
        )
    );

-- Allow admins to delete invitations
CREATE POLICY "Admins can delete invitations" ON public.organization_invitations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (
                'org-admin' = ANY(roles) 
                OR 'sys-admin' = ANY(roles)
                OR 'admin' = ANY(roles)
            )
        )
    );

-- Allow anyone to view invitations by token (for accepting invitations)
CREATE POLICY "Anyone can view invitations by token" ON public.organization_invitations
    FOR SELECT USING (true);

-- Add updated_at trigger for organization_invitations
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_organization_invitations_updated_at'
  ) THEN
    CREATE TRIGGER update_organization_invitations_updated_at 
      BEFORE UPDATE ON public.organization_invitations 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $;

-- Grant permissions for organization_invitations
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_invitations TO authenticated;

-- ============================================================================
-- STEP 9: ORGANIZATION REQUEST SYSTEM
-- ============================================================================

-- Create organization requests table
CREATE TABLE IF NOT EXISTS public.organization_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization Details
  organization_name TEXT NOT NULL,
  organization_description TEXT,
  website_url TEXT,
  phone_number TEXT,
  
  -- Contact Person (becomes org-admin when approved)
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_title TEXT,
  
  -- Request Details
  estimated_users INTEGER DEFAULT 10,
  use_case TEXT,
  
  -- Status and Workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  
  -- Admin Notes
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_website_url CHECK (
    website_url IS NULL OR website_url ~ '^https?://.*'
  ),
  CONSTRAINT valid_estimated_users CHECK (
    estimated_users > 0 AND estimated_users <= 100
  )
);

-- Add RLS and policies
ALTER TABLE public.organization_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "System admins can view all organization requests" ON public.organization_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND ('sys-admin' = ANY(roles) OR 'org-admin' = ANY(roles))
    )
  );

CREATE POLICY IF NOT EXISTS "System admins can update organization requests" ON public.organization_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND ('sys-admin' = ANY(roles))
    )
  );

CREATE POLICY IF NOT EXISTS "Anyone can create organization requests" ON public.organization_requests
  FOR INSERT WITH CHECK (true);

-- Add RLS policy for organization deletion (sys-admins only)
CREATE POLICY IF NOT EXISTS "Only sys-admins can delete organizations" ON public.organizations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND 'sys-admin' = ANY(roles)
    )
  );

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_organization_requests_status ON public.organization_requests(status);
CREATE INDEX IF NOT EXISTS idx_organization_requests_created_at ON public.organization_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_organization_requests_contact_email ON public.organization_requests(contact_email);

-- Add updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_organization_requests_updated_at'
  ) THEN
    CREATE TRIGGER update_organization_requests_updated_at 
      BEFORE UPDATE ON public.organization_requests
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create approval functions
CREATE OR REPLACE FUNCTION approve_organization_request(
  request_id UUID,
  admin_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  organization_id UUID,
  admin_user_id UUID
) AS $$
DECLARE
  request_record RECORD;
  new_org_id UUID;
  org_slug TEXT;
  existing_user_id UUID;
BEGIN
  -- Get the request details
  SELECT * INTO request_record 
  FROM public.organization_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Request not found or already processed', NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Generate organization slug
  org_slug := lower(regexp_replace(request_record.organization_name, '[^a-zA-Z0-9]+', '-', 'g'));
  org_slug := trim(org_slug, '-');
  
  -- Ensure slug is unique
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) LOOP
    org_slug := org_slug || '-' || floor(random() * 1000)::text;
  END LOOP;
  
  -- Create the organization (only if organizations table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    INSERT INTO public.organizations (
      name, 
      slug, 
      description, 
      website_url, 
      phone_number,
      max_users
    ) VALUES (
      request_record.organization_name,
      org_slug,
      request_record.organization_description,
      request_record.website_url,
      request_record.phone_number,
      GREATEST(request_record.estimated_users, 40)
    ) RETURNING id INTO new_org_id;
  END IF;
  
  -- Check if contact person already has an account
  SELECT au.id INTO existing_user_id
  FROM auth.users au
  WHERE au.email = request_record.contact_email;
  
  -- If user exists, assign them as org-admin immediately
  IF existing_user_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET 
      organization_id = new_org_id,
      roles = array_append(COALESCE(roles, ARRAY[]::TEXT[]), 'org-admin')
    WHERE id = existing_user_id;
  END IF;
  
  -- Create pending org admin assignment for when they sign up (if they don't exist yet)
  INSERT INTO public.pending_org_admins (
    organization_id,
    contact_email,
    contact_name,
    created_at
  ) VALUES (
    new_org_id,
    request_record.contact_email,
    request_record.contact_name,
    NOW()
  ) ON CONFLICT (contact_email) DO UPDATE SET
    organization_id = new_org_id,
    contact_name = request_record.contact_name;
  
  -- Update the request status
  UPDATE public.organization_requests 
  SET 
    status = 'approved',
    admin_notes = COALESCE(admin_notes, 'Organization approved and created'),
    reviewed_by = auth.uid(),
    reviewed_at = NOW()
  WHERE id = request_id;
  
  RETURN QUERY SELECT 
    true, 
    CASE 
      WHEN existing_user_id IS NOT NULL THEN
        format('Organization "%s" approved! Contact person %s already has an account and has been assigned as org-admin.', 
               request_record.organization_name, request_record.contact_email)
      ELSE
        format('Organization "%s" approved! When %s creates an account, they will automatically become org-admin.', 
               request_record.organization_name, request_record.contact_email)
    END,
    new_org_id,
    existing_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reject_organization_request(
  request_id UUID,
  rejection_reason TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  UPDATE public.organization_requests 
  SET 
    status = 'rejected',
    admin_notes = rejection_reason,
    reviewed_by = auth.uid(),
    reviewed_at = NOW()
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Request not found or already processed';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Organization request rejected';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Definitive organization deletion function that properly handles foreign key constraints
CREATE OR REPLACE FUNCTION delete_organization_with_users(
  org_id UUID,
  admin_confirmation TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  deleted_users_count INTEGER
) AS $$
DECLARE
  org_record RECORD;
  user_count INTEGER;
  deleted_count INTEGER := 0;
  user_ids UUID[];
BEGIN
  -- Get organization details
  SELECT * INTO org_record 
  FROM public.organizations 
  WHERE id = org_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Organization not found', 0;
    RETURN;
  END IF;
  
  -- Count users in organization
  SELECT COUNT(*) INTO user_count
  FROM public.profiles 
  WHERE organization_id = org_id;
  
  -- Require confirmation for organizations with users
  IF user_count > 0 AND (admin_confirmation IS NULL OR admin_confirmation != 'DELETE_WITH_USERS') THEN
    RETURN QUERY SELECT 
      false, 
      format('Organization has %s users. Use admin_confirmation = ''DELETE_WITH_USERS'' to confirm deletion of organization and all users.', user_count),
      user_count;
    RETURN;
  END IF;
  
  -- Step 1: Get all user IDs that belong to this organization
  SELECT array_agg(id) INTO user_ids
  FROM public.profiles 
  WHERE organization_id = org_id;
  
  -- Step 2: Delete organization requests related to this org
  DELETE FROM public.organization_requests 
  WHERE organization_name = org_record.name;
  
  -- Step 3: Remove organization_id from profiles first (break the foreign key reference)
  UPDATE public.profiles 
  SET organization_id = NULL 
  WHERE organization_id = org_id;
  
  -- Step 4: Now delete the organization (no more foreign key references)
  DELETE FROM public.organizations 
  WHERE id = org_id;
  
  -- Step 5: Delete the users (now that organization is gone)
  IF user_ids IS NOT NULL THEN
    FOR i IN 1..array_length(user_ids, 1) LOOP
      -- Delete the user from auth.users (this will cascade to profiles)
      DELETE FROM auth.users WHERE id = user_ids[i];
      deleted_count := deleted_count + 1;
    END LOOP;
  END IF;
  
  RETURN QUERY SELECT 
    true, 
    format('Organization "%s" deleted successfully along with %s users', org_record.name, deleted_count),
    deleted_count;
    
EXCEPTION
  WHEN foreign_key_violation THEN
    RETURN QUERY SELECT 
      false, 
      format('Foreign key constraint error: %s', SQLERRM),
      0;
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      false, 
      format('Error deleting organization: %s', SQLERRM),
      0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create table to track pending org admin assignments
CREATE TABLE IF NOT EXISTS public.pending_org_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_email TEXT NOT NULL UNIQUE,
  contact_name TEXT NOT NULL,
  assigned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS for pending org admins
ALTER TABLE public.pending_org_admins ENABLE ROW LEVEL SECURITY;

-- Only sys-admins can view pending assignments
CREATE POLICY IF NOT EXISTS "Sys admins can manage pending org admins" ON public.pending_org_admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND 'sys-admin' = ANY(roles)
    )
  );

-- Function to automatically assign org-admin role on signup
CREATE OR REPLACE FUNCTION assign_pending_org_admin()
RETURNS TRIGGER AS $$
DECLARE
  pending_assignment RECORD;
BEGIN
  -- Check if this email has a pending org-admin assignment
  SELECT * INTO pending_assignment
  FROM public.pending_org_admins
  WHERE contact_email = NEW.email AND assigned = FALSE;
  
  IF FOUND THEN
    -- Update the user's profile with org-admin role and organization
    UPDATE public.profiles 
    SET 
      organization_id = pending_assignment.organization_id,
      roles = ARRAY['org-admin']
    WHERE id = NEW.id;
    
    -- Mark the assignment as completed
    UPDATE public.pending_org_admins
    SET 
      assigned = TRUE,
      assigned_at = NOW()
    WHERE id = pending_assignment.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run after user signup
CREATE TRIGGER IF NOT EXISTS assign_org_admin_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_pending_org_admin();

-- Grant permissions
GRANT EXECUTE ON FUNCTION approve_organization_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_organization_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_organization_with_users(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_pending_org_admin() TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables exist
SELECT 'Tables created successfully' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_product_reports')
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_requests')
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_invitations');

-- Verify profiles table has required columns
SELECT 'Profiles table updated successfully' as status
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'roles')
  AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id')
  AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at');

-- Verify organizations table has user_limit column
SELECT 'Organizations table updated successfully' as status
WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'user_limit');

-- Verify functions exist
SELECT 'Functions created successfully' as status
WHERE EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'approve_organization_request')
  AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'reject_organization_request');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add function documentation
COMMENT ON FUNCTION approve_organization_request(UUID, TEXT) IS 'Approves an organization request and creates the organization';
COMMENT ON FUNCTION reject_organization_request(UUID, TEXT) IS 'Rejects an organization request with reason';
COMMENT ON FUNCTION delete_organization_with_users(UUID, TEXT) IS 'Safely deletes an organization and all its users with proper cascade handling';

-- If you see all success messages above, the migration completed successfully!
-- Your application should now have all organizational features available.