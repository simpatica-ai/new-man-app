-- Add organization contact information fields
-- These fields will be used in reports and organization branding

-- Add website URL and phone number to organizations table
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
  
  -- Add description column for organization description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'description') THEN
    ALTER TABLE organizations ADD COLUMN description TEXT;
  END IF;
END $$;

-- Add validation constraints
ALTER TABLE organizations 
ADD CONSTRAINT valid_website_url 
CHECK (website_url IS NULL OR website_url ~ '^https?://.*');

-- Add comments for documentation
COMMENT ON COLUMN organizations.website_url IS 'Organization website URL for reports and branding';
COMMENT ON COLUMN organizations.phone_number IS 'Organization contact phone number for reports';
COMMENT ON COLUMN organizations.description IS 'Organization description for reports and public information';

-- Update the organization logo update function to handle contact info
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

-- Grant permission to use the function
GRANT EXECUTE ON FUNCTION update_organization_info(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Update sample data for development (only if organizations exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM organizations WHERE slug = 'simpatica-dev') THEN
    UPDATE organizations 
    SET 
      website_url = 'https://simpatica.ai',
      phone_number = '+1 (555) 123-4567',
      description = 'Simpatica AI - Virtue development platform for personal growth and character building'
    WHERE slug = 'simpatica-dev';
  END IF;
END $$;