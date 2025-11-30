-- Admin Dashboard Migration
-- Task 4.1: Create organization admin dashboard
-- This migration adds the necessary components for the admin dashboard functionality

-- Ensure storage bucket exists for organization assets (logo uploads)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('organization-assets', 'organization-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for organization assets (logo uploads)
-- Allow organization admins to upload assets
DO $$
BEGIN
  -- Drop existing policies if they exist (ignore errors if they don't exist)
  BEGIN
    DROP POLICY IF EXISTS "Organization members can upload assets" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN
    NULL; -- Policy doesn't exist, continue
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Organization assets are publicly viewable" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Organization admins can update assets" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
  
  BEGIN
    DROP POLICY IF EXISTS "Organization admins can delete assets" ON storage.objects;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
  
  -- Create new policies
  CREATE POLICY "Organization members can upload assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'organization-assets' AND
    auth.uid() IN (
      SELECT p.id FROM profiles p 
      WHERE p.organization_id IS NOT NULL 
      AND 'admin' = ANY(p.roles)
    )
  );

  CREATE POLICY "Organization assets are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'organization-assets');

  CREATE POLICY "Organization admins can update assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'organization-assets' AND
    auth.uid() IN (
      SELECT p.id FROM profiles p 
      WHERE p.organization_id IS NOT NULL 
      AND 'admin' = ANY(p.roles)
    )
  );

  CREATE POLICY "Organization admins can delete assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'organization-assets' AND
    auth.uid() IN (
      SELECT p.id FROM profiles p 
      WHERE p.organization_id IS NOT NULL 
      AND 'admin' = ANY(p.roles)
    )
  );
END $$;

-- Enhanced function to get organization member activity overview
-- This function provides comprehensive data for the admin dashboard
CREATE OR REPLACE FUNCTION get_organization_activity_overview(org_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  roles TEXT[],
  last_activity TIMESTAMPTZ,
  current_virtue_id INTEGER,
  current_stage INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  days_since_activity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(pwe.user_email, 'unknown@example.com')::TEXT as email,
    COALESCE(p.full_name, '')::TEXT as full_name,
    COALESCE(p.roles, ARRAY['practitioner']) as roles,
    p.last_activity,
    p.current_virtue_id,
    p.current_stage,
    COALESCE(p.is_active, true) as is_active,
    p.created_at,
    CASE 
      WHEN p.last_activity IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM NOW() - p.last_activity)::INTEGER
    END as days_since_activity
  FROM profiles p
  LEFT JOIN profile_with_email pwe ON p.id = pwe.id
  WHERE p.organization_id = org_id
  ORDER BY p.last_activity DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization statistics for dashboard
CREATE OR REPLACE FUNCTION get_organization_stats(org_id UUID)
RETURNS TABLE (
  total_members INTEGER,
  active_members INTEGER,
  recently_active INTEGER,
  archived_members INTEGER,
  engagement_rate INTEGER
) AS $$
DECLARE
  total_count INTEGER;
  active_count INTEGER;
  recent_count INTEGER;
  archived_count INTEGER;
  engagement INTEGER;
BEGIN
  -- Get member counts
  SELECT COUNT(*) INTO total_count
  FROM profiles 
  WHERE organization_id = org_id;
  
  SELECT COUNT(*) INTO active_count
  FROM profiles 
  WHERE organization_id = org_id AND COALESCE(is_active, true) = true;
  
  SELECT COUNT(*) INTO archived_count
  FROM profiles 
  WHERE organization_id = org_id AND COALESCE(is_active, true) = false;
  
  -- Recently active = active in last 7 days
  SELECT COUNT(*) INTO recent_count
  FROM profiles 
  WHERE organization_id = org_id 
    AND COALESCE(is_active, true) = true
    AND last_activity IS NOT NULL
    AND last_activity > NOW() - INTERVAL '7 days';
  
  -- Calculate engagement rate
  IF active_count > 0 THEN
    engagement := ROUND((recent_count::FLOAT / active_count::FLOAT) * 100);
  ELSE
    engagement := 0;
  END IF;
  
  RETURN QUERY SELECT total_count, active_count, recent_count, archived_count, engagement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update organization logo URL
CREATE OR REPLACE FUNCTION update_organization_logo(org_id UUID, logo_url TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE organizations 
  SET 
    logo_url = update_organization_logo.logo_url,
    updated_at = NOW()
  WHERE id = org_id
    AND id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND 'admin' = ANY(roles)
    );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive/unarchive users (admin dashboard functionality)
CREATE OR REPLACE FUNCTION archive_organization_user(user_id UUID, archive BOOLEAN DEFAULT true)
RETURNS BOOLEAN AS $$
DECLARE
  user_org_id UUID;
  admin_org_id UUID;
BEGIN
  -- Get the user's organization
  SELECT organization_id INTO user_org_id
  FROM profiles 
  WHERE id = user_id;
  
  -- Get the admin's organization
  SELECT organization_id INTO admin_org_id
  FROM profiles 
  WHERE id = auth.uid() 
  AND 'admin' = ANY(roles);
  
  -- Check if admin has permission (same organization)
  IF user_org_id IS NULL OR admin_org_id IS NULL OR user_org_id != admin_org_id THEN
    RETURN false;
  END IF;
  
  -- Update user status
  IF archive THEN
    UPDATE profiles 
    SET 
      is_active = false,
      archived_at = NOW(),
      archived_by = auth.uid()
    WHERE id = user_id;
  ELSE
    UPDATE profiles 
    SET 
      is_active = true,
      archived_at = NULL,
      archived_by = NULL
    WHERE id = user_id;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user roles (admin dashboard functionality)
CREATE OR REPLACE FUNCTION update_user_roles(user_id UUID, new_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  user_org_id UUID;
  admin_org_id UUID;
BEGIN
  -- Get the user's organization
  SELECT organization_id INTO user_org_id
  FROM profiles 
  WHERE id = user_id;
  
  -- Get the admin's organization
  SELECT organization_id INTO admin_org_id
  FROM profiles 
  WHERE id = auth.uid() 
  AND 'admin' = ANY(roles);
  
  -- Check if admin has permission (same organization)
  IF user_org_id IS NULL OR admin_org_id IS NULL OR user_org_id != admin_org_id THEN
    RETURN false;
  END IF;
  
  -- Validate roles
  IF NOT (new_roles <@ ARRAY['admin', 'coach', 'therapist', 'practitioner']) THEN
    RETURN false;
  END IF;
  
  -- Update user roles
  UPDATE profiles 
  SET roles = new_roles
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update organization information including contact details
CREATE OR REPLACE FUNCTION update_organization_info(
  org_id UUID, 
  logo_url TEXT DEFAULT NULL,
  website_url TEXT DEFAULT NULL,
  phone_number TEXT DEFAULT NULL,
  description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE organizations 
  SET 
    logo_url = COALESCE(update_organization_info.logo_url, organizations.logo_url),
    website_url = COALESCE(update_organization_info.website_url, organizations.website_url),
    phone_number = COALESCE(update_organization_info.phone_number, organizations.phone_number),
    description = COALESCE(update_organization_info.description, organizations.description),
    updated_at = NOW()
  WHERE id = org_id
    AND id IN (
      SELECT organization_id 
      FROM profiles 
      WHERE id = auth.uid() 
      AND 'admin' = ANY(roles)
    );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_organization_activity_overview(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_organization_info(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION archive_organization_user(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_roles(UUID, TEXT[]) TO authenticated;

-- Add indexes for admin dashboard performance
CREATE INDEX IF NOT EXISTS idx_profiles_org_active ON profiles(organization_id, is_active) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_last_activity_org ON profiles(organization_id, last_activity) WHERE organization_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON FUNCTION get_organization_activity_overview(UUID) IS 'Returns comprehensive member activity data for organization admin dashboard';
COMMENT ON FUNCTION get_organization_stats(UUID) IS 'Returns organization statistics for dashboard overview cards';
COMMENT ON FUNCTION update_organization_logo(UUID, TEXT) IS 'Updates organization logo URL (admin only)';
COMMENT ON FUNCTION archive_organization_user(UUID, BOOLEAN) IS 'Archives or reactivates organization users (admin only)';
COMMENT ON FUNCTION update_user_roles(UUID, TEXT[]) IS 'Updates user roles within organization (admin only)';

-- Add organization contact information fields
DO $$
BEGIN
  -- Add website_url column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'website_url') THEN
    ALTER TABLE organizations ADD COLUMN website_url TEXT;
  END IF;
  
  -- Add phone_number column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'phone_number') THEN
    ALTER TABLE organizations ADD COLUMN phone_number TEXT;
  END IF;
  
  -- Add description column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'description') THEN
    ALTER TABLE organizations ADD COLUMN description TEXT;
  END IF;
END $$;

-- Add validation constraints (safely)
DO $$
BEGIN
  -- Check if constraint already exists before adding it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'valid_website_url' 
    AND table_name = 'organizations'
  ) THEN
    ALTER TABLE organizations 
    ADD CONSTRAINT valid_website_url 
    CHECK (website_url IS NULL OR website_url ~ '^https?://.*');
  END IF;
END $$;

-- Create sample data for development testing (only if no organizations exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM organizations LIMIT 1) THEN
    -- Create sample organizations for development
    INSERT INTO organizations (id, name, slug, website_url, phone_number, description, max_users, active_user_count) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Demo Organization', 'demo-org', 'https://demo-org.com', '+1 (555) 123-4567', 'A demonstration organization for testing the virtue development platform', 40, 0),
    ('550e8400-e29b-41d4-a716-446655440002', 'Test Company', 'test-company', 'https://test-company.com', '+1 (555) 234-5678', 'Test company for organizational virtue development programs', 25, 0),
    ('550e8400-e29b-41d4-a716-446655440003', 'Sample Therapy Center', 'sample-therapy', 'https://sample-therapy.com', '+1 (555) 345-6789', 'Professional therapy center focused on character development and virtue-based healing', 15, 0);
    
    RAISE NOTICE 'Created sample organizations for development';
  END IF;
END $$;