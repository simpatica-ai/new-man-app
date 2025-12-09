-- Fix Organization Schema
-- This migration addresses missing columns and functions that were discovered during admin dashboard testing

-- Add missing columns to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create the update_organization_info function
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
  AND EXISTS (
    SELECT 1 FROM organizations WHERE id = org_id
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to use the function
GRANT EXECUTE ON FUNCTION update_organization_info(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Ensure storage bucket exists with proper settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'organization-assets', 
  'organization-assets', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];

-- Create storage policies for organization assets
DROP POLICY IF EXISTS "Anyone can upload to organization-assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view organization-assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update organization-assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete organization-assets" ON storage.objects;

CREATE POLICY "Anyone can upload to organization-assets" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'organization-assets');

CREATE POLICY "Anyone can view organization-assets" ON storage.objects
FOR SELECT USING (bucket_id = 'organization-assets');

CREATE POLICY "Anyone can update organization-assets" ON storage.objects
FOR UPDATE USING (bucket_id = 'organization-assets');

CREATE POLICY "Anyone can delete organization-assets" ON storage.objects
FOR DELETE USING (bucket_id = 'organization-assets');

-- Add comment explaining this migration
COMMENT ON TABLE organizations IS 'Organizations table with contact information and branding support';